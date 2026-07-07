import type { ActionId, LocationId } from './ids';
import type { GameEvent } from './events';
import type { NeedsState } from './needs';

export type LifeAction = {
  id: ActionId;
  name: string;
  durationMinutes: number;
  locationId?: LocationId;
};

export type ActionResult = {
  ok: boolean;
  timeDeltaMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
  locationDelta?: LocationId;
  messages: string[];
  events?: GameEvent[];
};
