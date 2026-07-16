import type { ActionId, JobId, LocationId, PhoneCalendarEventId, UniversityCampusActivityId, UniversitySubjectId } from './ids';

export type DailyAgendaItemKind = 'calendar' | 'university_class' | 'work_shift';
export type DailyAgendaItemStatus = 'upcoming' | 'active' | 'completed' | 'missed' | 'flexible';

export type DailyAgendaItem = {
  id: string;
  kind: DailyAgendaItemKind;
  title: string;
  description?: string;
  locationId?: LocationId;
  locationName?: string;
  startsAtTotalMinutes?: number;
  endsAtTotalMinutes?: number;
  windowEndTotalMinutes?: number;
  status: DailyAgendaItemStatus;
  travelMinutes?: number;
  leaveByTotalMinutes?: number;
  conflictIds: string[];
  sourceCalendarEventId?: PhoneCalendarEventId;
  subjectId?: UniversitySubjectId;
  jobId?: JobId;
};

export type DailyPaymentItem = {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  daysUntilDue: number;
};

export type DailyOpportunityKind = 'extra_shift' | 'study_session' | 'recovery_walk';
export type DailyOpportunityDecision = 'accepted' | 'declined';

export type DailyOpportunityResolution = {
  day: number;
  opportunityId: string;
  decision: DailyOpportunityDecision;
  resolvedAtTotalMinutes: number;
};

export type DailyOpportunityAction =
  | { kind: 'job_shift'; jobId: JobId }
  | { kind: 'campus_activity'; activityId: UniversityCampusActivityId }
  | { kind: 'life_action'; actionId: ActionId };

export type DailyOpportunity = {
  id: string;
  kind: DailyOpportunityKind;
  title: string;
  description: string;
  rewardLabel: string;
  durationMinutes: number;
  locationId?: LocationId;
  locationName?: string;
  targetApp?: 'jobs' | 'education';
  action: DailyOpportunityAction;
  decision?: DailyOpportunityDecision;
};

export type DailyLifePanelState = {
  agenda: DailyAgendaItem[];
  payments: DailyPaymentItem[];
  mandatoryCount: number;
  conflictCount: number;
  remainingAfterPayments: number;
  opportunity: DailyOpportunity;
  recentActivity: Array<{ id: string; timeLabel: string; title: string; text: string }>;
};
