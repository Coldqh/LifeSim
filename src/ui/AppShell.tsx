import { useGameController } from '../state';
import { Dashboard } from './dashboard';

export function AppShell() {
  const { gameState, actions, locationState, performAction, moveToDistrict, moveToLocation, resetGame } =
    useGameController();

  return (
    <Dashboard
      actions={actions}
      gameState={gameState}
      locationState={locationState}
      onMoveDistrict={moveToDistrict}
      onMoveLocation={moveToLocation}
      onPerformAction={performAction}
      onReset={resetGame}
    />
  );
}
