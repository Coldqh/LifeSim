import type { CareerCompany, CareerResume } from '../../types/career';
import type { Job } from '../../types/job';
import type { City, District, Location } from '../../types/location';
import type {
  CityId,
  DistrictId,
  JobId,
  LocationId,
  MedicalServiceId,
  PhoneMessageId,
  PhoneNotificationId,
  VehicleListingId,
  VehicleModelId,
  IntercityRouteId,
  IntercityTicketId,
  TemporaryAccommodationId,
  DegreeProgramId,
  UniversityCampusActivityId,
  UniversitySubjectId,
  NpcId,
  SocialInvitationId,
  SocialMeetingId,
  SocialMeetingTypeId
} from '../../types/ids';
import type {
  PhoneAppId,
  PhoneJobApplication,
  PhoneMessage,
  PhoneState
} from '../../types/phone';
import type { GameTime } from '../../types/time';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import type { PersonalFinanceState, UpcomingPayment } from '../../types/finance';
import type { TravelModeId } from '../../types/transport';
import type { VehicleListingView, VehicleModel, VehicleWorldState } from '../../types/vehicle';
import type { ActiveMedicalCondition, MedicalAppointment, MedicalConditionDefinition, MedicalPrescription, MedicalService, MedicalState, SickLeave } from '../../types/healthcare';
import type { Product } from '../../types/product';
import type { IntercityCarQuote, IntercityDeparture, IntercityRoadConnection, IntercityRoute, IntercityTicket, IntercityTravelState, TemporaryAccommodation, TemporaryStay } from '../../types/intercity';
import type { ScheduleStatus } from '../../types/schedule';
import type { DegreeProgramDefinition, UniversityApplication, UniversityAssignment, UniversityCampusActivityDefinition, UniversityClassView, UniversityDefinition, UniversityEnrollment, UniversityState } from '../../types/university';
import type { Npc, NpcRoleDefinition } from '../../types/npc';
import type { NpcRelationship, RelationshipStatus } from '../../types/relationship';
import type { SocialContact, SocialCircleTag, SocialInvitation, SocialMeeting, SocialMeetingDefinition, SocialMeetingSlot, SocialMessageActionId, SocialQuickMessageDefinition } from '../../types/socialLife';

export type PhoneVacancyView = {
  job: Job;
  location?: Location;
  district?: District;
  company?: CareerCompany;
  requiredDegreeTitles: string[];
  hasRequiredDegree: boolean;
  application?: PhoneJobApplication;
  applicationFailure?: string;
  missingSkillRequirements: Array<{ skillId: import('../../types/ids').SkillId; name: string; currentLevel: number; minLevel: number }>;
  interviewFailure?: string;
  saved: boolean;
  estimatedMonthlyIncome: number;
};

export type VehiclePanelState = {
  world: VehicleWorldState;
  listings: VehicleListingView[];
  dealerModels: Array<{
    model: VehicleModel;
    dealerLocationId: LocationId;
    dealerLocation?: Location;
    isAtDealer: boolean;
    canAfford: boolean;
  }>;
  ownedVehicle?: VehicleWorldState['ownedVehicle'];
  ownedModel?: VehicleModel;
  parkedLocation?: Location;
  currentLocation?: Location;
  atGasStation: boolean;
  atService: boolean;
  fuelPriceLabel?: string;
};

export type HealthPanelState = {
  medical: MedicalState;
  conditions: Array<{ condition: ActiveMedicalCondition; definition?: MedicalConditionDefinition }>;
  services: Array<{
    service: MedicalService;
    clinic?: Location;
    appointment?: MedicalAppointment;
    scheduleStatus: ScheduleStatus;
    attendFailure?: string;
  }>;
  prescriptions: Array<{ prescription: MedicalPrescription; product?: Product; conditionName: string }>;
  symptoms: Array<{ symptom: string; diagnosed: boolean; conditionId: ActiveMedicalCondition['id'] }>;
  sickLeave?: SickLeave;
  upcomingAppointment?: MedicalAppointment;
};

export type IntercityPanelState = {
  state: IntercityTravelState;
  routes: Array<{
    route: IntercityRoute;
    originTerminal?: Location;
    destinationTerminal?: Location;
    originCity?: City;
    destinationCity?: City;
    departures: IntercityDeparture[];
  }>;
  tickets: Array<{
    ticket: IntercityTicket;
    route?: IntercityRoute;
    originTerminal?: Location;
    destinationTerminal?: Location;
    boardFailure?: string;
  }>;
  accommodations: Array<{
    accommodation: TemporaryAccommodation;
    location?: Location;
    active: boolean;
    canAffordNight: boolean;
  }>;
  activeStay?: TemporaryStay;
  currentCity?: City;
  roadDestinations: Array<{
    connection: IntercityRoadConnection;
    city?: City;
    arrivalLocation?: Location;
    carQuote: IntercityCarQuote;
  }>;
  ownedModel?: VehicleModel;
};

