import type { SkillId } from './ids';

export type SkillCategory = 'professional' | 'physical';

export type SkillDefinition = {
  id: SkillId;
  name: string;
  category: SkillCategory;
  maxLevel: number;
};

export type PlayerSkillProgress = {
  level: number;
  experience: number;
};

export type PlayerSkills = Partial<Record<SkillId, PlayerSkillProgress>>;

export type SkillRequirement = {
  skillId: SkillId;
  minLevel: number;
};

export type SkillReward = {
  skillId: SkillId;
  experience: number;
};

export type SkillProgressUpdate = {
  skillId: SkillId;
  previousLevel: number;
  nextLevel: number;
  previousExperience: number;
  nextExperience: number;
  experienceDelta: number;
  leveledUp: boolean;
};
