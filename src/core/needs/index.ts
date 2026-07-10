import type {
  NeedCondition,
  NeedConditionId,
  NeedSeverity,
  NeedsConsequences,
  NeedsRequirement,
  NeedsState
} from '../../types/needs';

const NEED_MIN = 0;
const NEED_MAX = 100;
const MINUTES_IN_HOUR = 60;

export const NEED_WARNING_THRESHOLD = 30;
export const NEED_CRITICAL_THRESHOLD = 15;
export const NEED_EMERGENCY_THRESHOLD = 5;

export type NeedsDecayProfile = 'active' | 'resting' | 'sleeping';

export type NeedsDecayResult = {
  needs: NeedsState;
  delta: Partial<NeedsState>;
};

export type ActivityNeedsOptions = {
  scaleEnergyCost?: boolean;
  scaleEnergyRecovery?: boolean;
};

const DECAY_RATES_PER_HOUR: Record<NeedsDecayProfile, Partial<NeedsState>> = {
  active: {
    hunger: -1.2,
    thirst: -1.8,
    energy: -0.8
  },
  resting: {
    hunger: -0.8,
    thirst: -1.2
  },
  sleeping: {
    hunger: -0.5,
    thirst: -0.8
  }
};

const CONDITION_LABELS: Record<NeedConditionId, string> = {
  hunger: 'Голод',
  dehydration: 'Обезвоживание',
  exhaustion: 'Истощение',
  poor_health: 'Плохое здоровье'
};

const SEVERITY_RANK: Record<NeedSeverity, number> = {
  stable: 0,
  warning: 1,
  critical: 2,
  emergency: 3
};

function clampNeed(value: number): number {
  return Math.min(NEED_MAX, Math.max(NEED_MIN, Math.round(value)));
}

function roundDelta(value: number): number {
  return Math.round(value);
}

function getNonZeroDelta(delta: Partial<NeedsState>): Partial<NeedsState> {
  return Object.fromEntries(Object.entries(delta).filter(([, value]) => value !== undefined && value !== 0)) as Partial<NeedsState>;
}

function getActualDelta(before: NeedsState, after: NeedsState): Partial<NeedsState> {
  return getNonZeroDelta({
    hunger: after.hunger - before.hunger,
    thirst: after.thirst - before.thirst,
    energy: after.energy - before.energy,
    health: after.health - before.health,
    mood: after.mood - before.mood
  });
}

export function getNeedSeverity(value: number): NeedSeverity {
  if (value <= NEED_EMERGENCY_THRESHOLD) return 'emergency';
  if (value <= NEED_CRITICAL_THRESHOLD) return 'critical';
  if (value <= NEED_WARNING_THRESHOLD) return 'warning';
  return 'stable';
}

function createCondition(id: NeedConditionId, value: number, summary: string): NeedCondition | undefined {
  const severity = getNeedSeverity(value);
  if (severity === 'stable') return undefined;

  return {
    id,
    label: CONDITION_LABELS[id],
    severity,
    value,
    summary
  };
}

export function getNeedConditions(needs: NeedsState): NeedCondition[] {
  return [
    createCondition('hunger', needs.hunger, 'Энергия расходуется быстрее, восстановление слабее.'),
    createCondition('dehydration', needs.thirst, 'Энергия расходуется быстрее, на критическом уровне падает здоровье.'),
    createCondition('exhaustion', needs.energy, 'Работа, обучение и физические действия ограничены.'),
    createCondition('poor_health', needs.health, 'Тяжёлые действия и рабочие смены ограничены.')
  ].filter((condition): condition is NeedCondition => Boolean(condition));
}

function getCostPenalty(value: number, warning: number, critical: number, emergency: number): number {
  const severity = getNeedSeverity(value);
  if (severity === 'emergency') return emergency;
  if (severity === 'critical') return critical;
  if (severity === 'warning') return warning;
  return 0;
}

