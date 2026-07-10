import { useGameController } from '../state';
import { Dashboard } from './dashboard';

export function AppShell() {
  const {
    gameState,
    actions,
    locationState,
    jobState,
    educationState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    applyForJob,
    promoteJob,
    workShift,
    studyProgram,
    resetGame
  } = useGameController();

  return (
    <Dashboard
      actions={actions}
      gameState={gameState}
      jobState={jobState}
      educationState={educationState}
      locationState={locationState}
      onApplyForJob={applyForJob}
      onBuyProduct={buyProduct}
      onPromoteJob={promoteJob}
      onMoveDistrict={moveToDistrict}
      onMoveLocation={moveToLocation}
      onPerformAction={performAction}
      onReset={resetGame}
      onUseInventoryItem={useInventoryItem}
      onWorkShift={workShift}
      onStudyProgram={studyProgram}
    />
  );
}
