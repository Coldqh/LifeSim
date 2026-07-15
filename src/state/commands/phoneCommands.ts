import { applyForJob as applyJob, getJobApplicationFailure } from '../../core/jobs';
import { getLocationById } from '../../core/location';
import { completeJobInterview, markPhoneMessageRead, markPhoneNotificationRead, setPhoneMapTarget, submitPhoneJobApplication, toggleSavedPhoneJob } from '../../core/phone';
import { addMinutes, getTotalMinutes } from '../../core/time';
import { getJobById } from '../../data/jobs/basicJobs';
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
      const applied = submitPhoneJobApplication({
        state: currentState.world.phone,
        job,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        applicationFailure: getJobApplicationFailure(currentState.player, job),
        employerName: location?.name ?? 'Работодатель'
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
      const interview = completeJobInterview({
        state: currentState.world.phone,
        job,
        currentLocationId: currentState.player.locationId,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        employerName: location?.name ?? 'Работодатель'
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

      const nextTime = addMinutes(currentState.time, 30);
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        hired.player,
        nextTime,
        'active',
        { phone: interview.state, actionTitle: 'Собеседование' }
      );
      const messages = [interview.result.message, ...elapsedApplied.messages];
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
