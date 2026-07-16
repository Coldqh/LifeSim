import { applyMoneyDelta } from '../economy';
import { applyActivityNeedsDelta, getNeedsRequirementFailure, getNeedWarning } from '../needs';
import { addMinutes } from '../time';
import { getScheduleActivityFailure } from '../schedule';
import { applySkillRewards, getMissingSkillRequirements } from '../progression';
import type {
  Job,
  JobApplicationResult,
  JobLevel,
  JobPromotionResult,
  JobShiftResult
} from '../../types/job';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';

export type ApplyJobInput = {
  player: Player;
  job: Job;
};

export type ApplyJobOutput = {
  player: Player;
  result: JobApplicationResult;
};

export type ApplyJobShiftInput = {
  player: Player;
  time: GameTime;
  job: Job;
  organizationModifier?: { workloadMultiplier?: number; wageMultiplier?: number; label?: string };
};

export type ApplyJobShiftOutput = {
  player: Player;
  time: GameTime;
  result: JobShiftResult;
};

export type ApplyJobPromotionInput = {
  player: Player;
  job: Job;
};

export type ApplyJobPromotionOutput = {
  player: Player;
  result: JobPromotionResult;
};

export type JobProgress = {
  currentLevel: JobLevel;
  nextLevel?: JobLevel;
  currentExperience: number;
  levelStartExperience: number;
  promotionThreshold?: number;
  levelExperience: number;
  levelExperienceRequired: number;
  experienceRemaining: number;
  progressPercent: number;
  isMaxLevel: boolean;
};

function createFallbackLevel(job: Job): JobLevel {
  return {
    level: 1,
    title: job.title,
    wagePerShift: job.wagePerShift,
    minEnergy: job.requirements?.minEnergy,
    promotionExperienceRequired: job.promotionThreshold
  };
}

export function getJobLevels(job: Job): JobLevel[] {
  return job.levels.length > 0 ? [...job.levels].sort((a, b) => a.level - b.level) : [createFallbackLevel(job)];
}

export function getPlayerJobLevel(player: Player, job: Job): number {
  const levels = getJobLevels(job);
  const storedLevel = player.jobLevels[job.id] ?? levels[0].level;
  const matchingLevel = levels.find((level) => level.level === storedLevel);

  return matchingLevel?.level ?? levels[0].level;
}

export function getCurrentJobLevel(player: Player, job: Job): JobLevel {
  const levels = getJobLevels(job);
  const currentLevel = getPlayerJobLevel(player, job);

  return levels.find((level) => level.level === currentLevel) ?? levels[0];
}

export function getNextJobLevel(player: Player, job: Job): JobLevel | undefined {
  const levels = getJobLevels(job);
  const currentLevel = getCurrentJobLevel(player, job);
  const currentIndex = levels.findIndex((level) => level.level === currentLevel.level);

  return currentIndex >= 0 ? levels[currentIndex + 1] : undefined;
}

export function getJobProgress(player: Player, job: Job): JobProgress {
  const levels = getJobLevels(job);
  const currentLevel = getCurrentJobLevel(player, job);
  const currentIndex = levels.findIndex((level) => level.level === currentLevel.level);
  const previousLevel = currentIndex > 0 ? levels[currentIndex - 1] : undefined;
  const nextLevel = currentIndex >= 0 ? levels[currentIndex + 1] : undefined;
  const currentExperience = player.jobExperience[job.id] ?? 0;
  const levelStartExperience = previousLevel?.promotionExperienceRequired ?? 0;
  const promotionThreshold = currentLevel.promotionExperienceRequired;
  const levelExperience = Math.max(0, currentExperience - levelStartExperience);
  const levelExperienceRequired = promotionThreshold === undefined
    ? 0
    : Math.max(1, promotionThreshold - levelStartExperience);
  const experienceRemaining = promotionThreshold === undefined
    ? 0
    : Math.max(0, promotionThreshold - currentExperience);
  const progressPercent = promotionThreshold === undefined
    ? 100
    : Math.min(100, Math.round((levelExperience / levelExperienceRequired) * 100));

  return {
    currentLevel,
    nextLevel,
    currentExperience,
    levelStartExperience,
    promotionThreshold,
    levelExperience,
    levelExperienceRequired,
    experienceRemaining,
    progressPercent,
    isMaxLevel: !nextLevel
  };
}

export function getJobApplicationFailure(player: Player, job: Job): string | undefined {
  const missingSkills = getMissingSkillRequirements(player, job.requirements?.skills);
  if (missingSkills.length > 0) {
    return 'Не хватает навыков для этой вакансии.';
  }

  return undefined;
}

export function getJobShiftFailure(player: Player, job: Job, time: GameTime): string | undefined {
  if (player.currentJobId !== job.id) {
    return 'Сначала устройся на эту работу.';
  }

  if (player.locationId !== job.locationId) {
    return 'Нужно быть на месте работы.';
  }

  const scheduleFailure = getScheduleActivityFailure(job.shiftSchedule, time, job.shiftDurationMinutes, 'Смена');
  if (scheduleFailure) return scheduleFailure;

  const currentLevel = getCurrentJobLevel(player, job);
  const minEnergy = currentLevel.minEnergy ?? job.requirements?.minEnergy ?? 20;

  return getNeedsRequirementFailure(player.needs, {
    minEnergy,
    minHealth: 25,
    minHunger: 6,
    minThirst: 6
  });
}

