import type { ActionId, LocationId } from './ids';
import type { GameEvent } from './events';
import type { NeedsState } from './needs';

export type LifeActionCategory = 'work' | 'food' | 'drink' | 'rest' | 'sleep' | 'walk' | 'training';

export type LifeActionRequirements = {
  minMoney?: number;
  minEnergy?: number;
};

export type LifeAction = {
  id: ActionId;
  name: string;
  description: string;
  category: LifeActionCategory;
  durationMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
  requirements?: LifeActionRequirements;
  locationId?: LocationId;
  resultMessage: string;
};

export type ActionResult = {
  ok: boolean;
  actionId?: ActionId;
  actionName?: string;
  timeDeltaMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
  locationDelta?: LocationId;
  messages: string[];
  events?: GameEvent[];
};
