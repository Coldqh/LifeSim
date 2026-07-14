import { useState } from 'react';
import { useGameController } from '../state';
import type { CityId, IntercityRouteId, IntercityTicketId, JobId, TemporaryAccommodationId, VehicleListingId, VehicleModelId, DegreeProgramId, UniversitySubjectId } from '../types/ids';
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
    vehicleState,
    healthState,
    universityState,
    scheduledWaitState,
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
    exchangeNpcContact,
    sendNpcPhoneMessage,
    inviteNpcToMeeting,
    respondNpcMeetingInvitation,
    attendNpcMeeting,
    cancelNpcMeeting,
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
    scheduleMedicalVisit,
    attendMedicalVisit,
    requestSickLeave,
    transferPersonalFunds,
    updateAutoSave,
    addSavingsGoal,
    addMoneyToSavingsGoal,
    scheduleVehicleInspection,
    inspectVehicle,
    buyUsedVehicle,
    buyNewVehicle,
    refuelVehicle,
    serviceVehicle,
    sellVehicle,
    buyIntercityTicket,
    boardIntercityTicket,
    bookTemporaryAccommodation,
    driveIntercity,
    submitDegreeApplication,
    attendDegreeEntranceExam,
    enrollDegreeProgram,
    attendDegreeClass,
    completeDegreeAssignment,
    takeDegreeSemesterExam,
    skipGameTime,
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
        scheduledWaitState={scheduledWaitState}
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
        onExchangeNpcContact={exchangeNpcContact}
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
        onOpenPhone={() => openPhone('home')}
        onWaitForScheduledEvent={(minutes) => skipGameTime(minutes, 30 * 24 * 60)}
        phoneUnreadCount={phoneState.unreadCount}
      />
      <PhoneShell
        open={phoneOpen}
        activeApp={phoneApp}
        selectedJobId={selectedPhoneJobId}
        time={gameState.time}
        currentLocation={locationState.location}
        state={{ ...phoneState, vehicles: vehicleState, health: healthState, university: universityState }}
        onClose={() => setPhoneOpen(false)}
        onOpen={() => openPhone('home')}
        onOpenApp={(app) => setPhoneApp(app)}
        onSelectJob={setSelectedPhoneJobId}
        onSubmitApplication={submitJobApplication}
        onToggleSavedJob={togglePhoneSavedJob}
        onSetMapTarget={setPhoneMapLocation}
        onMoveLocation={moveToLocation}
        onMoveDistrict={moveToDistrict}
        onReadNotification={readPhoneNotification}
        onReadMessage={readPhoneMessage}
        onAttendInterview={attendJobInterview}
        onScheduleMedicalVisit={scheduleMedicalVisit}
        onAttendMedicalVisit={attendMedicalVisit}
        onRequestSickLeave={requestSickLeave}
        onTransferFunds={transferPersonalFunds}
        onSetAutoSave={updateAutoSave}
        onCreateSavingsGoal={addSavingsGoal}
        onFundSavingsGoal={addMoneyToSavingsGoal}
        onScheduleVehicleInspection={(id: VehicleListingId) => scheduleVehicleInspection(id)}
        onInspectVehicle={(id: VehicleListingId) => inspectVehicle(id)}
        onBuyUsedVehicle={(id: VehicleListingId) => buyUsedVehicle(id)}
        onBuyNewVehicle={(id: VehicleModelId) => buyNewVehicle(id)}
        onRefuelVehicle={refuelVehicle}
        onServiceVehicle={serviceVehicle}
        onSellVehicle={sellVehicle}
        onBuyIntercityTicket={(routeId: IntercityRouteId, departureTotalMinutes: number) => buyIntercityTicket(routeId, departureTotalMinutes)}
        onBoardIntercityTicket={(ticketId: IntercityTicketId) => boardIntercityTicket(ticketId)}
        onBookTemporaryAccommodation={(id: TemporaryAccommodationId, nights: number) => bookTemporaryAccommodation(id, nights)}
        onDriveIntercity={(cityId: CityId) => driveIntercity(cityId)}
        onSubmitDegreeApplication={(id: DegreeProgramId) => submitDegreeApplication(id)}
        onAttendDegreeEntranceExam={(id: DegreeProgramId) => attendDegreeEntranceExam(id)}
        onEnrollDegreeProgram={(id: DegreeProgramId) => enrollDegreeProgram(id)}
        onAttendDegreeClass={(subjectId: UniversitySubjectId, startsAt: number) => attendDegreeClass(subjectId, startsAt)}
        onCompleteDegreeAssignment={completeDegreeAssignment}
        onTakeDegreeSemesterExam={takeDegreeSemesterExam}
        onSkipTime={skipGameTime}
        onSendSocialMessage={sendNpcPhoneMessage}
        onInviteSocialMeeting={inviteNpcToMeeting}
        onRespondSocialInvitation={respondNpcMeetingInvitation}
        onAttendSocialMeeting={attendNpcMeeting}
        onCancelSocialMeeting={cancelNpcMeeting}
      />
    </>
  );
}