export function getJobPromotionFailure(player: Player, job: Job): string | undefined {
  if (player.currentJobId !== job.id) {
    return 'Повышение доступно только на текущей работе.';
  }

  const progress = getJobProgress(player, job);
  if (progress.isMaxLevel) {
    return 'Достигнут максимальный уровень этой работы.';
  }

  if (progress.promotionThreshold === undefined) {
    return 'Для этой должности не настроено следующее повышение.';
  }

  if (progress.currentExperience < progress.promotionThreshold) {
    return `До повышения не хватает ${progress.experienceRemaining} XP.`;
  }

  return undefined;
}

export function applyForJob(input: ApplyJobInput): ApplyJobOutput {
  const { player, job } = input;
  const failure = getJobApplicationFailure(player, job);
  const entryLevel = getJobLevels(job)[0];
  const assignedLevel = getCurrentJobLevel(player, job);

  if (failure) {
    return {
      player,
      result: {
        ok: false,
        jobId: job.id,
        jobTitle: assignedLevel.title,
        messages: [failure]
      }
    };
  }

  return {
    player: {
      ...player,
      currentJobId: job.id,
      jobLevels: {
        ...player.jobLevels,
        [job.id]: player.jobLevels[job.id] ?? entryLevel.level
      }
    },
    result: {
      ok: true,
      jobId: job.id,
      jobTitle: assignedLevel.title,
      messages: [`Ты устроился: ${assignedLevel.title}.`]
    }
  };
}

export function applyJobShift(input: ApplyJobShiftInput): ApplyJobShiftOutput {
  const { player, time, job } = input;
  const failure = getJobShiftFailure(player, job, time);
  const currentLevel = getCurrentJobLevel(player, job);

  if (failure) {
    return {
      player,
      time,
      result: {
        ok: false,
        jobId: job.id,
        jobTitle: currentLevel.title,
        timeDeltaMinutes: 0,
        moneyDelta: 0,
        messages: [failure]
      }
    };
  }

  const nextTime = addMinutes(time, job.shiftDurationMinutes);
  const workloadMultiplier = Math.max(0.5, input.organizationModifier?.workloadMultiplier ?? 1);
  const wageMultiplier = Math.max(0.5, input.organizationModifier?.wageMultiplier ?? 1);
  const adjustedNeedsDelta = Object.fromEntries(Object.entries(job.effects.needsDelta).map(([key, value]) => [key, typeof value === 'number' && value < 0 ? Math.round(value * workloadMultiplier) : value]));
  const effectiveWage = Math.max(0, Math.round(currentLevel.wagePerShift * wageMultiplier));
  const needsApplied = applyActivityNeedsDelta(player.needs, adjustedNeedsDelta, {
    scaleEnergyCost: true,
    scaleEnergyRecovery: false
  });
  const nextMoney = applyMoneyDelta(player.money, effectiveWage);
  const completedCount = (player.completedShifts[job.id] ?? 0) + 1;
  const currentExperience = player.jobExperience[job.id] ?? 0;
  const nextExperience = currentExperience + job.experiencePerShift;
  const skillApplied = applySkillRewards(player.skills, job.skillRewards);
  const warning = getNeedWarning(needsApplied.needs);
  const baseMessage = `Смена завершена: ${currentLevel.title}. Получено ${effectiveWage} ₽. Опыт работы +${job.experiencePerShift}.`;
  const organizationMessage = input.organizationModifier?.label ? `Состояние работодателя: ${input.organizationModifier.label}.` : undefined;
  const skillMessage = job.skillRewards?.length ? 'Получен опыт навыков.' : undefined;
  const messages = [baseMessage, organizationMessage, skillMessage, warning].filter((message): message is string => Boolean(message));

  return {
    player: {
      ...player,
      money: nextMoney,
      needs: needsApplied.needs,
      skills: skillApplied.skills,
      completedShifts: {
        ...player.completedShifts,
        [job.id]: completedCount
      },
      jobExperience: {
        ...player.jobExperience,
        [job.id]: nextExperience
      }
    },
    time: nextTime,
    result: {
      ok: true,
      jobId: job.id,
      jobTitle: currentLevel.title,
      timeDeltaMinutes: job.shiftDurationMinutes,
      moneyDelta: effectiveWage,
      experienceDelta: job.experiencePerShift,
      skillProgressUpdates: skillApplied.updates,
      needsDelta: needsApplied.delta,
      messages
    }
  };
}

export function applyJobPromotion(input: ApplyJobPromotionInput): ApplyJobPromotionOutput {
  const { player, job } = input;
  const currentLevel = getCurrentJobLevel(player, job);
  const nextLevel = getNextJobLevel(player, job);
  const failure = getJobPromotionFailure(player, job);

  if (failure || !nextLevel) {
    return {
      player,
      result: {
        ok: false,
        jobId: job.id,
        previousLevel: currentLevel.level,
        nextLevel: currentLevel.level,
        previousTitle: currentLevel.title,
        nextTitle: currentLevel.title,
        messages: [failure ?? 'Повышение недоступно.']
      }
    };
  }

  return {
    player: {
      ...player,
      jobLevels: {
        ...player.jobLevels,
        [job.id]: nextLevel.level
      }
    },
    result: {
      ok: true,
      jobId: job.id,
      previousLevel: currentLevel.level,
      nextLevel: nextLevel.level,
      previousTitle: currentLevel.title,
      nextTitle: nextLevel.title,
      messages: [`Повышение получено: ${nextLevel.title}. Оплата за смену — ${nextLevel.wagePerShift} ₽.`]
    }
  };
}

export function getJobExperienceRemaining(player: Player, job: Job): number {
  return getJobProgress(player, job).experienceRemaining;
}

export type { Job, JobApplicationResult, JobLevel, JobPromotionResult, JobShiftResult };
