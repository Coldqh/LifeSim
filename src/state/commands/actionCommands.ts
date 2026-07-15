import { applyLifeAction } from '../../core/actions';
import { getTemporaryStayFailure } from '../../core/intercity';
import { getLocationById, isActionAvailableAtLocation } from '../../core/location';
import { getScheduleActivityFailure } from '../../core/schedule';
import { getLifeAction } from '../../data';
import { temporaryAccommodations } from '../../data/intercity/routes';
import type { ActionId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { getNeedsDecayProfileForActionCategory, applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createActionCommands(setGameState: GameStateSetter) {
  function performAction(actionId: ActionId): void {
    const action = getLifeAction(actionId);
    if (!action) return;

    setGameState((currentState) => {
      if (!isActionAvailableAtLocation(currentState.player.locationId, actionId)) {
        const logEntry = createLifeLogEntry(currentState, 'Действие недоступно', 'Это действие нельзя выполнить в текущем месте.');

        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionId,
            actionName: action.name,
            timeDeltaMinutes: 0,
            messages: ['Это действие нельзя выполнить в текущем месте.']
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const currentLocation = getLocationById(currentState.player.locationId);
      const accommodation = temporaryAccommodations.find((entry) => entry.locationId === currentLocation?.id);
      const lodgingFailure = accommodation && (action.category === 'sleep' || action.category === 'rest')
        ? getTemporaryStayFailure({ state: currentState.world.intercity, locationId: currentLocation?.id, day: currentState.time.day })
        : undefined;
      if (lodgingFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Проживание недоступно', lodgingFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionId, actionName: action.name, timeDeltaMinutes: 0, messages: [lodgingFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const scheduleFailure = getScheduleActivityFailure(
        currentLocation?.openingHours,
        currentState.time,
        action.durationMinutes,
        'Действие'
      );

      if (scheduleFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Действие недоступно', scheduleFailure);
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionId,
            actionName: action.name,
            timeDeltaMinutes: 0,
            messages: [scheduleFailure]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const applied = applyLifeAction({
        player: currentState.player,
        time: currentState.time,
        action
      });

      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        getNeedsDecayProfileForActionCategory(action.category),
        { actionTitle: action.name }
      );
      const resultMessages = [...applied.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry(
        { time: applied.time },
        applied.result.ok ? action.name : 'Действие не выполнено',
        resultMessages.join(' ')
      );

      return {
        ...currentState,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        time: applied.time,
        lastResult: {
          ...applied.result,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    performAction
  };
}
