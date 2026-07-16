import { lazy, Suspense } from 'react';
import type { LocationId } from '../../types/ids';
import type { PhoneShellProps } from './phoneTypes';
import { PHONE_APP_LOADERS } from './phoneAppRegistry';

const TodayApp = lazy(PHONE_APP_LOADERS.today);
const GoalsApp = lazy(PHONE_APP_LOADERS.goals);
const ContactsApp = lazy(PHONE_APP_LOADERS.contacts);
const JobsApp = lazy(PHONE_APP_LOADERS.jobs);
const EducationApp = lazy(PHONE_APP_LOADERS.education);
const ClockApp = lazy(PHONE_APP_LOADERS.clock);
const MapsApp = lazy(PHONE_APP_LOADERS.maps);
const BankApp = lazy(PHONE_APP_LOADERS.bank);
const VehiclesApp = lazy(PHONE_APP_LOADERS.auto);
const HealthApp = lazy(PHONE_APP_LOADERS.health);
const TripsApp = lazy(PHONE_APP_LOADERS.trips);
const MessagesApp = lazy(PHONE_APP_LOADERS.messages);
const CalendarApp = lazy(PHONE_APP_LOADERS.calendar);
const NotificationsApp = lazy(PHONE_APP_LOADERS.notifications);

export function PhoneAppRouter(props: PhoneShellProps) {
  const openMap = (locationId: LocationId) => {
    props.onSetMapTarget(locationId);
    props.onOpenApp('maps');
  };

  let content = null;
  switch (props.activeApp) {
    case 'today':
      content = <TodayApp state={props.state} time={props.time} onRoute={openMap} onResolve={props.onResolveDailyOpportunity} onExecute={() => props.onExecuteDailyOpportunity(props.state.dailyLife.opportunity)} onOpenApp={props.onOpenApp} onChooseStory={props.onChooseSocialEvent} onResolveLifeEvent={props.onResolveLongTermLifeDecision} onResolveContextualStory={props.onResolveContextualStory} onClose={props.onClose}/>;
      break;
    case 'goals':
      content = <GoalsApp state={props.state} onSelect={props.onSelectLifeGoal}/>;
      break;
    case 'contacts':
      content = <ContactsApp state={props.state} onRoute={openMap} onSendMessage={props.onSendSocialMessage} onInvite={props.onInviteSocialMeeting} onRespond={props.onRespondSocialInvitation} onAttend={props.onAttendSocialMeeting} onCancel={props.onCancelSocialMeeting}/>;
      break;
    case 'education':
      content = <EducationApp state={props.state} onRoute={openMap} onSubmit={props.onSubmitDegreeApplication} onAttendEntrance={props.onAttendDegreeEntranceExam} onEnroll={props.onEnrollDegreeProgram} onAttendClass={props.onAttendDegreeClass} onCompleteAssignment={props.onCompleteDegreeAssignment} onCampusActivity={props.onPerformDegreeCampusActivity} onTakeExam={props.onTakeDegreeSemesterExam}/>;
      break;
    case 'clock':
      content = <ClockApp onSkip={(minutes: number) => { props.onSkipTime(minutes); props.onClose(); }}/>;
      break;
    case 'jobs':
      content = <JobsApp state={props.state} selectedJobId={props.selectedJobId} onSelectJob={props.onSelectJob} onSubmit={props.onSubmitApplication} onToggleSaved={props.onToggleSavedJob} onRoute={openMap} onAttendInterview={props.onAttendInterview}/>;
      break;
    case 'maps':
      content = <MapsApp state={props.state} currentLocation={props.currentLocation} onClear={() => props.onSetMapTarget(undefined)} onMove={(locationId, modeId) => { props.onMoveLocation(locationId, modeId); props.onClose(); }} onMoveDistrict={(districtId, modeId) => { props.onMoveDistrict(districtId, modeId); props.onClose(); }}/>;
      break;
    case 'bank':
      content = <BankApp state={props.state} onTransfer={props.onTransferFunds} onSetAutoSave={props.onSetAutoSave} onCreateGoal={props.onCreateSavingsGoal} onFundGoal={props.onFundSavingsGoal}/>;
      break;
    case 'auto':
      content = <VehiclesApp state={props.state} onRoute={openMap} onScheduleInspection={props.onScheduleVehicleInspection} onInspect={props.onInspectVehicle} onBuyUsed={props.onBuyUsedVehicle} onBuyNew={props.onBuyNewVehicle} onRefuel={props.onRefuelVehicle} onService={props.onServiceVehicle} onSell={props.onSellVehicle}/>;
      break;
    case 'health':
      content = <HealthApp state={props.state} onRoute={openMap} onSchedule={props.onScheduleMedicalVisit} onAttend={props.onAttendMedicalVisit} onSickLeave={props.onRequestSickLeave}/>;
      break;
    case 'trips':
      content = <TripsApp state={props.state} onRoute={openMap} onBuyTicket={props.onBuyIntercityTicket} onBoard={props.onBoardIntercityTicket} onBookStay={props.onBookTemporaryAccommodation} onDrive={props.onDriveIntercity}/>;
      break;
    case 'messages':
      content = <MessagesApp state={props.state} onRead={props.onReadMessage}/>;
      break;
    case 'calendar':
      content = <CalendarApp time={props.time} state={props.state} onRoute={openMap} onAttend={props.onAttendInterview} onAttendMedical={props.onAttendMedicalVisit} onBoardIntercity={props.onBoardIntercityTicket} onAttendUniversity={props.onAttendDegreeEntranceExam} onAttendSocial={props.onAttendSocialMeeting}/>;
      break;
    case 'notifications':
      content = <NotificationsApp state={props.state} onRead={props.onReadNotification}/>;
      break;
    default:
      return null;
  }

  return <Suspense fallback={<div className="phone-empty-state">Загрузка приложения…</div>}>{content}</Suspense>;
}
