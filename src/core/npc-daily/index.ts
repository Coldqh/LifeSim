import type { CityId } from '../../types/ids';
import type {
  Npc,
  NpcActivityProfile,
  NpcDailyOutcome,
  NpcLifeState
} from '../../types/npc';
import type { PopulationState } from '../../types/population';
import type { GameTime, Weekday } from '../../types/time';
import { fromTotalMinutes } from '../time';
import { npcDailyProfileRules, npcDailySimulationRules } from '../../data/population/npcDailyRules';

const MINUTES_IN_DAY = 24 * 60;
const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export type NpcDailyEventKind = 'illness' | 'work_warning' | 'job_lost' | 'academic_warning';

export type NpcDailyEvent = {
  id: string;
  day: number;
  npcId: Npc['id'];
  cityId?: CityId;
  kind: NpcDailyEventKind;
  title: string;
  text: string;
};

export type NpcActivityView = {
  label: string;
  availableNow: boolean;
  locationId?: import('../../types/ids').LocationId;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicPercent(seed: number, key: string): number {
  const mixed = (hashString(key) ^ seed) >>> 0;
  return (Math.imul(mixed, 1664525) + 1013904223 >>> 0) % 100;
}

function outcome(day: number, kind: NpcDailyOutcome['kind'], text: string): NpcDailyOutcome {
  return { day, kind, text };
}

export function createInitialNpcLifeState(input: {
  npcId: Npc['id'] | string;
  activityProfile: NpcActivityProfile;
  day: number;
  reliability?: number;
}): NpcLifeState {
  const rule = npcDailyProfileRules[input.activityProfile];
  const seed = hashString(String(input.npcId));
  return {
    energy: 62 + seed % 29,
    health: 72 + seed % 24,
    money: rule.startingMoney + seed % 8_000,
    reliability: clamp(input.reliability ?? 45 + seed % 46),
    studyProgress: input.activityProfile === 'student' ? seed % 18 : 0,
    missedCommitments: 0,
    warningCount: 0,
    jobSearchDays: input.activityProfile === 'unemployed' ? seed % 4 : 0,
    lastProcessedDay: Math.max(1, Math.floor(input.day))
  };
}

export function normalizeNpcLifeState(input: {
  value: unknown;
  npcId: Npc['id'] | string;
  activityProfile: NpcActivityProfile;
  day: number;
  reliability?: number;
}): NpcLifeState {
  const fallback = createInitialNpcLifeState(input);
  if (!input.value || typeof input.value !== 'object') return fallback;
  const candidate = input.value as Partial<NpcLifeState>;
  return {
    energy: clamp(Number(candidate.energy ?? fallback.energy)),
    health: clamp(Number(candidate.health ?? fallback.health)),
    money: Math.max(0, Math.round(Number(candidate.money ?? fallback.money))),
    reliability: clamp(Number(candidate.reliability ?? fallback.reliability)),
    studyProgress: Math.max(0, Math.round(Number(candidate.studyProgress ?? fallback.studyProgress))),
    missedCommitments: Math.max(0, Math.round(Number(candidate.missedCommitments ?? 0))),
    warningCount: Math.max(0, Math.round(Number(candidate.warningCount ?? 0))),
    jobSearchDays: Math.max(0, Math.round(Number(candidate.jobSearchDays ?? fallback.jobSearchDays))),
    lastProcessedDay: Math.min(input.day, Math.max(1, Math.round(Number(candidate.lastProcessedDay ?? input.day)))),
    sickUntilDay: typeof candidate.sickUntilDay === 'number' ? Math.max(1, Math.round(candidate.sickUntilDay)) : undefined,
    lastOutcome: candidate.lastOutcome && typeof candidate.lastOutcome === 'object'
      ? {
          day: Math.max(1, Math.round(Number(candidate.lastOutcome.day ?? input.day))),
          kind: candidate.lastOutcome.kind ?? 'rested',
          text: String(candidate.lastOutcome.text ?? '')
        }
      : undefined
  };
}

function isWorkday(npc: Npc, time: GameTime): boolean {
  return Boolean(npc.employment?.workdays.includes(time.weekday));
}

function processNpcDay(input: { npc: Npc; day: number; seed: number }): { npc: Npc; events: NpcDailyEvent[] } {
  const { day, seed } = input;
  let npc = input.npc;
  let life = { ...npc.life };
  const events: NpcDailyEvent[] = [];
  const time = fromTotalMinutes((day - 1) * MINUTES_IN_DAY + 12 * 60);
  const profileRule = npcDailyProfileRules[npc.activityProfile];
  const isAlreadySick = (life.sickUntilDay ?? 0) >= day;
  const sicknessPressure = Math.max(0, 45 - life.health) + Math.max(0, 30 - life.energy);
  const sicknessChance = npcDailySimulationRules.baseSicknessChancePercent + Math.floor(sicknessPressure / 4);
  const sicknessRoll = deterministicPercent(seed, `${npc.id}:${day}:sick`);
  const becameSick = !isAlreadySick && sicknessRoll < sicknessChance;
  const sick = isAlreadySick || becameSick;

  life.money = Math.max(0, life.money - profileRule.dailyExpense);
  life.energy = clamp(life.energy + profileRule.restRecovery);
  life.health = clamp(life.health + (life.energy >= 45 ? 2 : -2));

  if (becameSick) {
    life.sickUntilDay = day + 1;
    life.health = clamp(life.health - 8);
    life.lastOutcome = outcome(day, 'sick', 'Заболел и остался дома.');
    events.push({
      id: `npc_daily_illness_${npc.id}_${day}`,
      day,
      npcId: npc.id,
      kind: 'illness',
      title: 'Человек заболел',
      text: `${npc.firstName} ${npc.lastName} заболел и отменил планы.`
    });
  }

  if (npc.activityProfile === 'worker' && npc.employment && isWorkday(npc, time)) {
    const missChance = Math.max(3, 30 - Math.floor(life.reliability / 4) + Math.floor(Math.max(0, 35 - life.energy) / 3));
    const missed = sick || deterministicPercent(seed, `${npc.id}:${day}:work`) < missChance;
    if (missed) {
      life.missedCommitments += 1;
      life.warningCount += 1;
      life.reliability = clamp(life.reliability - 5);
      life.lastOutcome = outcome(day, 'missed_work', 'Пропустил рабочую смену.');
      if (life.warningCount === npcDailySimulationRules.missedWorkWarningThreshold) {
        events.push({
          id: `npc_daily_work_warning_${npc.id}_${day}`,
          day,
          npcId: npc.id,
          kind: 'work_warning',
          title: 'Предупреждение на работе',
          text: `${npc.firstName} ${npc.lastName} получил предупреждение за пропущенные смены.`
        });
      }
      if (life.warningCount >= npcDailySimulationRules.jobLossWarningThreshold) {
        npc = { ...npc, activityProfile: 'unemployed', employment: undefined };
        life.jobSearchDays = 0;
        life.lastOutcome = outcome(day, 'lost_job', 'Потерял работу после повторных пропусков.');
        events.push({
          id: `npc_daily_job_lost_${npc.id}_${day}`,
          day,
          npcId: npc.id,
          kind: 'job_lost',
          title: 'Увольнение',
          text: `${npc.firstName} ${npc.lastName} потерял работу после повторных пропусков.`
        });
      }
    } else {
      life.money += npcDailySimulationRules.workerDailyIncome;
      life.energy = clamp(life.energy - profileRule.activeEnergyCost);
      life.reliability = clamp(life.reliability + 1);
      life.warningCount = Math.max(0, life.warningCount - 1);
      life.lastOutcome = outcome(day, 'worked', 'Отработал смену.');
    }
  } else if (npc.activityProfile === 'student' && WEEKDAYS.slice(0, 5).includes(time.weekday)) {
    const missChance = Math.max(4, 34 - Math.floor(life.reliability / 4) + Math.floor(Math.max(0, 30 - life.energy) / 3));
    const missed = sick || deterministicPercent(seed, `${npc.id}:${day}:study`) < missChance;
    if (missed) {
      life.missedCommitments += 1;
      life.reliability = clamp(life.reliability - 3);
      life.lastOutcome = outcome(day, 'missed_study', 'Пропустил учебный день.');
      if (life.missedCommitments > 0 && life.missedCommitments % npcDailySimulationRules.academicWarningThreshold === 0) {
        events.push({
          id: `npc_daily_academic_warning_${npc.id}_${day}`,
          day,
          npcId: npc.id,
          kind: 'academic_warning',
          title: 'Проблемы с учёбой',
          text: `${npc.firstName} ${npc.lastName} получил предупреждение из-за пропусков.`
        });
      }
    } else {
      life.studyProgress += 4;
      life.energy = clamp(life.energy - profileRule.activeEnergyCost);
      life.reliability = clamp(life.reliability + 1);
      life.lastOutcome = outcome(day, 'studied', 'Посетил занятия и продвинулся в учёбе.');
    }
  } else if (npc.activityProfile === 'unemployed' && WEEKDAYS.slice(0, 5).includes(time.weekday)) {
    life.jobSearchDays += 1;
    life.energy = clamp(life.energy - profileRule.activeEnergyCost);
    life.reliability = clamp(life.reliability + (life.jobSearchDays % 3 === 0 ? 1 : 0));
    life.lastOutcome = outcome(day, 'searched_job', 'Искал работу и отправлял отклики.');
  } else if (!life.lastOutcome || life.lastOutcome.day !== day) {
    life.energy = clamp(life.energy + 4);
    life.lastOutcome = outcome(day, 'rested', 'Провёл спокойный день.');
  }

  life.lastProcessedDay = day;
  if ((life.sickUntilDay ?? 0) < day) life.sickUntilDay = undefined;
  return { npc: { ...npc, life }, events };
}

export function processNpcDailyPopulation(input: {
  population: PopulationState;
  fromDay: number;
  toDay: number;
  getNpcCityId: (npc: Npc) => CityId | undefined;
}): { population: PopulationState; events: NpcDailyEvent[] } {
  if (input.toDay <= input.fromDay) return { population: input.population, events: [] };
  let npcs = input.population.npcs;
  const events: NpcDailyEvent[] = [];
  for (let day = input.fromDay + 1; day <= input.toDay; day += 1) {
    npcs = npcs.map((npc) => {
      if (npc.activationDay > day || npc.life.lastProcessedDay >= day) return npc;
      const applied = processNpcDay({ npc, day, seed: input.population.seed });
      events.push(...applied.events.map((event) => ({ ...event, cityId: input.getNpcCityId(applied.npc) })));
      return applied.npc;
    });
  }
  return {
    population: { ...input.population, npcs },
    events: events.slice(-npcDailySimulationRules.maxHistoryEventsPerAdvance)
  };
}

function isNpcWorkTime(npc: Npc, time: GameTime): boolean {
  const employment = npc.employment;
  if (!employment) return false;
  const minute = time.hour * 60 + time.minute;
  const start = employment.startMinute;
  const end = employment.endMinute;
  if (end > start) return employment.workdays.includes(time.weekday) && minute >= start && minute < end;
  if (minute >= start) return employment.workdays.includes(time.weekday);
  const previousIndex = (WEEKDAYS.indexOf(time.weekday) + WEEKDAYS.length - 1) % WEEKDAYS.length;
  return minute < end && employment.workdays.includes(WEEKDAYS[previousIndex]);
}

export function getNpcScheduleConflict(npc: Npc, startsAtTotalMinutes: number): string | undefined {
  const time = fromTotalMinutes(startsAtTotalMinutes);
  if ((npc.life.sickUntilDay ?? 0) >= time.day) return `${npc.firstName} болеет и не сможет прийти.`;
  if (npc.activityProfile === 'worker' && isNpcWorkTime(npc, time)) return `${npc.firstName} в это время работает.`;
  if (npc.activityProfile === 'student' && WEEKDAYS.slice(0, 5).includes(time.weekday)) {
    const minute = time.hour * 60 + time.minute;
    if (minute >= 9 * 60 && minute < 15 * 60 + 30) return `${npc.firstName} в это время на учёбе.`;
  }
  return undefined;
}

export function getNpcActivityView(npc: Npc, currentDay: number): NpcActivityView {
  if ((npc.life.sickUntilDay ?? 0) >= currentDay) return { label: 'Болеет дома', availableNow: false };
  const state = npc.worldState;
  if (state.kind === 'travelling') return { label: 'В дороге', availableNow: false, locationId: state.destinationLocationId };
  if (state.kind === 'home') return { label: 'Дома', availableNow: true };
  const labels: Record<typeof state.purpose, string> = {
    work: 'На работе',
    study: 'На учёбе',
    job_search: 'Ищет работу',
    shopping: 'По делам',
    leisure: 'Отдыхает в городе',
    visit: 'В городе'
  };
  return {
    label: labels[state.purpose],
    availableNow: state.purpose === 'leisure' || state.purpose === 'visit' || state.purpose === 'shopping',
    locationId: state.locationId
  };
}
