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
    socialState,
    housingState,
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
    interactWithNpc,
    chooseSocialEvent,
    scheduleHousingViewing,
    viewHousing,
    rentHousing,
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
      socialState={socialState}
      housingState={housingState}
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
      onInteractWithNpc={interactWithNpc}
      onChooseSocialEvent={chooseSocialEvent}
      onScheduleHousingViewing={scheduleHousingViewing}
      onViewHousing={viewHousing}
      onRentHousing={rentHousing}
    />
  );
}
