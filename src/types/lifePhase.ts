import type { DistrictId, JobId, NpcId } from './ids';

export type LongTermLifeEventKind =
  | 'career_review'
  | 'academic_review'
  | 'rent_review'
  | 'health_recovery'
  | 'business_review'
  | 'social_departure'
  | 'social_group_crisis'
  | 'goal_milestone';

export type LongTermLifeEventTone = 'positive' | 'warning' | 'critical';

export type LongTermLifeEventChoice = {
  id: string;
  label: string;
  description: string;
};

export type LongTermLifeEvent = {
  id: string;
  kind: LongTermLifeEventKind;
  tone: LongTermLifeEventTone;
  title: string;
  description: string;
  startedDay: number;
  dueDay: number;
  defaultChoiceId: string;
  choices: LongTermLifeEventChoice[];
  variant?: 'positive' | 'negative';
  sourceKey?: string;
  jobId?: JobId;
  npcId?: NpcId;
  targetDistrictId?: DistrictId;
  memberNpcIds?: NpcId[];
};

export type LongTermLifeEventHistoryEntry = {
  id: string;
  eventId: string;
  kind: LongTermLifeEventKind;
  title: string;
  text: string;
  startedDay: number;
  resolvedDay: number;
  choiceId: string;
  expired: boolean;
};

export type LifePeriodSummary = {
  id: string;
  kind: 'week' | 'month';
  fromDay: number;
  toDay: number;
  title: string;
  lines: string[];
};

export type LifePhaseSnapshot = {
  day: number;
  money: number;
  currentJobId?: JobId;
  housingId: string;
  rentDebt: number;
  activeMedicalConditions: number;
  completedGoalMilestones: number;
  knownContacts: number;
  businessBalance?: number;
  businessDebt?: number;
  universityKnowledge: number;
  universityDebtCount: number;
};

export type LifePhasesState = {
  version: 1;
  lastProcessedDay: number;
  rentMultiplier: number;
  rentContractKey?: string;
  activeEvents: LongTermLifeEvent[];
  history: LongTermLifeEventHistoryEntry[];
  weeklySummaries: LifePeriodSummary[];
  monthlySummaries: LifePeriodSummary[];
  handledTriggerKeys: string[];
  lastWeeklySnapshot: LifePhaseSnapshot;
  lastMonthlySnapshot: LifePhaseSnapshot;
};

export type LifePhasesPanelState = {
  state: LifePhasesState;
  activeEvents: LongTermLifeEvent[];
  latestWeeklySummary?: LifePeriodSummary;
  latestMonthlySummary?: LifePeriodSummary;
  recentHistory: LongTermLifeEventHistoryEntry[];
};
