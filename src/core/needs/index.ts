import type { NeedsState } from '../../types/needs';

const NEED_MIN = 0;
const NEED_MAX = 100;

function clampNeed(value: number): number {
  return Math.min(NEED_MAX, Math.max(NEED_MIN, Math.round(value)));
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

export function getNeedWarning(needs: NeedsState): string | undefined {
  if (needs.health <= 20) return 'Здоровье на опасном уровне.';
  if (needs.energy <= 15) return 'Сил почти не осталось.';
  if (needs.hunger <= 15) return 'Нужно поесть.';
  if (needs.thirst <= 15) return 'Нужно выпить воды.';

  return undefined;
}

export type { NeedsState };