export type UniversityPanelState = {
  state: UniversityState;
  programs: Array<{
    program: DegreeProgramDefinition;
    university?: UniversityDefinition;
    application?: UniversityApplication;
    missingSkillRequirements: Array<{ name: string; currentLevel: number; minLevel: number }>;
    examFailure?: string;
    canApply: boolean;
    canEnroll: boolean;
  }>;
  enrollment?: UniversityEnrollment;
  activeProgram?: DegreeProgramDefinition;
  activeUniversity?: UniversityDefinition;
  classes: UniversityClassView[];
  assignments: UniversityAssignment[];
  campusActivities: Array<{ activity: UniversityCampusActivityDefinition; failure?: string }>;
  campusPeople: Npc[];
};

export type PhoneSocialContactView = {
  contact: SocialContact;
  npc: Npc;
  relationship: NpcRelationship;
  role?: NpcRoleDefinition;
  status: RelationshipStatus;
  circles: SocialCircleTag[];
  messages: PhoneMessage[];
  quickMessages: Array<{ definition: SocialQuickMessageDefinition; failure?: string }>;
  pendingInvitation?: SocialInvitation;
  scheduledMeeting?: SocialMeeting;
};

export type PhoneSocialState = {
  contacts: PhoneSocialContactView[];
  meetingOptions: Array<{ definition: SocialMeetingDefinition; locations: Location[] }>;
  invitations: Array<{ invitation: SocialInvitation; npc?: Npc; definition?: SocialMeetingDefinition; location?: Location }>;
  meetings: Array<{ meeting: SocialMeeting; npc?: Npc; definition?: SocialMeetingDefinition; location?: Location; failure?: string }>;
};

export type PhonePanelState = {
  phone: PhoneState;
  career: CareerResume;
  jobs: PhoneVacancyView[];
  unreadCount: number;
  unreadMessages: number;
  unreadNotifications: number;
  mapTarget?: Location;
  mapRoute?: LocationTravelOption;
  districtTravelOptions: DistrictTravelOption[];
  finance: {
    finance: PersonalFinanceState;
    bankBalance: number;
    totalAssets: number;
    totalDebt: number;
    upcomingPayments: UpcomingPayment[];
  };
  vehicles: VehiclePanelState;
  health: HealthPanelState;
  intercity: IntercityPanelState;
  university: UniversityPanelState;
  social: PhoneSocialState;
};

export type PhoneShellProps = {
  open: boolean;
  activeApp: PhoneAppId;
  selectedJobId?: JobId;
  time: GameTime;
  currentLocation?: Location;
  state: PhonePanelState;
  onClose: () => void;
  onOpen: () => void;
  onOpenApp: (app: PhoneAppId) => void;
  onSelectJob: (jobId?: JobId) => void;
  onSubmitApplication: (jobId: JobId) => void;
  onToggleSavedJob: (jobId: JobId) => void;
  onSetMapTarget: (locationId?: LocationId) => void;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
  onReadNotification: (id: PhoneNotificationId) => void;
  onReadMessage: (id: PhoneMessageId) => void;
  onAttendInterview: (jobId: JobId) => void;
  onScheduleMedicalVisit: (serviceId: MedicalServiceId) => void;
  onAttendMedicalVisit: (serviceId: MedicalServiceId) => void;
  onRequestSickLeave: () => void;
  onTransferFunds: (direction: 'bank_to_cash' | 'cash_to_bank' | 'bank_to_savings' | 'savings_to_bank', amount: number) => void;
  onSetAutoSave: (percent: number) => void;
  onCreateSavingsGoal: (title: string, targetAmount: number) => void;
  onFundSavingsGoal: (goalId: string, amount: number) => void;
  onScheduleVehicleInspection: (listingId: VehicleListingId) => void;
  onInspectVehicle: (listingId: VehicleListingId) => void;
  onBuyUsedVehicle: (listingId: VehicleListingId) => void;
  onBuyNewVehicle: (modelId: VehicleModelId) => void;
  onRefuelVehicle: (liters: number) => void;
  onServiceVehicle: () => void;
  onSellVehicle: () => void;
  onBuyIntercityTicket: (routeId: IntercityRouteId, departureTotalMinutes: number) => void;
  onBoardIntercityTicket: (ticketId: IntercityTicketId) => void;
  onBookTemporaryAccommodation: (accommodationId: TemporaryAccommodationId, nights: number) => void;
  onDriveIntercity: (destinationCityId: CityId) => void;
  onSubmitDegreeApplication: (programId: DegreeProgramId) => void;
  onAttendDegreeEntranceExam: (programId: DegreeProgramId) => void;
  onEnrollDegreeProgram: (programId: DegreeProgramId) => void;
  onAttendDegreeClass: (subjectId: UniversitySubjectId, startsAtTotalMinutes: number) => void;
  onCompleteDegreeAssignment: (assignmentId: string) => void;
  onPerformDegreeCampusActivity: (activityId: UniversityCampusActivityId) => void;
  onTakeDegreeSemesterExam: () => void;
  onSkipTime: (minutes: number) => void;
  onSendSocialMessage: (npcId: NpcId, actionId: SocialMessageActionId) => void;
  onInviteSocialMeeting: (npcId: NpcId, meetingTypeId: SocialMeetingTypeId, locationId: LocationId, slot: SocialMeetingSlot) => void;
  onRespondSocialInvitation: (invitationId: SocialInvitationId, accept: boolean) => void;
  onAttendSocialMeeting: (meetingId: SocialMeetingId) => void;
  onCancelSocialMeeting: (meetingId: SocialMeetingId) => void;
};
