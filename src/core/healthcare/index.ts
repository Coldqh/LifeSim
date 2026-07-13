import { applyMoneyDelta } from '../economy';
import { addMinutes, getElapsedMinutes, getTotalMinutes } from '../time';
import { getScheduleActivityFailure } from '../schedule';
import { applyNeedsDelta } from '../needs';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';
import type {
  ActiveMedicalCondition,
  MedicalAppointment,
  MedicalConditionDefinition,
  MedicalConditionId,
  MedicalOperationResult,
  MedicalProductUse,
  MedicalService,
  MedicalSeverity,
  MedicalState,
  SickLeave
} from '../../types/healthcare';
import type { LocationId, MedicalAppointmentId, ProductId } from '../../types/ids';
import type { NeedsState } from '../../types/needs';
import { getMedicalConditionDefinition } from '../../data/healthcare/conditions';

const MINUTES_IN_DAY = 1440;
const MEDICAL_HISTORY_LIMIT = 60;
const MEDICAL_APPOINTMENT_LIMIT = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function appointmentId(value: string): MedicalAppointmentId {
  return value as MedicalAppointmentId;
}

function appendHistory(state: MedicalState, totalMinutes: number, title: string, text: string): MedicalState {
  return {
    ...state,
    history: [
      { id: `medical_history_${totalMinutes}_${Math.random().toString(36).slice(2, 8)}`, totalMinutes, title, text },
      ...state.history
    ].slice(0, MEDICAL_HISTORY_LIMIT)
  };
}

export function createInitialMedicalState(totalMinutes = 0): MedicalState {
  return {
    conditions: [],
    appointments: [],
    prescriptions: [],
    history: [],
    lastProcessedTotalMinutes: Math.max(0, Math.floor(totalMinutes)),
    triggerCooldowns: {}
  };
}

export function getMedicalSeverityRank(severity: MedicalSeverity): number {
  if (severity === 'severe') return 3;
  if (severity === 'moderate') return 2;
  return 1;
}

export function getMedicalSeverityLabel(severity: MedicalSeverity): string {
  if (severity === 'severe') return 'Тяжёлое';
  if (severity === 'moderate') return 'Среднее';
  return 'Лёгкое';
}

export function getMedicalConditionName(id: MedicalConditionId): string {
  return getMedicalConditionDefinition(id)?.name ?? id;
}

export function getActiveMedicalCondition(state: MedicalState, id: MedicalConditionId): ActiveMedicalCondition | undefined {
  return state.conditions.find((entry) => entry.id === id);
}

export function hasMedicalCondition(state: MedicalState, id: MedicalConditionId): boolean {
  return Boolean(getActiveMedicalCondition(state, id));
}

export function addOrWorsenMedicalCondition(input: {
  state: MedicalState;
  conditionId: MedicalConditionId;
  severity: MedicalSeverity;
  source: ActiveMedicalCondition['source'];
  totalMinutes: number;
  diagnosed?: boolean;
}): { state: MedicalState; added: boolean; worsened: boolean } {
  const definition = getMedicalConditionDefinition(input.conditionId);
  if (!definition) return { state: input.state, added: false, worsened: false };
  const current = getActiveMedicalCondition(input.state, input.conditionId);
  const severityMultiplier = input.severity === 'severe' ? 1.55 : input.severity === 'moderate' ? 1.2 : 1;
  const recoveryHours = Math.ceil(definition.baseRecoveryHours * severityMultiplier);

  if (!current) {
    const condition: ActiveMedicalCondition = {
      id: input.conditionId,
      severity: input.severity,
      source: input.source,
      startedAtTotalMinutes: input.totalMinutes,
      recoveryHoursRemaining: recoveryHours,
      diagnosed: Boolean(input.diagnosed),
      treatmentProgress: 0,
      lastUpdatedTotalMinutes: input.totalMinutes
    };
    const state = appendHistory(
      { ...input.state, conditions: [condition, ...input.state.conditions] },
      input.totalMinutes,
      'Новое состояние',
      `${definition.name}: появились симптомы.`
    );
    return { state, added: true, worsened: false };
  }

  if (getMedicalSeverityRank(input.severity) <= getMedicalSeverityRank(current.severity)) {
    return { state: input.state, added: false, worsened: false };
  }

  const conditions = input.state.conditions.map((entry) => entry.id === input.conditionId
    ? {
        ...entry,
        severity: input.severity,
        recoveryHoursRemaining: Math.max(entry.recoveryHoursRemaining, recoveryHours),
        diagnosed: entry.diagnosed || Boolean(input.diagnosed),
        lastUpdatedTotalMinutes: input.totalMinutes
      }
    : entry);
  const state = appendHistory(
    { ...input.state, conditions },
    input.totalMinutes,
    'Состояние ухудшилось',
    `${definition.name}: тяжесть симптомов выросла.`
  );
  return { state, added: false, worsened: true };
}

