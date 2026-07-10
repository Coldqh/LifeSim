import type { JobId, LocationId } from './ids';
import type { NeedsState } from './needs';
import type { SkillProgressUpdate, SkillRequirement, SkillReward } from './skill';
import type { WeeklySchedule } from './schedule';

export type JobCategory = 'service' | 'office' | 'assistant' | 'retail' | 'warehouse' | 'fitness';

export type JobRequirements = {
  minEnergy?: number;
  skills?: SkillRequirement[];
};

export type JobShiftEffects = {
  moneyDelta: number;
  needsDelta: Partial<NeedsState>;
};

export type JobLevel = {
  level: number;
  title: string;
  wagePerShift: number;
  minEnergy?: number;
  promotionExperienceRequired?: number;
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
  skillRewards?: SkillReward[];
  effects: JobShiftEffects;
  levels: JobLevel[];
  shiftSchedule?: WeeklySchedule;
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
  skillProgressUpdates?: SkillProgressUpdate[];
  needsDelta?: Partial<NeedsState>;
  messages: string[];
};

export type JobPromotionResult = {
  ok: boolean;
  jobId: JobId;
  previousLevel: number;
  nextLevel: number;
  previousTitle: string;
  nextTitle: string;
  messages: string[];
};
