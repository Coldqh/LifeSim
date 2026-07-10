import type { Player } from '../../types/player';
import type {
  PlayerSkillProgress,
  PlayerSkills,
  SkillProgressUpdate,
  SkillRequirement,
  SkillReward
} from '../../types/skill';
import type { SkillId } from '../../types/ids';

export const SKILL_MAX_LEVEL = 5;
const XP_REQUIREMENTS = [40, 100, 180, 280, 400] as const;

export type SkillProgressView = {
  level: number;
  experience: number;
  experienceRequired: number;
  experienceRemaining: number;
  progressPercent: number;
  isMaxLevel: boolean;
};

function normalizeProgress(progress?: PlayerSkillProgress): PlayerSkillProgress {
  return {
    level: Math.max(0, Math.min(SKILL_MAX_LEVEL, Math.floor(progress?.level ?? 0))),
    experience: Math.max(0, Math.floor(progress?.experience ?? 0))
  };
}

export function getSkillExperienceRequired(level: number): number {
  if (level >= SKILL_MAX_LEVEL) return 0;
  return XP_REQUIREMENTS[Math.max(0, Math.min(level, XP_REQUIREMENTS.length - 1))];
}

export function getSkillProgress(skills: PlayerSkills, skillId: SkillId): SkillProgressView {
  const progress = normalizeProgress(skills[skillId]);
  const experienceRequired = getSkillExperienceRequired(progress.level);
  const experienceRemaining = experienceRequired === 0 ? 0 : Math.max(0, experienceRequired - progress.experience);
  const progressPercent = experienceRequired === 0
    ? 100
    : Math.min(100, Math.round((progress.experience / experienceRequired) * 100));

  return {
    ...progress,
    experienceRequired,
    experienceRemaining,
    progressPercent,
    isMaxLevel: progress.level >= SKILL_MAX_LEVEL
  };
}

export function getSkillLevel(skills: PlayerSkills, skillId: SkillId): number {
  return getSkillProgress(skills, skillId).level;
}

export function applySkillExperience(
  skills: PlayerSkills,
  skillId: SkillId,
  experienceDelta: number
): { skills: PlayerSkills; update: SkillProgressUpdate } {
  const current = normalizeProgress(skills[skillId]);
  const previousLevel = current.level;
  const previousExperience = current.experience;
  let nextLevel = current.level;
  let nextExperience = current.experience + Math.max(0, Math.floor(experienceDelta));

  while (nextLevel < SKILL_MAX_LEVEL) {
    const requirement = getSkillExperienceRequired(nextLevel);
    if (requirement === 0 || nextExperience < requirement) break;
    nextExperience -= requirement;
    nextLevel += 1;
  }

  if (nextLevel >= SKILL_MAX_LEVEL) {
    nextLevel = SKILL_MAX_LEVEL;
    nextExperience = 0;
  }

  const nextSkills: PlayerSkills = {
    ...skills,
    [skillId]: {
      level: nextLevel,
      experience: nextExperience
    }
  };

  return {
    skills: nextSkills,
    update: {
      skillId,
      previousLevel,
      nextLevel,
      previousExperience,
      nextExperience,
      experienceDelta: Math.max(0, Math.floor(experienceDelta)),
      leveledUp: nextLevel > previousLevel
    }
  };
}

export function applySkillRewards(
  skills: PlayerSkills,
  rewards: SkillReward[] = []
): { skills: PlayerSkills; updates: SkillProgressUpdate[] } {
  let nextSkills = skills;
  const updates: SkillProgressUpdate[] = [];

  rewards.forEach((reward) => {
    const applied = applySkillExperience(nextSkills, reward.skillId, reward.experience);
    nextSkills = applied.skills;
    updates.push(applied.update);
  });

  return { skills: nextSkills, updates };
}

export function getMissingSkillRequirements(
  player: Player,
  requirements: SkillRequirement[] = []
): Array<SkillRequirement & { currentLevel: number }> {
  return requirements
    .map((requirement) => ({
      ...requirement,
      currentLevel: getSkillLevel(player.skills, requirement.skillId)
    }))
    .filter((requirement) => requirement.currentLevel < requirement.minLevel);
}

export type { ProgressionTrack } from '../../types/progression';
