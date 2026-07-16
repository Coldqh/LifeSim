import type { CityId } from '../../types/ids';
import type {
  WorldCondition,
  WorldConditionKind,
  WorldDynamicsModifiers,
  WorldDynamicsPanelState,
  WorldDynamicsProcessInput,
  WorldDynamicsProcessResult,
  WorldDynamicsState,
  WorldDynamicsTemplate,
  WorldNewsEntry
} from '../../types/worldDynamics';

const MAX_HISTORY = 40;
const MAX_ACTIVE_CONDITIONS_PER_CITY = 2;
const MAX_STORED_ACTIVE_CONDITIONS = 12;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function stringHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicUnit(seed: number, key: string): number {
  const mixed = (stringHash(key) ^ seed) >>> 0;
  return ((Math.imul(mixed, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function conditionId(kind: WorldConditionKind, cityId: CityId, day: number): string {
  return `world_condition_${String(cityId)}_${kind}_${day}`;
}

function newsId(conditionIdValue: string, phase: 'started' | 'ended', day: number): string {
  return `world_news_${conditionIdValue}_${phase}_${day}`;
}

export function createInitialWorldDynamicsState(seed: number, day = 1): WorldDynamicsState {
  return {
    version: 1,
    seed: Math.max(1, Math.floor(seed)),
    lastProcessedDay: Math.max(1, Math.floor(day)),
    activeConditions: [],
    history: []
  };
}

export function normalizeWorldDynamicsState(value: unknown, seed: number, day: number): WorldDynamicsState {
  const initial = createInitialWorldDynamicsState(seed, day);
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<WorldDynamicsState>;
  const activeConditions = Array.isArray(candidate.activeConditions)
    ? candidate.activeConditions.filter((entry): entry is WorldCondition => Boolean(
        entry
        && typeof entry === 'object'
        && typeof entry.id === 'string'
        && typeof entry.kind === 'string'
        && typeof entry.cityId === 'string'
        && typeof entry.startedDay === 'number'
        && typeof entry.endsDay === 'number'
      )).slice(0, MAX_STORED_ACTIVE_CONDITIONS)
    : [];
  const history = Array.isArray(candidate.history)
    ? candidate.history.filter((entry): entry is WorldNewsEntry => Boolean(
        entry
        && typeof entry === 'object'
        && typeof entry.id === 'string'
        && typeof entry.cityId === 'string'
        && typeof entry.day === 'number'
        && typeof entry.title === 'string'
        && typeof entry.text === 'string'
      )).slice(0, MAX_HISTORY)
    : [];

  return {
    version: 1,
    seed: typeof candidate.seed === 'number' ? Math.max(1, Math.floor(candidate.seed)) : initial.seed,
    lastProcessedDay: typeof candidate.lastProcessedDay === 'number'
      ? Math.min(day, Math.max(1, Math.floor(candidate.lastProcessedDay)))
      : initial.lastProcessedDay,
    activeConditions,
    history
  };
}

function chooseTemplate(input: {
  templates: readonly WorldDynamicsTemplate[];
  activeKinds: Set<WorldConditionKind>;
  economyIndex: number;
  jobMarketIndex: number;
  day: number;
  seed: number;
  cityId: CityId;
}): WorldDynamicsTemplate | undefined {
  const get = (kind: WorldConditionKind) => input.templates.find((template) => template.kind === kind && !input.activeKinds.has(kind));
  const priorities: WorldConditionKind[] = [];

  if (input.jobMarketIndex >= 108) priorities.push('hiring_wave');
  if (input.jobMarketIndex <= 92) priorities.push('hiring_slowdown');
  if (input.economyIndex >= 109) priorities.push('consumer_boom');
  if (input.economyIndex <= 91) priorities.push('consumer_slump');

  const fallback: WorldConditionKind[] = [
    deterministicUnit(input.seed, `${String(input.cityId)}:${input.day}:fallback`) < 0.34
      ? 'transit_disruption'
      : input.economyIndex >= 100 ? 'consumer_boom' : 'consumer_slump',
    input.jobMarketIndex >= 100 ? 'hiring_wave' : 'hiring_slowdown',
    'transit_disruption'
  ];

  return [...priorities, ...fallback].map(get).find(Boolean);
}

function shouldStartCondition(seed: number, cityId: CityId, day: number, activeCount: number): boolean {
  if (activeCount >= MAX_ACTIVE_CONDITIONS_PER_CITY) return false;
  if (day <= 1) return false;
  if ((day + seed) % 3 === 0) return true;
  return activeCount === 0 && deterministicUnit(seed, `${String(cityId)}:${day}:start`) < 0.18;
}

function startCondition(template: WorldDynamicsTemplate, cityId: CityId, day: number): { condition: WorldCondition; news: WorldNewsEntry } {
  const id = conditionId(template.kind, cityId, day);
  const condition: WorldCondition = {
    id,
    kind: template.kind,
    cityId,
    title: template.title,
    description: template.startText,
    startedDay: day,
    endsDay: day + Math.max(1, template.durationDays) - 1,
    strength: clamp(template.strength, 0, 0.75)
  };
  return {
    condition,
    news: {
      id: newsId(id, 'started', day),
      cityId,
      day,
      title: template.title,
      text: template.startText,
      tone: template.tone,
      conditionId: id,
      phase: 'started'
    }
  };
}

function endCondition(condition: WorldCondition, template: WorldDynamicsTemplate | undefined, day: number): WorldNewsEntry {
  return {
    id: newsId(condition.id, 'ended', day),
    cityId: condition.cityId,
    day,
    title: template?.endTitle ?? 'Ситуация стабилизировалась',
    text: template?.endText ?? 'Временные изменения в городе закончились.',
    tone: 'neutral',
    conditionId: condition.id,
    phase: 'ended'
  };
}

export function processWorldDynamicsTime(input: WorldDynamicsProcessInput): WorldDynamicsProcessResult {
  let state = normalizeWorldDynamicsState(input.state, input.state.seed, input.toDay);
  const started: WorldNewsEntry[] = [];
  const ended: WorldNewsEntry[] = [];
  const firstDay = Math.max(state.lastProcessedDay + 1, input.fromDay + 1);

  for (let day = firstDay; day <= input.toDay; day += 1) {
    const stillActive: WorldCondition[] = [];
    for (const condition of state.activeConditions) {
      if (condition.endsDay < day) {
        const template = input.templates.find((entry) => entry.kind === condition.kind);
        ended.push(endCondition(condition, template, day));
      } else {
        stillActive.push(condition);
      }
    }
    state = { ...state, activeConditions: stillActive };

    const cityState = input.atlas.cityStates[String(input.activeCityId)];
    const activeCityConditions = state.activeConditions.filter((condition) => condition.cityId === input.activeCityId);
    if (!cityState || !shouldStartCondition(state.seed, input.activeCityId, day, activeCityConditions.length)) continue;
    const activeKinds = new Set(activeCityConditions.map((condition) => condition.kind));
    const template = chooseTemplate({
      templates: input.templates,
      activeKinds,
      economyIndex: cityState.aggregate.economyIndex,
      jobMarketIndex: cityState.aggregate.jobMarketIndex,
      day,
      seed: state.seed,
      cityId: input.activeCityId
    });
    if (!template) continue;
    const created = startCondition(template, input.activeCityId, day);
    state = { ...state, activeConditions: [...state.activeConditions, created.condition] };
    started.push(created.news);
  }

  const newHistory = [...started, ...ended].sort((left, right) => right.day - left.day);
  return {
    state: {
      ...state,
      lastProcessedDay: Math.max(state.lastProcessedDay, input.toDay),
      history: [...newHistory, ...state.history].filter((entry, index, rows) => (
        rows.findIndex((candidate) => candidate.id === entry.id) === index
      )).slice(0, MAX_HISTORY)
    },
    started,
    ended
  };
}

export function getWorldDynamicsModifiers(
  state: WorldDynamicsState,
  cityId: CityId,
  day: number
): WorldDynamicsModifiers {
  const modifiers: WorldDynamicsModifiers = {
    publicTransportDurationMultiplier: 1,
    jobResponseDelayMultiplier: 1,
    jobInviteChanceDelta: 0,
    businessDemandMultiplier: 1
  };

  for (const condition of state.activeConditions) {
    if (condition.cityId !== cityId || condition.startedDay > day || condition.endsDay < day) continue;
    if (condition.kind === 'transit_disruption') {
      modifiers.publicTransportDurationMultiplier *= 1 + condition.strength;
    } else if (condition.kind === 'hiring_wave') {
      modifiers.jobResponseDelayMultiplier *= 1 - condition.strength;
      modifiers.jobInviteChanceDelta += Math.round(condition.strength * 100);
    } else if (condition.kind === 'hiring_slowdown') {
      modifiers.jobResponseDelayMultiplier *= 1 + condition.strength * 2;
      modifiers.jobInviteChanceDelta -= Math.round(condition.strength * 100);
    } else if (condition.kind === 'consumer_boom') {
      modifiers.businessDemandMultiplier *= 1 + condition.strength;
    } else if (condition.kind === 'consumer_slump') {
      modifiers.businessDemandMultiplier *= 1 - condition.strength;
    }
  }

  return {
    publicTransportDurationMultiplier: clamp(modifiers.publicTransportDurationMultiplier, 1, 1.75),
    jobResponseDelayMultiplier: clamp(modifiers.jobResponseDelayMultiplier, 0.55, 1.8),
    jobInviteChanceDelta: Math.round(clamp(modifiers.jobInviteChanceDelta, -30, 30)),
    businessDemandMultiplier: clamp(modifiers.businessDemandMultiplier, 0.65, 1.45)
  };
}

export function createWorldDynamicsPanelState(
  state: WorldDynamicsState,
  cityId: CityId,
  day: number
): WorldDynamicsPanelState {
  return {
    activeConditions: state.activeConditions
      .filter((condition) => condition.cityId === cityId && condition.startedDay <= day && condition.endsDay >= day)
      .sort((left, right) => left.endsDay - right.endsDay),
    recentNews: state.history.filter((entry) => entry.cityId === cityId).slice(0, 8),
    modifiers: getWorldDynamicsModifiers(state, cityId, day)
  };
}
