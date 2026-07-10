import { applyMoneyDelta, canAfford } from '../economy';
import {
  applyActivityNeedsDelta,
  getNeedsRequirementFailure,
  getNeedWarning
} from '../needs';
import { applySkillExperience } from '../progression';
import { addMinutes } from '../time';
import { getScheduleActivityFailure } from '../schedule';
import type { EducationProgram, EducationResult } from '../../types/education';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';
import type { LocationType } from '../../types/location';

export type ApplyEducationProgramInput = {
  player: Player;
  time: GameTime;
  program: EducationProgram;
  currentLocationType?: LocationType;
};

export type ApplyEducationProgramOutput = {
  player: Player;
  time: GameTime;
  result: EducationResult;
};

export function getEducationProgramFailure(player: Player, program: EducationProgram, time: GameTime, currentLocationType?: LocationType): string | undefined {
  const locationMatches = program.requiredLocationType
    ? currentLocationType === program.requiredLocationType
    : player.locationId === program.locationId;
  if (!locationMatches) {
    return program.mode === 'self_study'
      ? 'Самообучение доступно дома.'
      : 'Нужно находиться в образовательном центре.';
  }

  const scheduleFailure = getScheduleActivityFailure(
    program.availabilitySchedule,
    time,
    program.durationMinutes,
    program.mode === 'self_study' ? 'Самообучение' : 'Курс'
  );
  if (scheduleFailure) return scheduleFailure;

  if (!canAfford(player.money, program.price)) {
    return `Деньги: ${player.money}/${program.price} ₽.`;
  }

  return getNeedsRequirementFailure(player.needs, {
    minEnergy: program.minEnergy ?? 15,
    minHealth: 20,
    minHunger: 6,
    minThirst: 6
  });
}

export function applyEducationProgram(input: ApplyEducationProgramInput): ApplyEducationProgramOutput {
  const { player, time, program, currentLocationType } = input;
  const failure = getEducationProgramFailure(player, program, time, currentLocationType);

  if (failure) {
    return {
      player,
      time,
      result: {
        ok: false,
        programId: program.id,
        programTitle: program.title,
        timeDeltaMinutes: 0,
        moneyDelta: 0,
        messages: [failure]
      }
    };
  }

  const skillApplied = applySkillExperience(player.skills, program.skillId, program.experienceReward);
  const needsApplied = applyActivityNeedsDelta(player.needs, program.needsDelta ?? {}, {
    scaleEnergyCost: true,
    scaleEnergyRecovery: false
  });
  const nextTime = addMinutes(time, program.durationMinutes);
  const nextMoney = applyMoneyDelta(player.money, -program.price);
  const warning = getNeedWarning(needsApplied.needs);
  const baseMessage = `${program.title}: +${program.experienceReward} XP навыка.`;
  const messages = warning ? [baseMessage, warning] : [baseMessage];

  return {
    player: {
      ...player,
      money: nextMoney,
      needs: needsApplied.needs,
      skills: skillApplied.skills
    },
    time: nextTime,
    result: {
      ok: true,
      programId: program.id,
      programTitle: program.title,
      timeDeltaMinutes: program.durationMinutes,
      moneyDelta: -program.price,
      needsDelta: needsApplied.delta,
      skillProgress: skillApplied.update,
      messages
    }
  };
}

export type { EducationProgram, EducationResult } from '../../types/education';
