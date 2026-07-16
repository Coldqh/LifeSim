import { getLifeGoalDefinition } from '../../data/lifeGoals';
import type { LifeGoalId } from '../../types/lifeGoal';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { mergeLifeLog } from './commandSupport';

export function createLifeGoalCommands(setGameState: GameStateSetter) {
  function selectLifeGoal(goalId: LifeGoalId): void {
    setGameState((currentState) => {
      const definition = getLifeGoalDefinition(goalId);
      if (!definition) return currentState;
      if (currentState.lifeGoals.activeGoalId) {
        const active = getLifeGoalDefinition(currentState.lifeGoals.activeGoalId);
        const message = `Главная цель уже выбрана: «${active?.title ?? currentState.lifeGoals.activeGoalId}».`;
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Жизненная цель', timeDeltaMinutes: 0, messages: [message] },
          lifeLog: mergeLifeLog([createLifeLogEntry(currentState, 'Цель не изменена', message)], currentState.lifeLog)
        };
      }

      const message = `Главная цель выбрана: «${definition.title}».`;
      return {
        ...currentState,
        lifeGoals: {
          ...currentState.lifeGoals,
          activeGoalId: definition.id,
          selectedDay: currentState.time.day
        },
        lastResult: { ok: true, actionName: 'Жизненная цель', timeDeltaMinutes: 0, messages: [message] },
        lifeLog: mergeLifeLog([createLifeLogEntry(currentState, 'Новая жизненная цель', message)], currentState.lifeLog)
      };
    });
  }

  return { selectLifeGoal };
}
