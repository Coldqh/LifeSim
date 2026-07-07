import { useGameController } from '../state';
import { Dashboard } from './dashboard';

export function AppShell() {
  const {
    gameState,
    actions,
    locationState,
    jobState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    applyForJob,
    workShift,
    resetGame
  } = useGameController();

  return (
    <Dashboard
      actions={actions}
      gameState={gameState}
      jobState={jobState}
      locationState={locationState}
      onApplyForJob={applyForJob}
      onBuyProduct={buyProduct}
      onMoveDistrict={moveToDistrict}
      onMoveLocation={moveToLocation}
      onPerformAction={performAction}
      onReset={resetGame}
      onUseInventoryItem={useInventoryItem}
      onWorkShift={workShift}
    />
  );
}