function getRecoveryMultiplier(input: {
  needs: NeedsState;
  profile: 'active' | 'resting' | 'sleeping';
  diagnosed: boolean;
  treatmentProgress: number;
  sickLeaveActive: boolean;
}): number {
  let multiplier = input.profile === 'sleeping' ? 1.7 : input.profile === 'resting' ? 1.25 : 0.8;
  if (input.needs.hunger >= 40) multiplier += 0.12;
  if (input.needs.thirst >= 40) multiplier += 0.12;
  if (input.needs.energy >= 45) multiplier += 0.08;
  if (input.diagnosed) multiplier += 0.08;
  if (input.treatmentProgress > 0) multiplier += Math.min(0.55, input.treatmentProgress / 100);
  if (input.sickLeaveActive) multiplier += 0.2;
  return clamp(multiplier, 0.35, 2.6);
}

function getSeverityHealthDrain(definition: MedicalConditionDefinition, severity: MedicalSeverity, elapsedHours: number): number {
  const severityMultiplier = severity === 'severe' ? 1.8 : severity === 'moderate' ? 1.15 : 0.55;
  return definition.healthDrainPerDay * severityMultiplier * (elapsedHours / 24);
}

function getTriggerSeverity(value: number): MedicalSeverity {
  if (value <= 0) return 'severe';
  if (value <= 5) return 'moderate';
  return 'mild';
}

function canTrigger(state: MedicalState, conditionId: MedicalConditionId, totalMinutes: number): boolean {
  return (state.triggerCooldowns[conditionId] ?? 0) <= totalMinutes;
}

function markTriggerCooldown(state: MedicalState, conditionId: MedicalConditionId, totalMinutes: number, hours = 24): MedicalState {
  return {
    ...state,
    triggerCooldowns: { ...state.triggerCooldowns, [conditionId]: totalMinutes + hours * 60 }
  };
}

function applyNeedsTriggers(state: MedicalState, player: Player, totalMinutes: number): { state: MedicalState; messages: string[] } {
  let next = state;
  const messages: string[] = [];
  const triggers: Array<{ id: MedicalConditionId; value: number; source: ActiveMedicalCondition['source'] }> = [
    { id: 'dehydration', value: player.needs.thirst, source: 'needs' },
    { id: 'malnutrition', value: player.needs.hunger, source: 'needs' },
    { id: 'exhaustion', value: player.needs.energy, source: 'needs' }
  ];

  for (const trigger of triggers) {
    if (trigger.value > 10 || !canTrigger(next, trigger.id, totalMinutes)) continue;
    const applied = addOrWorsenMedicalCondition({
      state: next,
      conditionId: trigger.id,
      severity: getTriggerSeverity(trigger.value),
      source: trigger.source,
      totalMinutes
    });
    next = markTriggerCooldown(applied.state, trigger.id, totalMinutes, 18);
    if (applied.added || applied.worsened) messages.push(`${getMedicalConditionName(trigger.id)}: состояние требует внимания.`);
  }

  if (player.boxing.fatigue >= 85 && canTrigger(next, 'overtraining', totalMinutes)) {
    const applied = addOrWorsenMedicalCondition({
      state: next,
      conditionId: 'overtraining',
      severity: player.boxing.fatigue >= 95 ? 'severe' : 'moderate',
      source: 'boxing',
      totalMinutes
    });
    next = markTriggerCooldown(applied.state, 'overtraining', totalMinutes, 36);
    if (applied.added || applied.worsened) messages.push('Перетренированность: спортивную нагрузку нужно снизить.');
  }

  const coldRisk = (Math.floor(totalMinutes / 60) + player.needs.health + player.needs.energy) % 13;
  if (player.needs.health <= 40 && player.needs.energy <= 30 && coldRisk === 0 && canTrigger(next, 'common_cold', totalMinutes)) {
    const applied = addOrWorsenMedicalCondition({
      state: next,
      conditionId: 'common_cold',
      severity: player.needs.health <= 20 ? 'moderate' : 'mild',
      source: 'event',
      totalMinutes
    });
    next = markTriggerCooldown(applied.state, 'common_cold', totalMinutes, 72);
    if (applied.added || applied.worsened) messages.push('Появились симптомы простуды.');
  }

  return { state: next, messages };
}

