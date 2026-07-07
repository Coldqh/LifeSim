import { useGameController } from '../state';
import { Dashboard } from './dashboard';

export function AppShell() {
  const { gameState, actions, performAction, resetGame } = useGameController();

  return <Dashboard actions={actions} gameState={gameState} onPerformAction={performAction} onReset={resetGame} />;
}
