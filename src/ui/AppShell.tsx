import { useGameController } from '../state';
import { Dashboard } from './dashboard';

export function AppShell() {
  const {
    gameState,
    actions,
    locationState,
    jobState,
    educationState,
    boxingState,
    conditionState,
    populationState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    applyForJob,
    promoteJob,
    workShift,
    studyProgram,
    buyBoxingMembership,
    chooseBoxingTrainer,
    performBoxingTraining,
    startBoxingSparring,
    enterBoxingTournament,
    resetGame
  } = useGameController();

  return (
    <Dashboard
      actions={actions}
      gameState={gameState}
      jobState={jobState}
      educationState={educationState}
      boxingState={boxingState}
      conditionState={conditionState}
      populationState={populationState}
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
      onBuyBoxingMembership={buyBoxingMembership}
      onChooseBoxingTrainer={chooseBoxingTrainer}
      onBoxingTraining={performBoxingTraining}
      onBoxingSparring={startBoxingSparring}
      onBoxingTournament={enterBoxingTournament}
    />
  );
}