export function processMedicalTime(input: {
  state: MedicalState;
  player: Player;
  fromTime: GameTime;
  toTime: GameTime;
  profile: 'active' | 'resting' | 'sleeping';
}): { state: MedicalState; player: Player; messages: string[]; resolvedConditionIds: MedicalConditionId[] } {
  const elapsedMinutes = getElapsedMinutes(input.fromTime, input.toTime);
  const totalMinutes = getTotalMinutes(input.toTime);
  if (elapsedMinutes <= 0) {
    const triggered = applyNeedsTriggers(input.state, input.player, totalMinutes);
    return { state: { ...triggered.state, lastProcessedTotalMinutes: totalMinutes }, player: input.player, messages: triggered.messages, resolvedConditionIds: [] };
  }

  const elapsedHours = elapsedMinutes / 60;
  const sickLeaveActive = Boolean(input.state.sickLeave?.active && input.toTime.day <= input.state.sickLeave.endsAtDay);
  let healthDrain = 0;
  const resolved: MedicalConditionId[] = [];
  const remaining: ActiveMedicalCondition[] = [];

  for (const condition of input.state.conditions) {
    const definition = getMedicalConditionDefinition(condition.id);
    if (!definition) continue;
    const recoveryMultiplier = getRecoveryMultiplier({
      needs: input.player.needs,
      profile: input.profile,
      diagnosed: condition.diagnosed,
      treatmentProgress: condition.treatmentProgress,
      sickLeaveActive
    });
    const recovery = elapsedHours * recoveryMultiplier;
    const nextHours = Math.max(0, condition.recoveryHoursRemaining - recovery);
    healthDrain += getSeverityHealthDrain(definition, condition.severity, elapsedHours);
    if (nextHours <= 0) {
      resolved.push(condition.id);
    } else {
      remaining.push({
        ...condition,
        recoveryHoursRemaining: nextHours,
        treatmentProgress: Math.max(0, condition.treatmentProgress - elapsedHours * 0.5),
        lastUpdatedTotalMinutes: totalMinutes
      });
    }
  }

  const newlyMissed = input.state.appointments.filter((appointment) =>
    appointment.status === 'scheduled' && totalMinutes > appointment.startsAtTotalMinutes + 180
  );
  const appointments = input.state.appointments.map((appointment) =>
    appointment.status === 'scheduled' && totalMinutes > appointment.startsAtTotalMinutes + 180
      ? { ...appointment, status: 'missed' as const }
      : appointment
  );
  let state: MedicalState = {
    ...input.state,
    conditions: remaining,
    appointments,
    sickLeave: input.state.sickLeave && input.toTime.day > input.state.sickLeave.endsAtDay
      ? { ...input.state.sickLeave, active: false }
      : input.state.sickLeave,
    lastProcessedTotalMinutes: totalMinutes
  };
  const messages: string[] = [];
  for (const appointment of newlyMissed) {
    state = appendHistory(state, totalMinutes, 'Пропущен приём', 'Запись в клинику закрыта из-за опоздания.');
    messages.push('Медицинский приём пропущен.');
  }
  for (const id of resolved) {
    const name = getMedicalConditionName(id);
    state = appendHistory(state, totalMinutes, 'Восстановление', `${name}: симптомы прошли.`);
    messages.push(`${name}: восстановление завершено.`);
  }

  const roundedHealthDrain = Math.round(healthDrain);
  const nextPlayer = roundedHealthDrain > 0
    ? { ...input.player, needs: applyNeedsDelta(input.player.needs, { health: -roundedHealthDrain }) }
    : input.player;

  const triggered = applyNeedsTriggers(state, nextPlayer, totalMinutes);
  state = triggered.state;
  messages.push(...triggered.messages);

  return { state, player: nextPlayer, messages, resolvedConditionIds: resolved };
}

