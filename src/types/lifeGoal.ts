import type { BusinessWorldState } from './business';
import type { DegreeProgramDefinition, UniversityState } from './university';
import type { PersonalFinanceState } from './finance';
import type { Housing } from './housing';
import type { Player } from './player';

export type LifeGoalId = 'university' | 'career' | 'boxing' | 'business' | 'housing';

export type LifeGoalMilestoneDefinition = {
  id: string;
  title: string;
  description: string;
};

export type LifeGoalDefinition = {
  id: LifeGoalId;
  title: string;
  shortTitle: string;
  description: string;
  milestones: LifeGoalMilestoneDefinition[];
};

export type LifeGoalsState = {
  activeGoalId?: LifeGoalId;
  selectedDay?: number;
  completedMilestoneIds: string[];
  completedGoalIds: LifeGoalId[];
};

export type LifeGoalEvaluationContext = {
  player: Player;
  university: UniversityState;
  business: BusinessWorldState;
  finance: PersonalFinanceState;
  currentHousing?: Housing;
  activeProgram?: DegreeProgramDefinition;
};

export type LifeGoalMilestoneProgress = {
  definition: LifeGoalMilestoneDefinition;
  completed: boolean;
  progressLabel?: string;
  progressValue?: number;
  targetValue?: number;
};

export type LifeGoalProgressView = {
  definition: LifeGoalDefinition;
  milestones: LifeGoalMilestoneProgress[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  complete: boolean;
  nextMilestone?: LifeGoalMilestoneProgress;
};

export type LifeGoalsPanelState = {
  state: LifeGoalsState;
  goals: LifeGoalProgressView[];
  activeGoal?: LifeGoalProgressView;
};
