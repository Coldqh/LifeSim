import { applyNeedsDelta } from '../needs';
import { applyJobPromotion, getJobProgress } from '../jobs';
import { getCalendarDateForDay } from '../time';
import { addNpcMemory, applyRelationshipDelta, getNpcRelationship } from '../relationships';
import type { BusinessWorldState } from '../../types/business';
import type { MedicalState } from '../../types/healthcare';
import type { DistrictId, NpcId } from '../../types/ids';
import type {
  LifePeriodSummary,
  LifePhaseSnapshot,
  LifePhasesPanelState,
  LifePhasesState,
  LongTermLifeEvent,
  LongTermLifeEventHistoryEntry,
  LongTermLifeEventKind
} from '../../types/lifePhase';
import type { LifeGoalsState } from '../../types/lifeGoal';
import type { LifeProgressionState } from '../../types/lifeProgression';
import type { Player } from '../../types/player';
import type { PopulationState } from '../../types/population';
import type { SocialState } from '../../types/socialEvent';
import type { UniversityState } from '../../types/university';
import { longTermLifeEventDefinitions } from '../../data/lifePhases';
import { getJobById } from '../../data/cities/contentSelectors';

const MAX_ACTIVE_EVENTS = 3;
const MAX_HISTORY = 40;
const MAX_SUMMARIES = 8;
const MAX_TRIGGER_KEYS = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function averageKnowledge(university: UniversityState): number {
  const values = Object.values(university.enrollment?.subjectProgress ?? {}).map((entry) => entry?.knowledge ?? 0);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function academicDebtCount(university: UniversityState, day: number): number {
  return (university.enrollment?.assignments ?? []).filter((entry) => !entry.completed && (entry.missed || entry.dueDay < day)).length;
}

export function createLifePhaseSnapshot(input: {
  day: number;
  player: Player;
  university: UniversityState;
  business: BusinessWorldState;
  medical: MedicalState;
  social: SocialState;
  lifeGoals: LifeGoalsState;
}): LifePhaseSnapshot {
  const business = input.business.ownedBusiness;
  return {
    day: input.day,
    money: input.player.money,
    currentJobId: input.player.currentJobId,
    housingId: String(input.player.housingId),
    rentDebt: input.player.rentDebt,
    activeMedicalConditions: input.medical.conditions.length,
    completedGoalMilestones: input.lifeGoals.completedMilestoneIds.length,
    knownContacts: Object.keys(input.social.contacts).length,
    businessBalance: business?.balance,
    businessDebt: business?.debt,
    universityKnowledge: averageKnowledge(input.university),
    universityDebtCount: academicDebtCount(input.university, input.day)
  };
}

export function createInitialLifePhasesState(snapshot: LifePhaseSnapshot): LifePhasesState {
  return {
    version: 1,
    lastProcessedDay: Math.max(1, snapshot.day),
    rentMultiplier: 1,
    rentContractKey: undefined,
    activeEvents: [],
    history: [],
    weeklySummaries: [],
    monthlySummaries: [],
    handledTriggerKeys: [],
    lastWeeklySnapshot: snapshot,
    lastMonthlySnapshot: snapshot
  };
}

export function normalizeLifePhasesState(value: unknown, snapshot: LifePhaseSnapshot): LifePhasesState {
  const initial = createInitialLifePhasesState(snapshot);
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<LifePhasesState>;
  const activeEvents = Array.isArray(candidate.activeEvents)
    ? candidate.activeEvents.filter((entry): entry is LongTermLifeEvent => Boolean(
        entry && typeof entry === 'object' && typeof entry.id === 'string' && typeof entry.kind === 'string'
        && typeof entry.title === 'string' && typeof entry.description === 'string'
        && typeof entry.startedDay === 'number' && typeof entry.dueDay === 'number'
        && typeof entry.defaultChoiceId === 'string' && Array.isArray(entry.choices)
      )).slice(0, MAX_ACTIVE_EVENTS)
    : [];
  const history = Array.isArray(candidate.history)
    ? candidate.history.filter((entry): entry is LongTermLifeEventHistoryEntry => Boolean(
        entry && typeof entry === 'object' && typeof entry.id === 'string' && typeof entry.eventId === 'string'
        && typeof entry.kind === 'string' && typeof entry.title === 'string' && typeof entry.text === 'string'
        && typeof entry.resolvedDay === 'number'
      )).slice(0, MAX_HISTORY)
    : [];
  const summaries = (raw: unknown, kind: LifePeriodSummary['kind']): LifePeriodSummary[] => Array.isArray(raw)
    ? raw.filter((entry): entry is LifePeriodSummary => Boolean(
        entry && typeof entry === 'object' && entry.kind === kind && typeof entry.id === 'string'
        && typeof entry.fromDay === 'number' && typeof entry.toDay === 'number'
        && typeof entry.title === 'string' && Array.isArray(entry.lines)
      )).slice(0, MAX_SUMMARIES)
    : [];
  const legacySnapshot = (candidate as Partial<LifePhasesState> & { lastSummarySnapshot?: LifePhaseSnapshot }).lastSummarySnapshot;
  const storedWeeklySnapshot = candidate.lastWeeklySnapshot && typeof candidate.lastWeeklySnapshot === 'object'
    ? candidate.lastWeeklySnapshot
    : legacySnapshot && typeof legacySnapshot === 'object' ? legacySnapshot : snapshot;
  const storedMonthlySnapshot = candidate.lastMonthlySnapshot && typeof candidate.lastMonthlySnapshot === 'object'
    ? candidate.lastMonthlySnapshot
    : legacySnapshot && typeof legacySnapshot === 'object' ? legacySnapshot : snapshot;
  const normalizeSnapshot = (stored: LifePhaseSnapshot): LifePhaseSnapshot => ({
    ...snapshot,
    ...stored,
    day: typeof stored.day === 'number' ? Math.max(1, Math.floor(stored.day)) : snapshot.day
  });
  return {
    version: 1,
    lastProcessedDay: typeof candidate.lastProcessedDay === 'number'
      ? Math.min(snapshot.day, Math.max(1, Math.floor(candidate.lastProcessedDay)))
      : snapshot.day,
    rentMultiplier: typeof candidate.rentMultiplier === 'number' ? Math.min(1.4, Math.max(0.8, candidate.rentMultiplier)) : 1,
    rentContractKey: typeof candidate.rentContractKey === 'string' ? candidate.rentContractKey : undefined,
    activeEvents,
    history,
    weeklySummaries: summaries(candidate.weeklySummaries, 'week'),
    monthlySummaries: summaries(candidate.monthlySummaries, 'month'),
    handledTriggerKeys: Array.isArray(candidate.handledTriggerKeys)
      ? candidate.handledTriggerKeys.filter((entry): entry is string => typeof entry === 'string').slice(-MAX_TRIGGER_KEYS)
      : [],
    lastWeeklySnapshot: normalizeSnapshot(storedWeeklySnapshot),
    lastMonthlySnapshot: normalizeSnapshot(storedMonthlySnapshot)
  };
}

function hasRecentKind(state: LifePhasesState, kind: LongTermLifeEventKind, day: number): boolean {
  const cooldown = longTermLifeEventDefinitions[kind].cooldownDays;
  if (state.activeEvents.some((entry) => entry.kind === kind)) return true;
  return state.history.some((entry) => entry.kind === kind && day - entry.resolvedDay < cooldown);
}

function event(input: Omit<LongTermLifeEvent, 'id' | 'choices' | 'dueDay'> & { triggerKey: string; choiceIds: string[] }): LongTermLifeEvent {
  const definition = longTermLifeEventDefinitions[input.kind];
  return {
    ...input,
    id: `life_event_${input.kind}_${input.startedDay}_${input.triggerKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    dueDay: input.startedDay + definition.deadlineDays,
    choices: input.choiceIds.map((id) => definition.choices[id]).filter(Boolean)
  };
}

function getCareerEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  const jobId = input.player.currentJobId;
  if (!jobId || hasRecentKind(state, 'career_review', day)) return undefined;
  const job = getJobById(jobId);
  const reputation = input.progression.tracks.career.reputation;
  const unreliable = input.progression.consequences.some((entry) => entry.kind === 'career_unreliable');
  const shifts = input.player.completedShifts[jobId] ?? 0;
  const jobProgress = job ? getJobProgress(input.player, job) : undefined;
  if (reputation >= 72 && shifts >= 10 && jobProgress && !jobProgress.isMaxLevel && jobProgress.experienceRemaining === 0) {
    const key = `career_positive_${String(jobId)}_${jobProgress.nextLevel?.level ?? Math.floor(shifts / 10)}`;
    if (state.handledTriggerKeys.includes(key)) return undefined;
    return { key, event: event({ triggerKey: key, kind: 'career_review', tone: 'positive', variant: 'positive', title: 'Карьерный пересмотр', description: 'Работодатель готов повысить тебя и увеличить ответственность.', startedDay: day, defaultChoiceId: 'stay_role', choiceIds: ['accept_promotion', 'stay_role'], jobId }) };
  }
  if (reputation <= 38 || unreliable) {
    const key = `career_negative_${String(jobId)}_${Math.floor(day / 14)}`;
    if (state.handledTriggerKeys.includes(key)) return undefined;
    return { key, event: event({ triggerKey: key, kind: 'career_review', tone: 'critical', variant: 'negative', title: 'Предупреждение работодателя', description: 'Работодатель требует исправить надёжность. Без ответа трудовые отношения завершатся.', startedDay: day, defaultChoiceId: 'dismissal', choiceIds: ['performance_plan', 'leave_job'], jobId }) };
  }
  return undefined;
}

function getAcademicEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  const enrollment = input.university.enrollment;
  if (!enrollment || enrollment.completed || hasRecentKind(state, 'academic_review', day)) return undefined;
  const debt = academicDebtCount(input.university, day);
  const reputation = input.progression.tracks.education.reputation;
  if (debt >= 2 || reputation <= 35) {
    const key = `academic_negative_${String(enrollment.programId)}_${enrollment.semester}_${Math.floor(day / 14)}`;
    if (state.handledTriggerKeys.includes(key)) return undefined;
    return { key, event: event({ triggerKey: key, kind: 'academic_review', tone: 'critical', variant: 'negative', title: 'Академическое предупреждение', description: `Накоплено долгов: ${debt}. Университет требует принять меры до дня ${day + longTermLifeEventDefinitions.academic_review.deadlineDays}.`, startedDay: day, defaultChoiceId: 'academic_ignore', choiceIds: ['academic_focus', 'academic_ignore'] }) };
  }
  if (reputation >= 72 && enrollment.examsPassed > 0) {
    const key = `academic_positive_${String(enrollment.programId)}_${enrollment.semester}_${enrollment.examsPassed}`;
    if (state.handledTriggerKeys.includes(key)) return undefined;
    return { key, event: event({ triggerKey: key, kind: 'academic_review', tone: 'positive', variant: 'positive', title: 'Поддержка сильного студента', description: 'Университет отметил результаты и предлагает небольшую учебную выплату.', startedDay: day, defaultChoiceId: 'scholarship', choiceIds: ['scholarship'] }) };
  }
  return undefined;
}

function getRentEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  if (hasRecentKind(state, 'rent_review', day)) return undefined;
  const rentalContract = input.player.rentalContract;
  if (!rentalContract) return undefined;
  const startedDay = rentalContract.startedDay;
  const period = Math.floor((day - startedDay) / 56);
  if (period < 1) return undefined;
  const contractKey = `${String(input.player.housingId)}:${startedDay}`;
  const key = `rent_${contractKey}_${period}`;
  if (state.handledTriggerKeys.includes(key)) return undefined;
  return { key, event: event({ triggerKey: key, kind: 'rent_review', tone: 'warning', title: 'Пересмотр аренды', description: 'Владелец жилья повышает стоимость следующего периода. Нужно принять условия или попытаться договориться.', startedDay: day, defaultChoiceId: 'accept_rent', choiceIds: ['accept_rent', 'negotiate_rent'], sourceKey: contractKey }) };
}

function getHealthEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  if (hasRecentKind(state, 'health_recovery', day)) return undefined;
  const serious = input.medical.conditions.filter((entry) => entry.severity !== 'mild');
  if (serious.length === 0 && input.medical.conditions.length < 2) return undefined;
  const key = `health_${input.medical.conditions.map((entry) => entry.id).sort().join('_')}_${Math.floor(day / 10)}`;
  if (state.handledTriggerKeys.includes(key)) return undefined;
  return { key, event: event({ triggerKey: key, kind: 'health_recovery', tone: 'critical', title: 'Затяжное восстановление', description: 'Несколько проблем со здоровьем начали влиять на обычную жизнь. Нужен режим восстановления.', startedDay: day, defaultChoiceId: 'push_through', choiceIds: ['recovery_plan', 'push_through'] }) };
}

function getBusinessEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  const business = input.business.ownedBusiness;
  if (!business || hasRecentKind(state, 'business_review', day)) return undefined;
  const recent = business.reports.slice(0, 3);
  const net = recent.reduce((sum, report) => sum + report.netProfit, 0);
  if (business.debt > 0 || (recent.length >= 3 && net < 0)) {
    const key = `business_negative_${String(business.id)}_${Math.floor(day / 14)}`;
    if (state.handledTriggerKeys.includes(key)) return undefined;
    return { key, event: event({ triggerKey: key, kind: 'business_review', tone: 'critical', variant: 'negative', title: 'Кризис бизнеса', description: `Долг и слабые отчёты требуют решения. Текущий долг: ${Math.round(business.debt)} ₽.`, startedDay: day, defaultChoiceId: 'business_ignore', choiceIds: ['cut_costs', 'business_ignore'] }) };
  }
  if (recent.length >= 3 && net > 8000 && business.reputation >= 60) {
    const key = `business_positive_${String(business.id)}_${Math.floor(day / 21)}`;
    if (state.handledTriggerKeys.includes(key)) return undefined;
    return { key, event: event({ triggerKey: key, kind: 'business_review', tone: 'positive', variant: 'positive', title: 'Период роста бизнеса', description: 'Последние отчёты прибыльны. Можно усилить бизнес или забрать часть результата себе.', startedDay: day, defaultChoiceId: 'reinvest_growth', choiceIds: ['reinvest_growth', 'take_profit'] }) };
  }
  return undefined;
}

function knownNpcIds(social: SocialState): NpcId[] {
  return Object.values(social.contacts).map((entry) => entry.npcId);
}

function getSocialDepartureEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  if (day < 30 || hasRecentKind(state, 'social_departure', day)) return undefined;
  const contacts = knownNpcIds(input.social);
  if (!contacts.length || input.cityDistrictIds.length < 2) return undefined;
  const npcId = contacts[(day + input.population.seed) % contacts.length];
  const npc = input.population.npcs.find((entry) => entry.id === npcId);
  if (!npc) return undefined;
  const targets = input.cityDistrictIds.filter((id) => id !== npc.homeDistrictId);
  const targetDistrictId = targets[(day + String(npcId).length) % targets.length];
  if (!targetDistrictId) return undefined;
  const key = `departure_${String(npcId)}_${Math.floor(day / 42)}`;
  if (state.handledTriggerKeys.includes(key)) return undefined;
  return { key, event: event({ triggerKey: key, kind: 'social_departure', tone: 'warning', title: `${npc.firstName} готовится к переезду`, description: 'Знакомый меняет район. После переезда случайные встречи станут реже.', startedDay: day, defaultChoiceId: 'let_go', choiceIds: ['stay_in_touch', 'let_go'], npcId, targetDistrictId }) };
}

function getSocialGroupEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  if (hasRecentKind(state, 'social_group_crisis', day)) return undefined;
  const relationships = Object.values(input.social.relationships).filter((entry) => entry.familiarity >= 10);
  if (relationships.length < 2) return undefined;
  const averageTension = relationships.reduce((sum, entry) => sum + entry.tension, 0) / relationships.length;
  if (averageTension < 28 && input.progression.tracks.social.reputation >= 40) return undefined;
  const memberNpcIds = relationships.sort((a, b) => b.tension - a.tension).slice(0, 4).map((entry) => entry.npcId);
  const key = `group_crisis_${Math.floor(day / 35)}_${memberNpcIds.map(String).join('_')}`;
  if (state.handledTriggerKeys.includes(key)) return undefined;
  return { key, event: event({ triggerKey: key, kind: 'social_group_crisis', tone: 'warning', title: 'Напряжение в окружении', description: 'Несколько знакомых втянуты в общий конфликт. Молчание тоже станет выбором.', startedDay: day, defaultChoiceId: 'step_back', choiceIds: ['mediate_group', 'step_back'], memberNpcIds }) };
}

function getGoalEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  const count = input.lifeGoals.completedMilestoneIds.length;
  if (count <= 0 || hasRecentKind(state, 'goal_milestone', day)) return undefined;
  const key = `goal_milestone_${count}`;
  if (state.handledTriggerKeys.includes(key)) return undefined;
  return { key, event: event({ triggerKey: key, kind: 'goal_milestone', tone: 'positive', title: 'Важный этап пройден', description: 'Один из этапов жизненной цели завершён. Реши, как зафиксировать этот момент.', startedDay: day, defaultChoiceId: 'keep_focus', choiceIds: ['celebrate_milestone', 'keep_focus'] }) };
}

function createNextEvent(input: ProcessLifePhasesInput, state: LifePhasesState, day: number): { event: LongTermLifeEvent; key: string } | undefined {
  if (state.activeEvents.length >= MAX_ACTIVE_EVENTS) return undefined;
  return getCareerEvent(input, state, day)
    ?? getAcademicEvent(input, state, day)
    ?? getHealthEvent(input, state, day)
    ?? getBusinessEvent(input, state, day)
    ?? getRentEvent(input, state, day)
    ?? getSocialGroupEvent(input, state, day)
    ?? getSocialDepartureEvent(input, state, day)
    ?? getGoalEvent(input, state, day);
}

function summaryLines(previous: LifePhaseSnapshot, current: LifePhaseSnapshot): string[] {
  const lines: string[] = [];
  const moneyDelta = current.money - previous.money;
  if (moneyDelta !== 0) lines.push(`Деньги: ${moneyDelta > 0 ? '+' : ''}${Math.round(moneyDelta)} ₽.`);
  if (String(current.currentJobId ?? '') !== String(previous.currentJobId ?? '')) {
    lines.push(current.currentJobId ? 'Изменилась работа.' : 'Работа завершена.');
  }
  if (current.housingId !== previous.housingId) lines.push('Произошёл переезд.');
  if (current.rentDebt !== previous.rentDebt) lines.push(`Долг по аренде: ${Math.round(current.rentDebt)} ₽.`);
  if (current.activeMedicalConditions !== previous.activeMedicalConditions) lines.push(`Активных проблем со здоровьем: ${current.activeMedicalConditions}.`);
  if (current.completedGoalMilestones > previous.completedGoalMilestones) lines.push(`Завершено этапов жизненной цели: +${current.completedGoalMilestones - previous.completedGoalMilestones}.`);
  if (current.knownContacts !== previous.knownContacts) lines.push(`Известных контактов: ${current.knownContacts}.`);
  if ((current.businessBalance ?? 0) !== (previous.businessBalance ?? 0)) lines.push(`Баланс бизнеса: ${Math.round(current.businessBalance ?? 0)} ₽.`);
  if (current.universityDebtCount !== previous.universityDebtCount) lines.push(`Учебных долгов: ${current.universityDebtCount}.`);
  if (!lines.length) lines.push('Неделя прошла без крупных личных изменений.');
  return lines;
}

function createSummary(kind: LifePeriodSummary['kind'], previous: LifePhaseSnapshot, current: LifePhaseSnapshot): LifePeriodSummary {
  const date = getCalendarDateForDay(current.day);
  return {
    id: `life_summary_${kind}_${previous.day}_${current.day}`,
    kind,
    fromDay: previous.day,
    toDay: current.day,
    title: kind === 'week' ? `Итоги недели · день ${current.day}` : `Итоги месяца · ${date.month}.${date.year}`,
    lines: summaryLines(previous, current)
  };
}

function endEmployment(player: Player, day: number): Player {
  const career = player.career;
  const active = career?.activeEmployment;
  if (!active) return { ...player, currentJobId: undefined };
  const ended = { ...active, status: 'ended' as const, endedDay: day, endReason: 'dismissed' as const };
  return {
    ...player,
    currentJobId: undefined,
    career: {
      activeEmployment: undefined,
      employmentHistory: career.employmentHistory.map((entry) => entry.id === ended.id ? ended : entry)
    }
  };
}

export type LifePhaseDomains = {
  player: Player;
  university: UniversityState;
  business: BusinessWorldState;
  medical: MedicalState;
  population: PopulationState;
  social: SocialState;
  progression: LifeProgressionState;
};

export type ResolveLifePhaseResult = LifePhaseDomains & {
  state: LifePhasesState;
  historyEntry: LongTermLifeEventHistoryEntry;
  message: string;
};

export function resolveLongTermLifeEvent(input: LifePhaseDomains & {
  state: LifePhasesState;
  eventId: string;
  choiceId: string;
  day: number;
  expired?: boolean;
}): ResolveLifePhaseResult | undefined {
  const activeEvent = input.state.activeEvents.find((entry) => entry.id === input.eventId);
  if (!activeEvent) return undefined;
  const choice = activeEvent.choices.find((entry) => entry.id === input.choiceId)
    ?? longTermLifeEventDefinitions[activeEvent.kind].choices[input.choiceId];
  if (!choice && input.choiceId !== activeEvent.defaultChoiceId) return undefined;

  let player = input.player;
  let university = input.university;
  let business = input.business;
  let medical = input.medical;
  let population = input.population;
  let social = input.social;
  let progression = input.progression;
  let rentMultiplier = input.state.rentMultiplier;
  let rentContractKey = input.state.rentContractKey;
  let resultText = choice?.description ?? 'Срок ответа истёк, решение принято автоматически.';

  if (activeEvent.kind === 'career_review') {
    if (input.choiceId === 'accept_promotion' && activeEvent.jobId) {
      const job = getJobById(activeEvent.jobId);
      const promotion = job ? applyJobPromotion({ player, job }) : undefined;
      if (promotion?.result.ok) {
        player = { ...promotion.player, needs: applyNeedsDelta(promotion.player.needs, { mood: 6, energy: -4 }) };
        resultText = `Ты принял повышение: ${promotion.result.nextTitle}.`;
      } else {
        resultText = promotion?.result.messages[0] ?? 'Повышение больше недоступно.';
      }
    } else if (input.choiceId === 'performance_plan') {
      player = { ...player, needs: applyNeedsDelta(player.needs, { mood: -3 }) };
      resultText = 'Работа сохранена. Предупреждение снято, но ближайшие недели потребуют стабильности.';
    } else if (input.choiceId === 'leave_job' || input.choiceId === 'dismissal') {
      player = endEmployment(player, input.day);
      resultText = input.choiceId === 'dismissal' ? 'Работодатель закрыл трудовые отношения.' : 'Ты ушёл с работы до решения работодателя.';
    }
  } else if (activeEvent.kind === 'academic_review') {
    if (input.choiceId === 'scholarship') {
      player = { ...player, money: player.money + 3000, needs: applyNeedsDelta(player.needs, { mood: 5 }) };
      resultText = 'Университет выплатил 3 000 ₽ за сильные результаты.';
    } else if (input.choiceId === 'academic_focus' && university.enrollment) {
      const target = university.enrollment.assignments.find((entry) => !entry.completed && (entry.missed || entry.dueDay < input.day));
      university = {
        ...university,
        enrollment: {
          ...university.enrollment,
          studyLoad: clamp(university.enrollment.studyLoad - 10, 0, 100),
          assignments: university.enrollment.assignments.map((entry) => entry.id === target?.id ? { ...entry, completed: true, missed: false } : entry)
        }
      };
      player = { ...player, money: Math.max(0, player.money - 1000), needs: applyNeedsDelta(player.needs, { mood: -2, energy: -5 }) };
      resultText = target ? 'Ты оплатил подготовку и закрыл один учебный долг.' : 'Ты снизил учебную нагрузку и составил план восстановления.';
    } else if (input.choiceId === 'academic_ignore') {
      if (university.enrollment) university = { ...university, enrollment: { ...university.enrollment, studyLoad: clamp(university.enrollment.studyLoad + 15, 0, 100) } };
      resultText = 'Академическое давление усилилось.';
    }
  } else if (activeEvent.kind === 'rent_review') {
    const existingMultiplier = input.state.rentContractKey === activeEvent.sourceKey
      ? input.state.rentMultiplier
      : 1;
    rentContractKey = activeEvent.sourceKey;
    if (input.choiceId === 'negotiate_rent') {
      const strongPosition = progression.tracks.independence.reputation >= 60;
      const increase = strongPosition ? 1.04 : 1.12;
      rentMultiplier = Math.min(1.4, Math.round(existingMultiplier * increase * 1000) / 1000);
      player = { ...player, needs: applyNeedsDelta(player.needs, { mood: strongPosition ? 2 : -3 }) };
      resultText = strongPosition ? 'Удалось ограничить очередное повышение аренды до 4%.' : 'Переговоры не помогли: аренда выросла ещё на 12%.';
    } else {
      rentMultiplier = Math.min(1.4, Math.round(existingMultiplier * 1.1 * 1000) / 1000);
      resultText = 'Новые условия приняты. Аренда выросла ещё на 10%.';
    }
  } else if (activeEvent.kind === 'health_recovery') {
    if (input.choiceId === 'recovery_plan') {
      medical = { ...medical, conditions: medical.conditions.map((entry) => ({ ...entry, recoveryHoursRemaining: Math.max(1, Math.round(entry.recoveryHoursRemaining * 0.78)), treatmentProgress: Math.min(100, entry.treatmentProgress + 12) })) };
      player = { ...player, needs: applyNeedsDelta(player.needs, { energy: 8, mood: -2 }) };
      resultText = 'Режим восстановления ускорил лечение.';
    } else {
      medical = { ...medical, conditions: medical.conditions.map((entry) => ({ ...entry, recoveryHoursRemaining: entry.recoveryHoursRemaining + 12 })) };
      player = { ...player, needs: applyNeedsDelta(player.needs, { health: -8, energy: -8 }) };
      resultText = 'Состояние ухудшилось из-за продолжения прежнего темпа.';
    }
  } else if (activeEvent.kind === 'business_review' && business.ownedBusiness) {
    const owned = business.ownedBusiness;
    if (input.choiceId === 'reinvest_growth') {
      const investment = Math.min(5000, owned.balance);
      business = { ...business, ownedBusiness: { ...owned, balance: owned.balance - investment, reputation: clamp(owned.reputation + 6, 0, 100) } };
      resultText = `В развитие вложено ${investment} ₽. Репутация бизнеса выросла.`;
    } else if (input.choiceId === 'take_profit') {
      const amount = Math.min(3000, Math.floor(owned.balance * 0.2));
      business = { ...business, ownedBusiness: { ...owned, balance: owned.balance - amount } };
      player = { ...player, money: player.money + amount };
      resultText = `Из бизнеса выведено ${amount} ₽.`;
    } else if (input.choiceId === 'cut_costs') {
      business = { ...business, ownedBusiness: { ...owned, debt: Math.max(0, Math.round(owned.debt * 0.8)), reputation: clamp(owned.reputation - 5, 0, 100) } };
      player = { ...player, needs: applyNeedsDelta(player.needs, { mood: -4 }) };
      resultText = 'Расходы сокращены. Долг уменьшился, но репутация пострадала.';
    } else {
      business = { ...business, ownedBusiness: { ...owned, debt: owned.debt + 2000 } };
      resultText = 'Кризис проигнорирован. Долг бизнеса вырос на 2 000 ₽.';
    }
  } else if (activeEvent.kind === 'social_departure' && activeEvent.npcId && activeEvent.targetDistrictId) {
    population = { ...population, npcs: population.npcs.map((npc) => npc.id === activeEvent.npcId ? { ...npc, homeDistrictId: activeEvent.targetDistrictId! } : npc) };
    const relationship = getNpcRelationship(social, activeEvent.npcId);
    const nextRelationship = addNpcMemory(
      applyRelationshipDelta(relationship, input.choiceId === 'stay_in_touch' ? { trust: 5, affinity: 4 } : { tension: 3, affinity: -2 }),
      { key: `departure_${activeEvent.id}`, day: input.day, tone: input.choiceId === 'stay_in_touch' ? 'positive' : 'neutral', text: input.choiceId === 'stay_in_touch' ? 'Перед переездом вы договорились не терять связь.' : 'Переезд прошёл без отдельного разговора.' }
    );
    social = { ...social, relationships: { ...social.relationships, [String(activeEvent.npcId)]: nextRelationship } };
    resultText = input.choiceId === 'stay_in_touch' ? 'Знакомый переехал, но связь стала крепче.' : 'Знакомый переехал в другой район.';
  } else if (activeEvent.kind === 'social_group_crisis') {
    const memberIds = activeEvent.memberNpcIds ?? [];
    const relationships = { ...social.relationships };
    for (const npcId of memberIds) {
      const relationship = getNpcRelationship(social, npcId);
      relationships[String(npcId)] = applyRelationshipDelta(relationship, input.choiceId === 'mediate_group' ? { trust: 2, tension: -4 } : { tension: 3 });
    }
    social = { ...social, relationships };
    player = { ...player, needs: applyNeedsDelta(player.needs, input.choiceId === 'mediate_group' ? { mood: -2, energy: -3 } : { mood: -1 }) };
    resultText = input.choiceId === 'mediate_group' ? 'Напряжение внутри круга снизилось.' : 'Конфликт продолжился без твоего участия.';
  } else if (activeEvent.kind === 'goal_milestone') {
    if (input.choiceId === 'celebrate_milestone' && player.money >= 600) {
      player = { ...player, money: player.money - 600, needs: applyNeedsDelta(player.needs, { mood: 9 }) };
      resultText = 'Ты отметил важный этап и восстановил настроение.';
    } else {
      player = { ...player, needs: applyNeedsDelta(player.needs, { mood: 3 }) };
      resultText = 'Этап зафиксирован. Ты продолжаешь движение к цели.';
    }
  }

  const historyEntry: LongTermLifeEventHistoryEntry = {
    id: `life_event_history_${activeEvent.id}_${input.day}`,
    eventId: activeEvent.id,
    kind: activeEvent.kind,
    title: activeEvent.title,
    text: resultText,
    startedDay: activeEvent.startedDay,
    resolvedDay: input.day,
    choiceId: input.choiceId,
    expired: Boolean(input.expired)
  };
  return {
    player,
    university,
    business,
    medical,
    population,
    social,
    progression,
    state: {
      ...input.state,
      rentMultiplier,
      rentContractKey,
      activeEvents: input.state.activeEvents.filter((entry) => entry.id !== activeEvent.id),
      history: [historyEntry, ...input.state.history].slice(0, MAX_HISTORY)
    },
    historyEntry,
    message: resultText
  };
}

export type ProcessLifePhasesInput = LifePhaseDomains & {
  state: LifePhasesState;
  fromDay: number;
  toDay: number;
  lifeGoals: LifeGoalsState;
  cityDistrictIds: DistrictId[];
};

export type ProcessLifePhasesResult = LifePhaseDomains & {
  state: LifePhasesState;
  startedEvents: LongTermLifeEvent[];
  resolvedEntries: LongTermLifeEventHistoryEntry[];
  summaries: LifePeriodSummary[];
};

export function processLifePhasesTime(input: ProcessLifePhasesInput): ProcessLifePhasesResult {
  let state = normalizeLifePhasesState(input.state, createLifePhaseSnapshot({ day: input.toDay, player: input.player, university: input.university, business: input.business, medical: input.medical, social: input.social, lifeGoals: input.lifeGoals }));
  let player = input.player;
  let university = input.university;
  let business = input.business;
  let medical = input.medical;
  let population = input.population;
  let social = input.social;
  let progression = input.progression;
  const startedEvents: LongTermLifeEvent[] = [];
  const resolvedEntries: LongTermLifeEventHistoryEntry[] = [];
  const summaries: LifePeriodSummary[] = [];
  const firstDay = Math.max(state.lastProcessedDay + 1, input.fromDay + 1);

  for (let day = firstDay; day <= input.toDay; day += 1) {
    const expiredEvents = state.activeEvents.filter((entry) => entry.dueDay < day);
    for (const activeEvent of expiredEvents) {
      const resolved = resolveLongTermLifeEvent({ state, player, university, business, medical, population, social, progression, eventId: activeEvent.id, choiceId: activeEvent.defaultChoiceId, day, expired: true });
      if (!resolved) continue;
      ({ state, player, university, business, medical, population, social, progression } = resolved);
      resolvedEntries.push(resolved.historyEntry);
    }

    const snapshot = createLifePhaseSnapshot({ day, player, university, business, medical, social, lifeGoals: input.lifeGoals });
    const previousDate = getCalendarDateForDay(Math.max(1, day - 1));
    const currentDate = getCalendarDateForDay(day);
    const weeklyBoundary = day > 1 && (day - 1) % 7 === 0;
    const monthlyBoundary = previousDate.month !== currentDate.month || previousDate.year !== currentDate.year;
    if (weeklyBoundary || monthlyBoundary) {
      if (weeklyBoundary) {
        const created = createSummary('week', state.lastWeeklySnapshot, snapshot);
        state = {
          ...state,
          weeklySummaries: [created, ...state.weeklySummaries].slice(0, MAX_SUMMARIES),
          lastWeeklySnapshot: snapshot
        };
        summaries.push(created);
      }
      if (monthlyBoundary) {
        const created = createSummary('month', state.lastMonthlySnapshot, snapshot);
        state = {
          ...state,
          monthlySummaries: [created, ...state.monthlySummaries].slice(0, MAX_SUMMARIES),
          lastMonthlySnapshot: snapshot
        };
        summaries.push(created);
      }
    }

    const next = createNextEvent({ ...input, state, player, university, business, medical, population, social, progression }, state, day);
    if (next) {
      state = {
        ...state,
        activeEvents: [...state.activeEvents, next.event].slice(0, MAX_ACTIVE_EVENTS),
        handledTriggerKeys: [...state.handledTriggerKeys, next.key].slice(-MAX_TRIGGER_KEYS)
      };
      startedEvents.push(next.event);
    }
  }

  return {
    state: { ...state, lastProcessedDay: Math.max(state.lastProcessedDay, input.toDay) },
    player,
    university,
    business,
    medical,
    population,
    social,
    progression,
    startedEvents,
    resolvedEntries,
    summaries
  };
}

export function createLifePhasesPanelState(state: LifePhasesState): LifePhasesPanelState {
  return {
    state,
    activeEvents: [...state.activeEvents].sort((left, right) => left.dueDay - right.dueDay),
    latestWeeklySummary: state.weeklySummaries[0],
    latestMonthlySummary: state.monthlySummaries[0],
    recentHistory: state.history.slice(0, 6)
  };
}
