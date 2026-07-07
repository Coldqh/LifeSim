import { useGameController } from '../state';
import { Dashboard } from './dashboard';

export function AppShell() {
  const {
    gameState,
    actions,
    locationState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    resetGame
  } = useGameController();

  return (
    <Dashboard
      actions={actions}
      gameState={gameState}
      locationState={locationState}
      onBuyProduct={buyProduct}
      onMoveDistrict={moveToDistrict}
      onMoveLocation={moveToLocation}
      onPerformAction={performAction}
      onReset={resetGame}
      onUseInventoryItem={useInventoryItem}
    />
  );
}
