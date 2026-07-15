import { accrueSalary } from '../../core/finance';
import { applyForJob as applyJob, applyJobPromotion, applyJobShift } from '../../core/jobs';
import { applyWorkWhileSick, getMedicalActivityFailure } from '../../core/healthcare';
import { getTotalMinutes } from '../../core/time';
import { getJobById } from '../../data/jobs/basicJobs';
import { getSkillById } from '../../data/skills/basicSkills';
import type { JobId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createJobCommands(setGameState: GameStateSetter) {
  function applyForJob(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;

    setGameState((currentState) => {
      const applied = applyJob({
        player: currentState.player,
        job
      });
      const logEntry = createLifeLogEntry(
        currentState,
        applied.result.ok ? 'Работа' : 'Работа недоступна',
        applied.result.messages.join(' ')
      );

      return {
        ...currentState,
        player: applied.player,
        lastResult: {
          ok: applied.result.ok,
          actionName: applied.result.jobTitle,
          timeDeltaMinutes: 0,
          messages: applied.result.messages
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function promoteJob(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;

    setGameState((currentState) => {
      const promoted = applyJobPromotion({
        player: currentState.player,
        job
      });
      const logEntry = createLifeLogEntry(
        currentState,
        promoted.result.ok ? 'Повышение' : 'Повышение недоступно',
        promoted.result.messages.join(' ')
      );

      return {
        ...currentState,
        player: promoted.player,
        lastResult: {
          ok: promoted.result.ok,
          actionName: promoted.result.nextTitle,
          timeDeltaMinutes: 0,
          messages: promoted.result.messages
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function workShift(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;

    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'work');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Смена недоступна', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: job.title, timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const applied = applyJobShift({
        player: currentState.player,
        time: currentState.time,
        job
      });
      const earnedSalary = applied.result.ok ? Math.max(0, applied.result.moneyDelta ?? 0) : 0;
      const deferredPlayer = earnedSalary > 0
        ? { ...applied.player, money: Math.max(0, applied.player.money - earnedSalary) }
        : applied.player;
      const finance = earnedSalary > 0
        ? accrueSalary(currentState.world.finance, earnedSalary, getTotalMinutes(applied.time), applied.result.jobTitle)
        : currentState.world.finance;
      const elapsedApplied = applyElapsedTimeConsequences(currentState, deferredPlayer, applied.time, 'active', { finance, actionTitle: applied.result.jobTitle });
      const sicknessApplied = applied.result.ok
        ? applyWorkWhileSick(elapsedApplied.medical, elapsedApplied.player, getTotalMinutes(applied.time))
        : { state: elapsedApplied.medical, player: elapsedApplied.player, message: undefined };
      const skillLevelMessages = (applied.result.skillProgressUpdates ?? [])
        .filter((update) => update.leveledUp)
        .map((update) => `Навык «${getSkillById(update.skillId)?.name ?? 'Навык'}» повышен до уровня ${update.nextLevel}.`);
      const salaryMessage = earnedSalary > 0 ? `Начислено ${earnedSalary} ₽. Выплата в день ${finance.nextSalaryPayoutDay}.` : undefined;
      const resultMessages = [...applied.result.messages, salaryMessage, sicknessApplied.message, ...skillLevelMessages, ...elapsedApplied.messages].filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry(
        { time: applied.time },
        applied.result.ok ? 'Смена' : 'Смена недоступна',
        resultMessages.join(' ')
      );
      const skillLevelEntries = skillLevelMessages.map((message) =>
        createLifeLogEntry({ time: applied.time }, 'Новый уровень навыка', message)
      );

      return {
        ...currentState,
        player: sicknessApplied.player,
        world: { ...elapsedApplied.world, medical: sicknessApplied.state },
        time: applied.time,
        lastResult: {
          ok: applied.result.ok,
          actionName: applied.result.jobTitle,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: 0,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...skillLevelEntries, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    applyForJob,
    promoteJob,
    workShift
  };
}
