import { clearSavedGameState, createInitialGameState } from '../gameState';
import type { GameStateSetter } from './commandSupport';

export function createSystemCommands(setGameState: GameStateSetter) {
  function resetGame(): void {
    clearSavedGameState();
    setGameState(createInitialGameState());
  }

  return {
    resetGame
  };
}