function getRecoveryMultiplier(value: number, warning: number, critical: number, emergency: number): number {
  const severity = getNeedSeverity(value);
  if (severity === 'emergency') return emergency;
  if (severity === 'critical') return critical;
  if (severity === 'warning') return warning;
  return 1;
}

export function getNeedsConsequences(needs: NeedsState): NeedsConsequences {
  const hungerCostPenalty = getCostPenalty(needs.hunger, 0.1, 0.25, 0.4);
  const thirstCostPenalty = getCostPenalty(needs.thirst, 0.15, 0.35, 0.55);
  const hungerRecovery = getRecoveryMultiplier(needs.hunger, 0.85, 0.65, 0.45);
  const thirstRecovery = getRecoveryMultiplier(needs.thirst, 0.9, 0.75, 0.6);

  let healthDrainPerHour = 0;
  if (needs.thirst <= NEED_EMERGENCY_THRESHOLD) healthDrainPerHour += 1.5;
  else if (needs.thirst <= NEED_CRITICAL_THRESHOLD) healthDrainPerHour += 0.75;

  if (needs.hunger <= NEED_EMERGENCY_THRESHOLD) healthDrainPerHour += 0.75;
  else if (needs.hunger <= NEED_CRITICAL_THRESHOLD) healthDrainPerHour += 0.35;

  return {
    conditions: getNeedConditions(needs),
    energyCostMultiplier: 1 + hungerCostPenalty + thirstCostPenalty,
    energyRecoveryMultiplier: Math.min(hungerRecovery, thirstRecovery),
    healthDrainPerHour
  };
}

export function applyNeedsDelta(needs: NeedsState, delta: Partial<NeedsState> = {}): NeedsState {
  return {
    hunger: clampNeed(needs.hunger + (delta.hunger ?? 0)),
    thirst: clampNeed(needs.thirst + (delta.thirst ?? 0)),
    energy: clampNeed(needs.energy + (delta.energy ?? 0)),
    health: clampNeed(needs.health + (delta.health ?? 0)),
    mood: clampNeed(needs.mood + (delta.mood ?? 0))
  };
}

export function adjustActivityNeedsDelta(
  needs: NeedsState,
  delta: Partial<NeedsState> = {},
  options: ActivityNeedsOptions = {}
): Partial<NeedsState> {
  const consequences = getNeedsConsequences(needs);
  const adjusted = { ...delta };
  const energyDelta = delta.energy ?? 0;

  if (energyDelta < 0 && options.scaleEnergyCost !== false) {
    adjusted.energy = -Math.max(1, Math.round(Math.abs(energyDelta) * consequences.energyCostMultiplier));
  }

  if (energyDelta > 0 && options.scaleEnergyRecovery) {
    adjusted.energy = Math.max(1, Math.round(energyDelta * consequences.energyRecoveryMultiplier));
  }

  return getNonZeroDelta(adjusted);
}

export function applyActivityNeedsDelta(
  needs: NeedsState,
  delta: Partial<NeedsState> = {},
  options: ActivityNeedsOptions = {}
): NeedsDecayResult {
  const adjustedDelta = adjustActivityNeedsDelta(needs, delta, options);
  const nextNeeds = applyNeedsDelta(needs, adjustedDelta);

  return {
    needs: nextNeeds,
    delta: getActualDelta(needs, nextNeeds)
  };
}

export function getNeedsRequirementFailure(needs: NeedsState, requirement: NeedsRequirement): string | undefined {
  if (requirement.minHealth !== undefined && needs.health < requirement.minHealth) {
    return `Здоровье: ${needs.health}/${requirement.minHealth}.`;
  }

  if (requirement.minEnergy !== undefined && needs.energy < requirement.minEnergy) {
    return `Энергия: ${needs.energy}/${requirement.minEnergy}.`;
  }

  if (requirement.minHunger !== undefined && needs.hunger < requirement.minHunger) {
    return `Еда: ${needs.hunger}/${requirement.minHunger}.`;
  }

  if (requirement.minThirst !== undefined && needs.thirst < requirement.minThirst) {
    return `Вода: ${needs.thirst}/${requirement.minThirst}.`;
  }

  return undefined;
}

