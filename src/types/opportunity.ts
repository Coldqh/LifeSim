import type { CityId, JobId, NpcId } from './ids';

export type JobOpportunityStatus = 'open' | 'filled' | 'closed';
export type OpportunityHistoryKind = 'job_opened' | 'job_filled' | 'job_closed';

export type JobOpportunityListing = {
  jobId: JobId;
  cityId: CityId;
  status: JobOpportunityStatus;
  openedDay: number;
  closesDay: number;
  reopenDay?: number;
  resolvedDay?: number;
  filledByNpcId?: NpcId;
};

export type OpportunityHistoryEntry = {
  id: string;
  day: number;
  kind: OpportunityHistoryKind;
  jobId: JobId;
  cityId: CityId;
  title: string;
  text: string;
  npcId?: NpcId;
};

export type OpportunityWorldState = {
  version: 1;
  seed: number;
  lastProcessedDay: number;
  jobListings: Record<string, JobOpportunityListing>;
  history: OpportunityHistoryEntry[];
};

export type OpportunityJobView = {
  jobId: JobId;
  status: JobOpportunityStatus;
  available: boolean;
  label: string;
  daysRemaining?: number;
  filledByNpcId?: NpcId;
  filledByNpcName?: string;
};

export type OpportunityPanelState = {
  openVacancyCount: number;
  closedVacancyCount: number;
  recentChanges: OpportunityHistoryEntry[];
};