function nextAppointmentStart(time: GameTime, service: MedicalService): number {
  const now = getTotalMinutes(time);
  const insideDay = time.hour * 60 + time.minute;
  const firstCandidateInsideDay = insideDay < 10 * 60
    ? 10 * 60
    : Math.ceil((insideDay + 60) / 30) * 30;

  for (let dayOffset = 0; dayOffset < 10; dayOffset += 1) {
    const candidateInsideDay = dayOffset === 0 ? firstCandidateInsideDay : 10 * 60;
    if (candidateInsideDay > 17 * 60) continue;
    const candidateTotal = now + dayOffset * MINUTES_IN_DAY + (candidateInsideDay - insideDay);
    if (candidateTotal < now) continue;
    const candidateTime = addMinutes(time, candidateTotal - now);
    const failure = getScheduleActivityFailure(service.schedule, candidateTime, service.durationMinutes, 'Приём');
    if (!failure) return candidateTotal;
  }

  return now + MINUTES_IN_DAY;
}

export function scheduleMedicalAppointment(input: {
  state: MedicalState;
  service: MedicalService;
  time: GameTime;
}): { state: MedicalState; result: MedicalOperationResult; appointment?: MedicalAppointment } {
  const existing = input.state.appointments.find((entry) => entry.status === 'scheduled' && entry.serviceId === input.service.id);
  if (existing) {
    return {
      state: input.state,
      result: { ok: false, title: 'Запись не создана', message: 'На эту услугу уже есть активная запись.', timeDeltaMinutes: 0 }
    };
  }
  const startsAtTotalMinutes = nextAppointmentStart(input.time, input.service);
  const appointment: MedicalAppointment = {
    id: appointmentId(`medical_appointment_${startsAtTotalMinutes}_${String(input.service.id)}`),
    serviceId: input.service.id,
    clinicLocationId: input.service.clinicLocationId,
    startsAtTotalMinutes,
    durationMinutes: input.service.durationMinutes,
    status: 'scheduled',
    createdAtTotalMinutes: getTotalMinutes(input.time)
  };
  const state = appendHistory({
    ...input.state,
    appointments: [appointment, ...input.state.appointments].slice(0, MEDICAL_APPOINTMENT_LIMIT)
  }, getTotalMinutes(input.time), 'Запись к врачу', `${input.service.name}: запись создана.`);
  return {
    state,
    appointment,
    result: { ok: true, title: 'Запись создана', message: `${input.service.name}. Приём назначен.`, timeDeltaMinutes: 0 }
  };
}

export function getMedicalAppointmentFailure(input: {
  state: MedicalState;
  service: MedicalService;
  time: GameTime;
  currentLocationId?: LocationId;
  playerMoney: number;
}): string | undefined {
  const appointment = input.state.appointments.find((entry) => entry.serviceId === input.service.id && entry.status === 'scheduled');
  if (!appointment) return 'Сначала запишись на приём.';
  if (input.currentLocationId !== appointment.clinicLocationId) return 'Нужно приехать в клинику.';
  const now = getTotalMinutes(input.time);
  if (now < appointment.startsAtTotalMinutes - 90) return 'До приёма ещё рано.';
  if (now > appointment.startsAtTotalMinutes + 180) return 'Запись пропущена.';
  if (input.playerMoney < input.service.price) return `Не хватает ${input.service.price - input.playerMoney} ₽.`;
  return getScheduleActivityFailure(input.service.schedule, input.time, input.service.durationMinutes, 'Приём');
}