export function getNeedsDecayDelta(minutesElapsed: number, profile: NeedsDecayProfile = 'active'): Partial<NeedsState> {
  const safeMinutes = Math.max(0, Math.floor(minutesElapsed));
  if (safeMinutes === 0) return {};

  const rate = DECAY_RATES_PER_HOUR[profile];
  const multiplier = safeMinutes / MINUTES_IN_HOUR;

  return getNonZeroDelta({
    hunger: rate.hunger !== undefined ? roundDelta(rate.hunger * multiplier) : undefined,
    thirst: rate.thirst !== undefined ? roundDelta(rate.thirst * multiplier) : undefined,
    energy: rate.energy !== undefined ? roundDelta(rate.energy * multiplier) : undefined,
    health: rate.health !== undefined ? roundDelta(rate.health * multiplier) : undefined,
    mood: rate.mood !== undefined ? roundDelta(rate.mood * multiplier) : undefined
  });
}

export function applyNeedsDecay(needs: NeedsState, minutesElapsed: number, profile: NeedsDecayProfile = 'active'): NeedsDecayResult {
  const safeMinutes = Math.max(0, Math.floor(minutesElapsed));
  if (safeMinutes === 0) return { needs, delta: {} };

  const baseDelta = getNeedsDecayDelta(safeMinutes, profile);
  const adjustedBaseDelta = adjustActivityNeedsDelta(needs, baseDelta, {
    scaleEnergyCost: profile === 'active',
    scaleEnergyRecovery: false
  });
  const afterBaseDecay = applyNeedsDelta(needs, adjustedBaseDelta);
  const healthDrainPerHour = getNeedsConsequences(afterBaseDecay).healthDrainPerHour;
  const roundedHealthDrain = Math.round(healthDrainPerHour * (safeMinutes / MINUTES_IN_HOUR));
  const healthDrain = healthDrainPerHour > 0 && roundedHealthDrain > 0 ? -roundedHealthDrain : 0;
  const nextNeeds = applyNeedsDelta(afterBaseDecay, healthDrain ? { health: healthDrain } : {});

  return {
    needs: nextNeeds,
    delta: getActualDelta(needs, nextNeeds)
  };
}

export function describeNeedsDecay(delta: Partial<NeedsState>): string | undefined {
  const parts: string[] = [];

  if (delta.hunger) parts.push(`еда ${delta.hunger}`);
  if (delta.thirst) parts.push(`вода ${delta.thirst}`);
  if (delta.energy) parts.push(`энергия ${delta.energy}`);
  if (delta.health) parts.push(`здоровье ${delta.health}`);
  if (delta.mood) parts.push(`настроение ${delta.mood}`);

  if (parts.length === 0) return undefined;

  return `Время прошло: ${parts.join(', ')}.`;
}

export function getConditionTransitionMessages(before: NeedsState, after: NeedsState): string[] {
  const beforeById = new Map(getNeedConditions(before).map((condition) => [condition.id, condition]));

  return getNeedConditions(after)
    .filter((condition) => {
      const previous = beforeById.get(condition.id);
      return !previous || SEVERITY_RANK[condition.severity] > SEVERITY_RANK[previous.severity];
    })
    .map((condition) => `${condition.label}: ${condition.severity === 'emergency' ? 'опасный уровень' : condition.severity === 'critical' ? 'критический уровень' : 'низкий уровень'} (${condition.value}/100).`);
}

export function getNeedWarning(needs: NeedsState): string | undefined {
  const conditions = getNeedConditions(needs);
  const highest = [...conditions].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
  if (!highest) return undefined;

  return `${highest.label}: ${highest.value}/100.`;
}

export function getNeedsStatusSummary(needs: NeedsState): string {
  const conditions = getNeedConditions(needs);
  return conditions.length > 0 ? conditions.map((condition) => condition.label).join(' · ') : 'Стабильное';
}

export type { NeedsState };
