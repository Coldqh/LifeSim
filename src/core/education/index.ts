import { applyMoneyDelta, canAfford } from '../economy';
import { applyNeedsDelta, getNeedWarning } from '../needs';
import { applySkillExperience } from '../progression';
import { addMinutes } from '../time';
import type { EducationProgram, EducationResult } from '../../types/education';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';

export type ApplyEducationProgramInput = {
  player: Player;
  time: GameTime;
  program: EducationProgram;
};

export type ApplyEducationProgramOutput = {
  player: Player;
  time: GameTime;
  result: EducationResult;
};

export function getEducationProgramFailure(player: Player, program: EducationProgram): string | undefined {
  if (player.locationId !== program.locationId) {
    return program.mode === 'self_study'
      ? 'Самообучение доступно дома.'
      : 'Нужно находиться в образовательном центре.';
  }

  if (!canAfford(player.money, program.price)) {
    return 'Не хватает денег на обучение.';
  }

  if (program.minEnergy !== undefined && player.needs.energy < program.minEnergy) {
    return `Не хватает энергии. Нужно минимум ${program.minEnergy}.`;
  }

  return undefined;
}

export function applyEducationProgram(input: ApplyEducationProgramInput): ApplyEducationProgramOutput {
  const { player, time, program } = input;
  const failure = getEducationProgramFailure(player, program);

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
  const nextNeeds = applyNeedsDelta(player.needs, program.needsDelta ?? {});
  const nextTime = addMinutes(time, program.durationMinutes);
  const nextMoney = applyMoneyDelta(player.money, -program.price);
  const warning = getNeedWarning(nextNeeds);
  const baseMessage = `${program.title}: +${program.experienceReward} XP навыка.`;
  const messages = warning ? [baseMessage, warning] : [baseMessage];

  return {
    player: {
      ...player,
      money: nextMoney,
      needs: nextNeeds,
      skills: skillApplied.skills
    },
    time: nextTime,
    result: {
      ok: true,
      programId: program.id,
      programTitle: program.title,
      timeDeltaMinutes: program.durationMinutes,
      moneyDelta: -program.price,
      needsDelta: program.needsDelta,
      skillProgress: skillApplied.update,
      messages
    }
  };
}

export type { EducationProgram, EducationResult } from '../../types/education';