export function attendMedicalAppointment(input: {
  state: MedicalState;
  player: Player;
  service: MedicalService;
  time: GameTime;
  currentLocationId?: LocationId;
}): { state: MedicalState; player: Player; time: GameTime; result: MedicalOperationResult; diagnosedIds: MedicalConditionId[] } {
  const failure = getMedicalAppointmentFailure({
    state: input.state,
    service: input.service,
    time: input.time,
    currentLocationId: input.currentLocationId,
    playerMoney: input.player.money
  });
  if (failure) {
    return {
      state: input.state,
      player: input.player,
      time: input.time,
      diagnosedIds: [],
      result: { ok: false, title: 'Приём недоступен', message: failure, timeDeltaMinutes: 0 }
    };
  }

  const appointment = input.state.appointments.find((entry) => entry.serviceId === input.service.id && entry.status === 'scheduled');
  if (!appointment) {
    return {
      state: input.state,
      player: input.player,
      time: input.time,
      diagnosedIds: [],
      result: { ok: false, title: 'Приём недоступен', message: 'Запись не найдена.', timeDeltaMinutes: 0 }
    };
  }

  const diagnosedIds = input.state.conditions
    .filter((condition) => input.service.diagnoses.includes(condition.id))
    .map((condition) => condition.id);
  const totalMinutes = getTotalMinutes(input.time);
  let state: MedicalState = {
    ...input.state,
    conditions: input.state.conditions.map((condition) => diagnosedIds.includes(condition.id)
      ? { ...condition, diagnosed: true, treatmentProgress: Math.max(10, condition.treatmentProgress) }
      : condition),
    appointments: input.state.appointments.map((entry) => entry.id === appointment.id ? { ...entry, status: 'completed' as const } : entry)
  };

  for (const conditionId of diagnosedIds) {
    const definition = getMedicalConditionDefinition(conditionId);
    const productId = definition?.recommendedProductIds[0];
    if (!productId) continue;
    const alreadyActive = state.prescriptions.some((entry) => entry.conditionId === conditionId && entry.productId === productId && entry.active);
    if (alreadyActive) continue;
    state = {
      ...state,
      prescriptions: [{
        id: `prescription_${totalMinutes}_${conditionId}`,
        conditionId,
        productId,
        issuedAtTotalMinutes: totalMinutes,
        recommendedUses: 2,
        completedUses: 0,
        active: true
      }, ...state.prescriptions].slice(0, 30)
    };
  }

  const diagnosisText = diagnosedIds.length > 0
    ? diagnosedIds.map(getMedicalConditionName).join(', ')
    : 'опасных состояний не выявлено';
  state = appendHistory(state, totalMinutes, input.service.name, `Результат: ${diagnosisText}.`);
  const time = addMinutes(input.time, input.service.durationMinutes);
  const player = {
    ...input.player,
    money: applyMoneyDelta(input.player.money, -input.service.price),
    needs: applyNeedsDelta(input.player.needs, { health: diagnosedIds.length > 0 ? 2 : 1, mood: 2 })
  };
  return {
    state,
    player,
    time,
    diagnosedIds,
    result: {
      ok: true,
      title: input.service.name,
      message: `Приём завершён. ${diagnosedIds.length > 0 ? `Диагноз: ${diagnosisText}.` : 'Серьёзных проблем не выявлено.'}`,
      timeDeltaMinutes: input.service.durationMinutes,
      moneyDelta: -input.service.price,
      needsDelta: { health: diagnosedIds.length > 0 ? 2 : 1, mood: 2 }
    }
  };
}

