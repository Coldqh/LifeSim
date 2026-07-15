import { HOUSING_MOVING_DURATION_MINUTES, HOUSING_VIEWING_DURATION_MINUTES, isHousingListingActive, markHousingViewed, moveIntoHousing, scheduleHousingViewing } from '../../core/housing';
import { addMinutes } from '../../core/time';
import { getHousingById } from '../../data/cities/contentSelectors';
import type { HousingId } from '../../types/housing';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createHousingCommands(setGameState: GameStateSetter) {
  function scheduleHousingViewingAction(housingId: HousingId): void {
    setGameState((currentState) => {
      const housing = getHousingById(housingId);
      if (!housing) return currentState;
      const scheduled = scheduleHousingViewing(currentState.world.housingMarket, housingId);
      const logEntry = createLifeLogEntry(
        currentState,
        scheduled.ok ? 'Просмотр жилья' : 'Объявление недоступно',
        scheduled.ok ? `${housing.name}. ${scheduled.message}` : scheduled.message
      );
      return {
        ...currentState,
        world: { ...currentState.world, housingMarket: scheduled.market },
        lastResult: {
          ok: scheduled.ok,
          actionName: 'Просмотр жилья',
          timeDeltaMinutes: 0,
          messages: [scheduled.message]
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function viewHousing(housingId: HousingId): void {
    setGameState((currentState) => {
      const housing = getHousingById(housingId);
      if (!housing) return currentState;
      let failure: string | undefined;
      if (!isHousingListingActive(currentState.world.housingMarket, housingId)) failure = 'Объявление больше не активно.';
      else if (currentState.world.housingMarket.scheduledViewingHousingId !== housingId) failure = 'Сначала назначь просмотр.';
      else if (currentState.player.locationId !== housing.locationId) failure = 'Нужно приехать по адресу объявления.';

      if (failure) {
        const logEntry = createLifeLogEntry(currentState, 'Просмотр недоступен', failure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Просмотр жилья', timeDeltaMinutes: 0, messages: [failure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const nextTime = addMinutes(currentState.time, HOUSING_VIEWING_DURATION_MINUTES);
      const market = markHousingViewed(currentState.world.housingMarket, housingId);
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        currentState.player,
        nextTime,
        'active',
        { housingMarket: market, actionTitle: 'Просмотр жилья' }
      );
      const message = `Жильё осмотрено: ${housing.name}. Характеристики объявления подтверждены.`;
      const messages = [message, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Просмотр жилья', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: 'Просмотр жилья',
          timeDeltaMinutes: HOUSING_VIEWING_DURATION_MINUTES,
          needsDelta: elapsedApplied.needsDelta,
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function rentHousing(housingId: HousingId): void {
    setGameState((currentState) => {
      const housing = getHousingById(housingId);
      if (!housing) return currentState;
      const moved = moveIntoHousing({
        player: currentState.player,
        market: currentState.world.housingMarket,
        housing,
        currentDay: currentState.time.day
      });
      if (!moved.result.ok) {
        const logEntry = createLifeLogEntry(currentState, 'Переезд недоступен', moved.result.messages.join(' '));
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: moved.result.actionName,
            timeDeltaMinutes: 0,
            messages: moved.result.messages
          },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const nextTime = addMinutes(currentState.time, HOUSING_MOVING_DURATION_MINUTES);
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        moved.player,
        nextTime,
        'active',
        { housingMarket: moved.market, actionTitle: moved.result.actionName }
      );
      const messages = [...moved.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Новое жильё', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: moved.result.actionName,
          timeDeltaMinutes: HOUSING_MOVING_DURATION_MINUTES,
          moneyDelta: moved.result.moneyDelta,
          needsDelta: elapsedApplied.needsDelta,
          locationDelta: housing.locationId,
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    scheduleHousingViewingAction,
    viewHousing,
    rentHousing
  };
}
