import type { ActionId, LocationId } from './ids';
import type { GameEvent } from './events';
import type { NeedsState } from './needs';
import type { SkillProgressUpdate, SkillReward } from './skill';

export type LifeActionCategory =
  | 'work'
  | 'food'
  | 'drink'
  | 'rest'
  | 'sleep'
  | 'walk'
  | 'training'
  | 'household'
  | 'study'
  | 'social';

export type LifeActionRequirements = {
  minMoney?: number;
  minEnergy?: number;
  minHealth?: number;
  minHunger?: number;
  minThirst?: number;
};

export type LifeAction = {
  id: ActionId;
  name: string;
  description: string;
  category: LifeActionCategory;
  durationMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
  skillRewards?: SkillReward[];
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
  skillUpdates?: SkillProgressUpdate[];
  locationDelta?: LocationId;
  messages: string[];
  events?: GameEvent[];
};