export function applyMedicalProduct(input: {
  state: MedicalState;
  productId: ProductId;
  medicalUse?: MedicalProductUse;
  totalMinutes: number;
}): { state: MedicalState; message?: string; appliedConditionIds: MedicalConditionId[] } {
  if (!input.medicalUse) return { state: input.state, appliedConditionIds: [] };
  const matching = input.state.conditions.filter((condition) => input.medicalUse?.conditionIds.includes(condition.id));
  if (matching.length === 0) {
    return { state: input.state, message: 'Лекарство не подходит к текущим симптомам.', appliedConditionIds: [] };
  }
  const diagnosedMatching = matching.filter((condition) => !input.medicalUse?.requiresDiagnosis || condition.diagnosed);
  if (diagnosedMatching.length === 0) {
    return { state: input.state, message: 'Для применения по назначению нужен диагноз врача.', appliedConditionIds: [] };
  }
  const ids = diagnosedMatching.map((entry) => entry.id);
  let state: MedicalState = {
    ...input.state,
    conditions: input.state.conditions.map((condition) => ids.includes(condition.id)
      ? {
          ...condition,
          recoveryHoursRemaining: Math.max(1, condition.recoveryHoursRemaining - input.medicalUse!.treatmentHours),
          treatmentProgress: clamp(condition.treatmentProgress + (input.medicalUse!.symptomRelief ?? 12), 0, 100),
          lastUpdatedTotalMinutes: input.totalMinutes
        }
      : condition),
    prescriptions: input.state.prescriptions.map((prescription) => prescription.productId === input.productId && ids.includes(prescription.conditionId)
      ? {
          ...prescription,
          completedUses: prescription.completedUses + 1,
          active: prescription.completedUses + 1 < prescription.recommendedUses
        }
      : prescription)
  };
  const names = ids.map(getMedicalConditionName).join(', ');
  state = appendHistory(state, input.totalMinutes, 'Лечение', `Применено средство. Цель: ${names}.`);
  return { state, message: `Лечение применено: ${names}.`, appliedConditionIds: ids };
}

export function applyProductMedicalRisk(input: {
  state: MedicalState;
  player: Player;
  productId: ProductId;
  totalMinutes: number;
}): { state: MedicalState; player: Player; message?: string } {
  let conditionId: MedicalConditionId | undefined;
  let severity: MedicalSeverity = 'mild';
  const hour = Math.floor((input.totalMinutes % MINUTES_IN_DAY) / 60);
  const productKey = String(input.productId);
  const deterministic = (input.totalMinutes + productKey.length * 17 + input.player.needs.health) % 100;

  if (productKey === 'energy_drink' && hour >= 20 && deterministic < 55) {
    conditionId = 'insomnia';
  } else if ((productKey === 'coffee_cup' || productKey === 'energy_drink') && input.player.needs.hunger <= 20 && deterministic < 30) {
    conditionId = 'gastritis_flare';
  } else if ((productKey === 'shawarma' || productKey === 'ready_meal') && input.player.needs.health <= 55 && deterministic < 12) {
    conditionId = 'food_poisoning';
    severity = input.player.needs.health <= 30 ? 'moderate' : 'mild';
  }

  if (!conditionId || !canTrigger(input.state, conditionId, input.totalMinutes)) {
    return { state: input.state, player: input.player };
  }
  const applied = addOrWorsenMedicalCondition({
    state: input.state,
    conditionId,
    severity,
    source: conditionId === 'food_poisoning' ? 'food' : conditionId === 'insomnia' ? 'sleep' : 'food',
    totalMinutes: input.totalMinutes
  });
  const state = markTriggerCooldown(applied.state, conditionId, input.totalMinutes, conditionId === 'food_poisoning' ? 96 : 48);
  if (!applied.added && !applied.worsened) return { state, player: input.player };
  return {
    state,
    player: { ...input.player, needs: applyNeedsDelta(input.player.needs, { health: conditionId === 'food_poisoning' ? -4 : -1, mood: -2 }) },
    message: `${getMedicalConditionName(conditionId)}: появились новые симптомы.`
  };
}

