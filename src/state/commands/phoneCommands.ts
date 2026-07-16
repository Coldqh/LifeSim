import { getCareerApplicationFailure, startCareerEmployment } from '../../core/career';
import { applyForJob as applyJob, getJobApplicationFailure } from '../../core/jobs';
import { getLocationById } from '../../core/location';
import { getCareerInviteChanceDelta, getCareerProgressionFailure } from '../../core/life-progression';
import { completeJobInterview, markPhoneMessageRead, markPhoneNotificationRead, setPhoneMapTarget, submitPhoneJobApplication, toggleSavedPhoneJob } from '../../core/phone';
import { getWorldDynamicsModifiers } from '../../core/world-dynamics';
import { getJobOpportunityFailure } from '../../core/opportunity-lifecycle';
import { addMinutes, getTotalMinutes } from '../../core/time';
import { getCareerCompanyById, getJobById } from '../../data/cities/contentSelectors';
import type { JobId, PhoneMessageId, PhoneNotificationId, LocationId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createPhoneCommands(setGameState: GameStateSetter) {
  function submitJobApplication(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;
    setGameState((currentState) => {
      const location = getLocationById(job.locationId);
      const company = getCareerCompanyById(job.companyId);
      const applicationFailure = getJobOpportunityFailure(currentState.world.opportunities, job.id)
        ?? getJobApplicationFailure(currentState.player, job)
        ?? getCareerApplicationFailure(currentState.player, job, 'phone')
        ?? getCareerProgressionFailure(currentState.progression, job);
      const worldModifiers = getWorldDynamicsModifiers(
        currentState.world.dynamics,
        currentState.player.cityId,
        currentState.time.day
      );
      const applied = submitPhoneJobApplication({
        state: currentState.world.phone,
        job,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        applicationFailure,
        employerName: company?.name ?? location?.name ?? 'Работодатель',
        responseDelayMultiplier: worldModifiers.jobResponseDelayMultiplier,
        inviteChanceDelta: worldModifiers.jobInviteChanceDelta + getCareerInviteChanceDelta(currentState.progression)
      });
      const logEntry = createLifeLogEntry(
        currentState,
        applied.result.ok ? 'Отклик отправлен' : 'Отклик не отправлен',
        applied.result.message
      );
      return {
        ...currentState,
        world: { ...currentState.world, phone: applied.state },
        lastResult: {
          ok: applied.result.ok,
          actionName: applied.result.title,
          timeDeltaMinutes: 0,
          messages: [applied.result.message]
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function togglePhoneSavedJob(jobId: JobId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: toggleSavedPhoneJob(currentState.world.phone, jobId) }
    }));
  }

  function setPhoneMapLocation(locationId?: LocationId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: setPhoneMapTarget(currentState.world.phone, locationId) }
    }));
  }

  function readPhoneNotification(id: PhoneNotificationId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: markPhoneNotificationRead(currentState.world.phone, id) }
    }));
  }

  function readPhoneMessage(id: PhoneMessageId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: markPhoneMessageRead(currentState.world.phone, id) }
    }));
  }

  function attendJobInterview(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;
    setGameState((currentState) => {
      const location = getLocationById(job.locationId);
      const company = getCareerCompanyById(job.companyId);
      const careerFailure = getCareerApplicationFailure(currentState.player, job, 'interview')
        ?? getCareerProgressionFailure(currentState.progression, job);
      if (careerFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Собеседование недоступно', careerFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Собеседование', timeDeltaMinutes: 0, messages: [careerFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const interview = completeJobInterview({
        state: currentState.world.phone,
        job,
        currentLocationId: currentState.player.locationId,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        employerName: company?.name ?? location?.name ?? 'Работодатель'
      });
      if (!interview.result.ok) {
        const logEntry = createLifeLogEntry(currentState, interview.result.title, interview.result.message);
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: interview.result.title,
            timeDeltaMinutes: 0,
            messages: [interview.result.message]
          },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const hired = applyJob({ player: currentState.player, job });
      if (!hired.result.ok) {
        const message = hired.result.messages.join(' ');
        const logEntry = createLifeLogEntry(currentState, 'Собеседование не завершено', message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Собеседование', timeDeltaMinutes: 0, messages: [message] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const employedPlayer = startCareerEmployment({
        player: hired.player,
        job,
        currentDay: currentState.time.day
      });
      const nextTime = addMinutes(currentState.time, 30);
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        employedPlayer,
        nextTime,
        'active',
        { phone: interview.state, actionTitle: 'Собеседование' }
      );
      const probationMessage = (job.probationDays ?? 0) > 0 ? `Испытательный срок: ${job.probationDays} дней.` : undefined;
      const messages = [interview.result.message, probationMessage, ...elapsedApplied.messages].filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Собеседование', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: 'Собеседование',
          timeDeltaMinutes: 30,
          needsDelta: elapsedApplied.needsDelta,
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    submitJobApplication,
    togglePhoneSavedJob,
    setPhoneMapLocation,
    readPhoneNotification,
    readPhoneMessage,
    attendJobInterview
  };
}
