import { useState } from 'react';
import { useGameController } from '../state';
import type { JobId } from '../types/ids';
import type { PhoneAppId } from '../types/phone';
import { Dashboard } from './dashboard';
import { PhoneShell } from './phone';

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
    businessState,
    phoneState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
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
    openCoffeeBusiness,
    purchaseBusinessSupply,
    changeBusinessMenuPrice,
    hireBusinessNpc,
    fireBusinessNpc,
    addBusinessFunds,
    purchaseBusinessEquipment,
    purchaseBusinessUpgrade,
    workBusinessOwnerShift,
    submitJobApplication,
    togglePhoneSavedJob,
    setPhoneMapLocation,
    readPhoneNotification,
    readPhoneMessage,
    attendJobInterview,
    resetGame
  } = useGameController();
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneApp, setPhoneApp] = useState<PhoneAppId>('home');
  const [selectedPhoneJobId, setSelectedPhoneJobId] = useState<JobId>();

  function openPhone(app: PhoneAppId = 'home', jobId?: JobId): void {
    setPhoneApp(app);
    setSelectedPhoneJobId(jobId);
    setPhoneOpen(true);
  }

  return (
    <>
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
        businessState={businessState}
        locationState={locationState}
        onApplyForJob={(jobId) => openPhone('jobs', jobId)}
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
        onOpenBusiness={openCoffeeBusiness}
        onBuyBusinessSupply={purchaseBusinessSupply}
        onSetBusinessPrice={changeBusinessMenuPrice}
        onHireBusinessNpc={hireBusinessNpc}
        onFireBusinessNpc={fireBusinessNpc}
        onInvestBusiness={addBusinessFunds}
        onBuyBusinessEquipment={purchaseBusinessEquipment}
        onBuyBusinessUpgrade={purchaseBusinessUpgrade}
        onWorkBusinessOwnerShift={workBusinessOwnerShift}
      />
      <PhoneShell
        open={phoneOpen}
        activeApp={phoneApp}
        selectedJobId={selectedPhoneJobId}
        time={gameState.time}
        currentLocation={locationState.location}
        state={phoneState}
        onClose={() => setPhoneOpen(false)}
        onOpen={() => openPhone('home')}
        onOpenApp={(app) => setPhoneApp(app)}
        onSelectJob={setSelectedPhoneJobId}
        onSubmitApplication={submitJobApplication}
        onToggleSavedJob={togglePhoneSavedJob}
        onSetMapTarget={setPhoneMapLocation}
        onMoveLocation={moveToLocation}
        onReadNotification={readPhoneNotification}
        onReadMessage={readPhoneMessage}
        onAttendInterview={attendJobInterview}
      />
    </>
  );
}
