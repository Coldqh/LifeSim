import { applyMoneyDelta } from '../economy';
import { applyNeedsDelta, getNeedWarning } from '../needs';
import { addMinutes } from '../time';
import type { Job, JobApplicationResult, JobShiftResult } from '../../types/job';
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
};

export type ApplyJobShiftOutput = {
  player: Player;
  time: GameTime;
  result: JobShiftResult;
};

export function getJobApplicationFailure(player: Player, job: Job): string | undefined {
  const minEnergy = job.requirements?.minEnergy;

  if (minEnergy !== undefined && player.needs.energy < minEnergy) {
    return `Нужно больше энергии: минимум ${minEnergy}.`;
  }

  return undefined;
}

export function getJobShiftFailure(player: Player, job: Job): string | undefined {
  if (player.currentJobId !== job.id) {
    return 'Сначала устройся на эту работу.';
  }

  if (player.locationId !== job.locationId) {
    return 'Нужно быть на месте работы.';
  }

  const minEnergy = job.requirements?.minEnergy;
  if (minEnergy !== undefined && player.needs.energy < minEnergy) {
    return `Не хватает энергии для смены. Нужно минимум ${minEnergy}.`;
  }

  return undefined;
}

export function applyForJob(input: ApplyJobInput): ApplyJobOutput {
  const { player, job } = input;
  const failure = getJobApplicationFailure(player, job);

  if (failure) {
    return {
      player,
      result: {
        ok: false,
        jobId: job.id,
        jobTitle: job.title,
        messages: [failure]
      }
    };
  }

  return {
    player: {
      ...player,
      currentJobId: job.id
    },
    result: {
      ok: true,
      jobId: job.id,
      jobTitle: job.title,
      messages: [`Ты устроился: ${job.title}.`]
    }
  };
}

export function applyJobShift(input: ApplyJobShiftInput): ApplyJobShiftOutput {
  const { player, time, job } = input;
  const failure = getJobShiftFailure(player, job);

  if (failure) {
    return {
      player,
      time,
      result: {
        ok: false,
        jobId: job.id,
        jobTitle: job.title,
        timeDeltaMinutes: 0,
        moneyDelta: 0,
        messages: [failure]
      }
    };
  }

  const nextTime = addMinutes(time, job.shiftDurationMinutes);
  const nextNeeds = applyNeedsDelta(player.needs, job.effects.needsDelta);
  const nextMoney = applyMoneyDelta(player.money, job.effects.moneyDelta);
  const completedCount = (player.completedShifts[job.id] ?? 0) + 1;
  const warning = getNeedWarning(nextNeeds);
  const baseMessage = `Смена завершена: ${job.title}. Получено ${job.wagePerShift} ₽.`;
  const messages = warning ? [baseMessage, warning] : [baseMessage];

  return {
    player: {
      ...player,
      money: nextMoney,
      needs: nextNeeds,
      completedShifts: {
        ...player.completedShifts,
        [job.id]: completedCount
      }
    },
    time: nextTime,
    result: {
      ok: true,
      jobId: job.id,
      jobTitle: job.title,
      timeDeltaMinutes: job.shiftDurationMinutes,
      moneyDelta: job.effects.moneyDelta,
      needsDelta: job.effects.needsDelta,
      messages
    }
  };
}

export type { Job, JobApplicationResult, JobShiftResult };
