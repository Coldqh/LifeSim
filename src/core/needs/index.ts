import type { NeedsState } from '../../types/needs';

const NEED_MIN = 0;
const NEED_MAX = 100;
const MINUTES_IN_HOUR = 60;

export type NeedsDecayProfile = 'active' | 'resting' | 'sleeping';

export type NeedsDecayResult = {
  needs: NeedsState;
  delta: Partial<NeedsState>;
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

function clampNeed(value: number): number {
  return Math.min(NEED_MAX, Math.max(NEED_MIN, Math.round(value)));
}

function roundDelta(value: number): number {
  return Math.round(value);
}

function addDelta(current: number, delta: number): number {
  return clampNeed(current + delta);
}

function getNonZeroDelta(delta: Partial<NeedsState>): Partial<NeedsState> {
  return Object.fromEntries(Object.entries(delta).filter(([, value]) => value !== undefined && value !== 0)) as Partial<NeedsState>;
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
  const delta = getNeedsDecayDelta(minutesElapsed, profile);

  return {
    needs: {
      hunger: addDelta(needs.hunger, delta.hunger ?? 0),
      thirst: addDelta(needs.thirst, delta.thirst ?? 0),
      energy: addDelta(needs.energy, delta.energy ?? 0),
      health: addDelta(needs.health, delta.health ?? 0),
      mood: addDelta(needs.mood, delta.mood ?? 0)
    },
    delta
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

  return `Время прошло. Потребности изменились: ${parts.join(', ')}.`;
}

export function getNeedWarning(needs: NeedsState): string | undefined {
  if (needs.health <= 20) return 'Здоровье на опасном уровне.';
  if (needs.energy <= 15) return 'Сил почти не осталось.';
  if (needs.hunger <= 15) return 'Нужно поесть.';
  if (needs.thirst <= 15) return 'Нужно выпить воды.';

  return undefined;
}

export type { NeedsState };