export function getMedicalActivityFailure(state: MedicalState, kind: 'work' | 'boxing_training' | 'sparring' | 'tournament'): string | undefined {
  if (kind === 'work' && state.sickLeave?.active) return `Открыт больничный до дня ${state.sickLeave.endsAtDay}.`;
  const blocking = state.conditions.find((condition) => {
    const definition = getMedicalConditionDefinition(condition.id);
    return definition?.blockedActivityKinds?.includes(kind) && getMedicalSeverityRank(condition.severity) >= 2;
  });
  if (!blocking) return undefined;
  return `${getMedicalConditionName(blocking.id)}: действие недоступно до восстановления.`;
}

export function applyWorkWhileSick(state: MedicalState, player: Player, totalMinutes: number): { state: MedicalState; player: Player; message?: string } {
  const serious = state.conditions.filter((condition) => getMedicalSeverityRank(condition.severity) >= 2);
  if (serious.length === 0) return { state, player };
  const nextState: MedicalState = {
    ...state,
    conditions: state.conditions.map((condition) => serious.some((entry) => entry.id === condition.id)
      ? { ...condition, recoveryHoursRemaining: condition.recoveryHoursRemaining + 4, lastUpdatedTotalMinutes: totalMinutes }
      : condition)
  };
  return {
    state: appendHistory(nextState, totalMinutes, 'Работа во время болезни', 'Нагрузка замедлила восстановление.'),
    player: { ...player, needs: applyNeedsDelta(player.needs, { health: -2, energy: -3 }) },
    message: 'Работа во время болезни: здоровье -2, восстановление замедлено.'
  };
}

export function issueSickLeave(input: { state: MedicalState; day: number; totalMinutes: number }): { state: MedicalState; result: MedicalOperationResult } {
  const eligible = input.state.conditions.filter((condition) => condition.diagnosed && getMedicalSeverityRank(condition.severity) >= 2);
  if (eligible.length === 0) {
    return { state: input.state, result: { ok: false, title: 'Больничный недоступен', message: 'Нужен подтверждённый диагноз средней или тяжёлой степени.', timeDeltaMinutes: 0 } };
  }
  const sickLeave: SickLeave = {
    issuedAtDay: input.day,
    endsAtDay: input.day + 2,
    active: true,
    conditionIds: eligible.map((entry) => entry.id)
  };
  const state = appendHistory({ ...input.state, sickLeave }, input.totalMinutes, 'Больничный', `Оформлен до дня ${sickLeave.endsAtDay}.`);
  return { state, result: { ok: true, title: 'Больничный оформлен', message: `Освобождение от работы до дня ${sickLeave.endsAtDay}.`, timeDeltaMinutes: 0 } };
}

export function applyBoxingMedicalRisk(input: {
  state: MedicalState;
  player: Player;
  totalMinutes: number;
  kind: 'sparring' | 'tournament';
  seed: number;
}): { state: MedicalState; player: Player; message?: string } {
  const fatigue = input.player.boxing.fatigue;
  const riskScore = (input.seed + Math.round(fatigue) + input.player.boxing.rating) % 100;
  const threshold = input.kind === 'tournament' ? 42 : 25;
  if (riskScore >= threshold) return { state: input.state, player: input.player };
  const conditionId: MedicalConditionId = riskScore < 8 ? 'facial_cut' : riskScore < 18 ? 'hand_contusion' : 'muscle_strain';
  const severity: MedicalSeverity = input.kind === 'tournament' && riskScore < 12 ? 'moderate' : 'mild';
  const applied = addOrWorsenMedicalCondition({
    state: input.state,
    conditionId,
    severity,
    source: 'boxing',
    totalMinutes: input.totalMinutes
  });
  if (!applied.added && !applied.worsened) return { state: applied.state, player: input.player };
  return {
    state: applied.state,
    player: { ...input.player, needs: applyNeedsDelta(input.player.needs, { health: severity === 'moderate' ? -5 : -2 }) },
    message: `${getMedicalConditionName(conditionId)} после ${input.kind === 'tournament' ? 'турнира' : 'спарринга'}.`
  };
}
