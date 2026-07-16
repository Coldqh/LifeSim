import type { DistrictId, JobId, NpcId, OrganizationId, ProductId } from './ids';
import type { NeedsState } from './needs';
import type { RelationshipDelta, NpcMemoryTone } from './relationship';
import type { HouseholdBillKind } from './household';

export type ContextualStoryCategory = 'work' | 'education' | 'housing' | 'finance' | 'social' | 'district';
export type ContextualStoryTone = 'positive' | 'neutral' | 'warning' | 'critical';
export type ContextualStoryTrigger =
  | 'work_understaffed'
  | 'work_pay_delay'
  | 'work_coworker_sick'
  | 'university_peer_help'
  | 'university_deadline_pressure'
  | 'university_campus_group'
  | 'housing_inspection'
  | 'housing_breakdown'
  | 'housing_empty_pantry'
  | 'finance_emergency_expense'
  | 'finance_short_gig'
  | 'finance_debt_call'
  | 'social_friend_loan'
  | 'social_friend_job_loss'
  | 'social_missed_promise'
  | 'district_transport'
  | 'district_cleanup'
  | 'district_local_sale'
  | 'follow_up';

export type ContextualStoryEffect =
  | { kind: 'money'; amount: number }
  | { kind: 'needs'; delta: Partial<NeedsState> }
  | { kind: 'job_experience'; amount: number }
  | { kind: 'university_load'; amount: number }
  | { kind: 'university_knowledge'; amount: number }
  | { kind: 'household_cleanliness'; amount: number }
  | { kind: 'household_condition'; amount: number; clearBreakdown?: boolean }
  | { kind: 'household_food'; productId: ProductId; units: number; shelfLifeDays: number }
  | { kind: 'household_bill'; billKind: HouseholdBillKind; amount: number }
  | { kind: 'relationship'; delta: RelationshipDelta; memoryKey: string; memoryText: string; memoryTone: NpcMemoryTone }
  | { kind: 'organization'; budgetDelta?: number; reputationDelta?: number; demandDelta?: number }
  | { kind: 'district'; servicesDelta?: number; popularityDelta?: number; transportDelta?: number };

export type ContextualStoryFollowUp = { templateId: string; delayDays: number };

export type ContextualStoryChoice = {
  id: string;
  label: string;
  description: string;
  resultText: string;
  durationMinutes?: number;
  effects: ContextualStoryEffect[];
  followUp?: ContextualStoryFollowUp;
  expiryOnly?: boolean;
};

export type ContextualStoryDefinition = {
  id: string;
  category: ContextualStoryCategory;
  tone: ContextualStoryTone;
  trigger: ContextualStoryTrigger;
  title: string;
  text: string;
  responseDays: number;
  cooldownDays: number;
  defaultChoiceId: string;
  choices: ContextualStoryChoice[];
};

export type ActiveContextualStory = {
  id: string;
  templateId: string;
  category: ContextualStoryCategory;
  tone: ContextualStoryTone;
  source: 'world' | 'follow_up';
  title: string;
  text: string;
  startedDay: number;
  dueDay: number;
  defaultChoiceId: string;
  choices: ContextualStoryChoice[];
  npcId?: NpcId;
  organizationId?: OrganizationId;
  districtId?: DistrictId;
  jobId?: JobId;
};

export type ScheduledContextualStory = {
  id: string;
  templateId: string;
  dueDay: number;
  npcId?: NpcId;
  organizationId?: OrganizationId;
  districtId?: DistrictId;
  jobId?: JobId;
};

export type ContextualStoryHistoryEntry = {
  id: string;
  eventId: string;
  templateId: string;
  category: ContextualStoryCategory;
  title: string;
  text: string;
  startedDay: number;
  resolvedDay: number;
  choiceId: string;
  expired: boolean;
  npcId?: NpcId;
};

export type ContextualStoryState = {
  version: 1;
  seed: number;
  lastProcessedDay: number;
  activeEvents: ActiveContextualStory[];
  scheduledEvents: ScheduledContextualStory[];
  cooldowns: Record<string, number>;
  history: ContextualStoryHistoryEntry[];
};

export type ContextualStoryPanelState = {
  activeEvents: ActiveContextualStory[];
  recentHistory: ContextualStoryHistoryEntry[];
};
