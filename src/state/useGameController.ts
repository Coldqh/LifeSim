import { useEffect, useMemo, useState } from 'react';
import { applyLifeAction } from '../core/actions';
import { lifeActions } from '../data';
import type { ActionId } from '../types/ids';
import {
  clearSavedGameState,
  createInitialGameState,
  createLifeLogEntry,
  loadGameState,
  saveGameState,
  type GameState
} from './gameState';

function resolveInitialState(): GameState {
  return loadGameState() ?? createInitialGameState();
}

export function useGameController() {
  const [gameState, setGameState] = useState<GameState>(resolveInitialState);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const actions = useMemo(() => lifeActions, []);

  function performAction(actionId: ActionId): void {
    const action = lifeActions.find((candidate) => candidate.id === actionId);
    if (!action) return;

    setGameState((currentState) => {
      const applied = applyLifeAction({
        player: currentState.player,
        time: currentState.time,
        action
      });

      const logEntry = createLifeLogEntry(
        { time: applied.time },
        applied.result.ok ? action.name : 'Действие не выполнено',
        applied.result.messages.join(' ')
      );

      return {
        ...currentState,
        player: applied.player,
        time: applied.time,
        lastResult: applied.result,
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function resetGame(): void {
    clearSavedGameState();
    setGameState(createInitialGameState());
  }

  return {
    gameState,
    actions,
    performAction,
    resetGame
  };
}
