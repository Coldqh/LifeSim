import { getCareerApplicationFailure, resignCareerEmployment, startCareerEmployment } from '../../core/career';
import { accrueSalary } from '../../core/finance';
import { applyForJob as applyJob, applyJobPromotion, applyJobShift } from '../../core/jobs';
import { applyWorkWhileSick, getMedicalActivityFailure } from '../../core/healthcare';
import { getJobOpportunityFailure } from '../../core/opportunity-lifecycle';
import { getCareerProgressionFailure } from '../../core/life-progression';
import { getOrganizationJobModifier } from '../../core/organizations';
import { getTotalMinutes } from '../../core/time';
import { getJobById } from '../../data/cities/contentSelectors';
import { getSkillById } from '../../data/skills/basicSkills';
import { getOrganizationForJob } from '../../data/organizations';
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
      const careerFailure = getJobOpportunityFailure(currentState.world.opportunities, job.id)
        ?? getCareerApplicationFailure(currentState.player, job, 'direct')
        ?? getCareerProgressionFailure(currentState.progression, job);
      if (careerFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Работа недоступна', careerFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: job.title, timeDeltaMinutes: 0, messages: [careerFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const applied = applyJob({ player: currentState.player, job });
      const player = applied.result.ok
        ? startCareerEmployment({ player: applied.player, job, currentDay: currentState.time.day })
        : applied.player;
      const probationMessage = applied.result.ok && (job.probationDays ?? 0) > 0
        ? `Испытательный срок: ${job.probationDays} дней.`
        : undefined;
      const messages = [...applied.result.messages, probationMessage].filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry(
        currentState,
        applied.result.ok ? 'Работа' : 'Работа недоступна',
        messages.join(' ')
      );

      return {
        ...currentState,
        player,
        lastResult: {
          ok: applied.result.ok,
          actionName: applied.result.jobTitle,
          timeDeltaMinutes: 0,
          messages
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
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
      const organizationModifier = getOrganizationJobModifier({ state: currentState.world.organizations, definition: getOrganizationForJob(job.id) });
      const applied = applyJobShift({ player: currentState.player, time: currentState.time, job, organizationModifier });
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

  function resignCurrentJob(): void {
    setGameState((currentState) => {
      const job = getJobById(currentState.player.currentJobId);
      if (!job) {
        const message = 'У тебя нет текущей работы.';
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Увольнение', timeDeltaMinutes: 0, messages: [message] }
        };
      }

      const resigned = resignCareerEmployment({ player: currentState.player, currentDay: currentState.time.day });
      const message = `Ты уволился: ${job.title}.`;
      return {
        ...currentState,
        player: resigned.player,
        lastResult: { ok: true, actionName: 'Увольнение', timeDeltaMinutes: 0, messages: [message] },
        lifeLog: mergeLifeLog([createLifeLogEntry(currentState, 'Карьера', message)], currentState.lifeLog)
      };
    });
  }

  return {
    applyForJob,
    promoteJob,
    workShift,
    resignCurrentJob
  };
}
