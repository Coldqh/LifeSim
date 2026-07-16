import { applyLifeAction } from '../../core/actions';
import { getTemporaryStayFailure } from '../../core/intercity';
import { applyHouseholdAction, getHouseholdActionFailure } from '../../core/household';
import { getLocationById, isActionAvailableAtLocation } from '../../core/location';
import { getScheduleActivityFailure } from '../../core/schedule';
import { getLifeAction } from '../../data';
import { getHouseholdActionKind } from '../../data/household';
import { getHousingById } from '../../data/cities/contentSelectors';
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

      const householdKind = getHouseholdActionKind(action.id);
      if (householdKind) {
        const householdFailure = getHouseholdActionFailure({
          state: currentState.world.household,
          player: currentState.player,
          kind: householdKind,
          atHome: currentLocation?.id === getHousingById(currentState.player.housingId)?.locationId,
          day: currentState.time.day
        });
        if (householdFailure) {
          const logEntry = createLifeLogEntry(currentState, 'Действие недоступно', householdFailure);
          return {
            ...currentState,
            lastResult: { ok: false, actionId, actionName: action.name, timeDeltaMinutes: 0, messages: [householdFailure] },
            lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
          };
        }

        const applied = applyHouseholdAction({
          state: currentState.world.household,
          player: currentState.player,
          time: currentState.time,
          kind: householdKind
        });
        const elapsedApplied = applyElapsedTimeConsequences(
          currentState,
          applied.player,
          applied.time,
          getNeedsDecayProfileForActionCategory(action.category),
          { household: applied.state, actionTitle: action.name }
        );
        const resultMessages = [...applied.messages, ...elapsedApplied.messages];
        const logEntry = createLifeLogEntry({ time: applied.time }, action.name, resultMessages.join(' '));
        return {
          ...currentState,
          player: elapsedApplied.player,
          world: elapsedApplied.world,
          time: applied.time,
          lastResult: {
            ok: true,
            actionId,
            actionName: applied.actionName,
            timeDeltaMinutes: applied.timeDeltaMinutes,
            moneyDelta: applied.moneyDelta,
            needsDelta: mergeNeedsDelta(applied.needsDelta, elapsedApplied.needsDelta),
            messages: resultMessages
          },
          lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
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
