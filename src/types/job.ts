import type { JobId, LocationId } from './ids';
import type { NeedsState } from './needs';

export type JobCategory = 'service' | 'office' | 'assistant' | 'retail' | 'warehouse' | 'fitness';

export type JobRequirements = {
  minEnergy?: number;
};

export type JobShiftEffects = {
  moneyDelta: number;
  needsDelta: Partial<NeedsState>;
};

export type Job = {
  id: JobId;
  title: string;
  category: JobCategory;
  locationId: LocationId;
  description: string;
  wagePerShift: number;
  shiftDurationMinutes: number;
  experiencePerShift: number;
  promotionThreshold: number;
  requirements?: JobRequirements;
  effects: JobShiftEffects;
};

export type JobApplicationResult = {
  ok: boolean;
  jobId: JobId;
  jobTitle: string;
  messages: string[];
};

export type JobShiftResult = {
  ok: boolean;
  jobId: JobId;
  jobTitle: string;
  timeDeltaMinutes: number;
  moneyDelta: number;
  experienceDelta?: number;
  needsDelta?: Partial<NeedsState>;
  messages: string[];
};
