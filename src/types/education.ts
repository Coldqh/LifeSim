import type { EducationProgramId, LocationId, SkillId } from './ids';
import type { NeedsState } from './needs';
import type { SkillProgressUpdate } from './skill';

export type EducationMode = 'self_study' | 'course';

export type EducationProgram = {
  id: EducationProgramId;
  title: string;
  mode: EducationMode;
  skillId: SkillId;
  locationId: LocationId;
  durationMinutes: number;
  price: number;
  experienceReward: number;
  minEnergy?: number;
  needsDelta?: Partial<NeedsState>;
};

export type EducationResult = {
  ok: boolean;
  programId: EducationProgramId;
  programTitle: string;
  timeDeltaMinutes: number;
  moneyDelta: number;
  needsDelta?: Partial<NeedsState>;
  skillProgress?: SkillProgressUpdate;
  messages: string[];
};
