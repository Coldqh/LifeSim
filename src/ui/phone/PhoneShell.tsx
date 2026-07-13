import { useEffect, useMemo, useState } from 'react';
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
import type { DegreeProgramDefinition, UniversityApplication, UniversityAssignment, UniversityClassView, UniversityDefinition, UniversityEnrollment, UniversityState } from '../../types/university';
import type { Npc, NpcRoleDefinition } from '../../types/npc';
import type { NpcRelationship, RelationshipStatus } from '../../types/relationship';
import type { SocialContact, SocialCircleTag, SocialInvitation, SocialMeeting, SocialMeetingDefinition, SocialMeetingSlot, SocialMessageActionId, SocialQuickMessageDefinition } from '../../types/socialLife';
import { VEHICLE_DEFECT_LABELS } from '../../core/vehicles';
import { formatGameTime } from '../../core/time';
import { getRelationshipStatusLabel } from '../../core/relationships';
import { Icon, type IconName } from '../icons';
import './phone.css';

export type PhoneVacancyView = {
  job: Job;
  location?: Location;
  district?: District;
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

type PhoneShellProps = {
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
  onTakeDegreeSemesterExam: () => void;
  onSkipTime: (minutes: number) => void;
  onSendSocialMessage: (npcId: NpcId, actionId: SocialMessageActionId) => void;
  onInviteSocialMeeting: (npcId: NpcId, meetingTypeId: SocialMeetingTypeId, locationId: LocationId, slot: SocialMeetingSlot) => void;
  onRespondSocialInvitation: (invitationId: SocialInvitationId, accept: boolean) => void;
  onAttendSocialMeeting: (meetingId: SocialMeetingId) => void;
  onCancelSocialMeeting: (meetingId: SocialMeetingId) => void;
};

const APPLICATION_LABELS: Record<PhoneJobApplication['status'], string> = {
  submitted: 'На рассмотрении',
  invited: 'Приглашение',
  rejected: 'Отказ',
  accepted: 'Принят',
  missed: 'Пропущено'
};

const APP_META: Array<{ id: PhoneAppId; label: string; icon: IconName; tone: string }> = [
  { id: 'contacts', label: 'Контакты', icon: 'users', tone: 'green' },
  { id: 'jobs', label: 'hh', icon: 'briefcase', tone: 'red' },
  { id: 'education', label: 'Учёба', icon: 'book', tone: 'violet' },
  { id: 'clock', label: 'Время', icon: 'clock', tone: 'cyan' },
  { id: 'maps', label: 'Карты', icon: 'pin', tone: 'blue' },
  { id: 'bank', label: 'Банк', icon: 'wallet', tone: 'cyan' },
  { id: 'auto', label: 'Авто', icon: 'car', tone: 'steel' },
  { id: 'health', label: 'Здоровье', icon: 'heart', tone: 'rose' },
  { id: 'trips', label: 'Поездки', icon: 'bus', tone: 'amber' },
  { id: 'messages', label: 'Сообщения', icon: 'message', tone: 'green' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar', tone: 'violet' },
  { id: 'notifications', label: 'Уведомления', icon: 'bell', tone: 'amber' }
];

function formatRubles(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
}

function formatTotalMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.floor(totalMinutes));
  const day = Math.floor(safe / 1440) + 1;
  const insideDay = safe % 1440;
  const hour = String(Math.floor(insideDay / 60)).padStart(2, '0');
  const minute = String(insideDay % 60).padStart(2, '0');
  return `День ${day} · ${hour}:${minute}`;
}

function getApplicationTone(status?: PhoneJobApplication['status']): string {
  if (status === 'accepted' || status === 'invited') return 'positive';
  if (status === 'rejected' || status === 'missed') return 'negative';
  return 'neutral';
}

function AppBadge({ count }: { count: number }) {
  return count > 0 ? <span className="phone-app-badge">{count > 99 ? '99+' : count}</span> : null;
}

function PhoneHome({ state, onOpenApp }: { state: PhonePanelState; onOpenApp: (app: PhoneAppId) => void }) {
  const counts: Partial<Record<PhoneAppId, number>> = {
    contacts: state.social.invitations.length + state.social.meetings.length,
    messages: state.unreadMessages,
    notifications: state.unreadNotifications,
    calendar: state.phone.calendarEvents.filter((event) => event.status === 'scheduled').length,
    jobs: state.phone.applications.filter((entry) => entry.status === 'invited').length,
    health: state.health.conditions.length,
    trips: state.intercity.tickets.filter((entry) => entry.ticket.status === 'booked').length,
    education: state.university.state.applications.filter((entry) => ['exam_scheduled', 'passed'].includes(entry.status)).length
  };

  return (
    <div className="phone-home-screen phone-screen-enter">
      <section className="phone-home-hero">
        <span>LifeSim Mobile</span>
        <strong>{state.intercity.currentCity?.name ?? 'Город'} в твоём кармане</strong>
        <p>{state.phone.applications.filter((entry) => entry.status === 'submitted').length} откликов рассматриваются</p>
      </section>
      <div className="phone-app-grid">
        {APP_META.map((app) => (
          <button className="phone-app-tile" key={app.id} type="button" onClick={() => onOpenApp(app.id)}>
            <span className={`phone-app-icon phone-app-icon--${app.tone}`}>
              <Icon name={app.icon} size={24} />
              <AppBadge count={counts[app.id] ?? 0} />
            </span>
            <strong>{app.label}</strong>
          </button>
        ))}
      </div>
      <section className="phone-home-widget">
        <div><span>Ближайшее событие</span><strong>{state.phone.calendarEvents.find((event) => event.status === 'scheduled')?.title ?? 'Планов нет'}</strong></div>
        <Icon name="calendar" size={22} />
      </section>
    </div>
  );
}

function JobsApp(props: {
  state: PhonePanelState;
  selectedJobId?: JobId;
  onSelectJob: (jobId?: JobId) => void;
  onSubmit: (jobId: JobId) => void;
  onToggleSaved: (jobId: JobId) => void;
  onRoute: (locationId: LocationId) => void;
  onAttendInterview: (jobId: JobId) => void;
}) {
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const selected = props.state.jobs.find((entry) => entry.job.id === props.selectedJobId);
  const filtered = props.state.jobs.filter((entry) => {
    if (savedOnly && !entry.saved) return false;
    const haystack = `${entry.job.title} ${entry.location?.name ?? ''} ${entry.district?.name ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  if (selected) {
    const application = selected.application;
    return (
      <div className="phone-app-page phone-screen-enter">
        <button className="phone-text-button" type="button" onClick={() => props.onSelectJob(undefined)}>← Все вакансии</button>
        <section className="phone-job-detail">
          <div className="phone-job-detail__brand">hh</div>
          <span className="phone-kicker">{selected.location?.name ?? 'Работодатель'}</span>
          <h2>{selected.job.title}</h2>
          <strong className="phone-job-salary">{formatRubles(selected.estimatedMonthlyIncome)} / месяц</strong>
          <div className="phone-detail-grid">
            <div><span>Смена</span><strong>{selected.job.shiftDurationMinutes / 60} ч · {formatRubles(selected.job.wagePerShift)}</strong></div>
            <div><span>Район</span><strong>{selected.district?.name ?? 'Москва'}</strong></div>
          </div>
          <div className="phone-address-block"><Icon name="pin" size={18}/><div><strong>{selected.location?.name ?? 'Место работы'}</strong><span>{selected.location?.address ?? 'Адрес не указан'}</span></div></div>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Требования</span>{selected.missingSkillRequirements.length === 0 ? <em>Подходишь</em> : <em className="negative">Не хватает навыков</em>}</div>
          {selected.job.requirements?.skills?.length ? (
            <div className="phone-requirements-list">
              {selected.job.requirements.skills.map((requirement) => {
                const missing = selected.missingSkillRequirements.find((entry) => entry.skillId === requirement.skillId);
                return <div key={requirement.skillId}><span>{missing?.name ?? String(requirement.skillId)}</span><strong className={missing ? 'negative' : 'positive'}>{missing?.currentLevel ?? requirement.minLevel}/{requirement.minLevel}</strong></div>;
              })}
            </div>
          ) : <p className="phone-muted">Стартовая вакансия без требований к навыкам.</p>}
        </section>

        {application ? (
          <section className={`phone-application-status phone-application-status--${getApplicationTone(application.status)}`}>
            <span>{APPLICATION_LABELS[application.status]}</span>
            <strong>{application.status === 'submitted' ? 'Работодатель рассматривает отклик' : application.status === 'invited' && application.interviewAtTotalMinutes !== undefined ? formatTotalMinutes(application.interviewAtTotalMinutes) : application.status === 'accepted' ? 'Работа получена' : 'Отклик закрыт'}</strong>
            {application.status === 'invited' ? <button type="button" disabled={Boolean(selected.interviewFailure)} onClick={() => props.onAttendInterview(selected.job.id)}>Пройти собеседование</button> : null}
            {selected.interviewFailure && application.status === 'invited' ? <small>{selected.interviewFailure}</small> : null}
          </section>
        ) : null}

        <div className="phone-sticky-actions">
          <button className="phone-secondary-action" type="button" onClick={() => props.onToggleSaved(selected.job.id)}><Icon name="star" size={17}/>{selected.saved ? 'Сохранено' : 'Сохранить'}</button>
          {selected.location ? <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(selected.location!.id)}><Icon name="pin" size={17}/>Маршрут</button> : null}
          <button className="phone-primary-action" type="button" disabled={Boolean(selected.applicationFailure) || Boolean(application && ['submitted', 'invited', 'accepted'].includes(application.status))} onClick={() => props.onSubmit(selected.job.id)}>Откликнуться</button>
        </div>
        {selected.applicationFailure ? <p className="phone-inline-error">{selected.applicationFailure}</p> : null}
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--jobs"><span>hh</span><div><strong>Работа в Москве</strong><small>{filtered.length} вакансий</small></div></div>
      <label className="phone-search"><Icon name="search" size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Должность, компания, район" /></label>
      <div className="phone-filter-row">
        <button className={!savedOnly ? 'active' : ''} type="button" onClick={() => setSavedOnly(false)}>Все</button>
        <button className={savedOnly ? 'active' : ''} type="button" onClick={() => setSavedOnly(true)}>Сохранённые</button>
      </div>
      <div className="phone-job-list">
        {filtered.map((view) => (
          <button className="phone-job-card" key={view.job.id} type="button" onClick={() => props.onSelectJob(view.job.id)}>
            <div className="phone-job-card__top"><span>{view.location?.name ?? 'Работодатель'}</span>{view.application ? <em className={`status-${getApplicationTone(view.application.status)}`}>{APPLICATION_LABELS[view.application.status]}</em> : null}</div>
            <strong>{view.job.title}</strong>
            <b>{formatRubles(view.estimatedMonthlyIncome)} / месяц</b>
            <small>{view.district?.name ?? 'Москва'} · {view.job.shiftDurationMinutes / 60} ч</small>
            {view.saved ? <i><Icon name="star" size={14}/></i> : null}
          </button>
        ))}
      </div>
    </div>
  );
}


function EducationApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onSubmit: (programId: DegreeProgramId) => void;
  onAttendEntrance: (programId: DegreeProgramId) => void;
  onEnroll: (programId: DegreeProgramId) => void;
  onAttendClass: (subjectId: UniversitySubjectId, startsAtTotalMinutes: number) => void;
  onCompleteAssignment: (assignmentId: string) => void;
  onTakeExam: () => void;
}) {
  const university = props.state.university;
  const enrollment = university.enrollment;

  if (enrollment && university.activeProgram && university.activeUniversity) {
    const subjectRows = university.activeProgram.subjectIds.map((subjectId) => {
      const progress = enrollment.subjectProgress[subjectId];
      const subject = university.classes.find((entry) => entry.subject.id === subjectId)?.subject;
      return { subjectId, title: subject?.title ?? String(subjectId), progress };
    });
    return (
      <div className="phone-app-page phone-screen-enter">
        <div className="phone-app-banner phone-app-banner--education">
          <Icon name="book" size={26}/>
          <div><strong>{university.activeUniversity.shortName}</strong><small>{university.activeProgram.title}</small></div>
        </div>
        <section className="phone-study-overview">
          <div><span>Семестр</span><strong>{enrollment.semester}/{university.activeProgram.durationSemesters}</strong></div>
          <div><span>Нагрузка</span><strong>{Math.round(enrollment.studyLoad)}%</strong></div>
          <div><span>Экзамены</span><strong>{enrollment.examsPassed}</strong></div>
          <div><span>Кампус</span><strong>{university.campusPeople.length} человек</strong></div>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Ближайшие пары</span><em>{university.classes.length}</em></div>
          <div className="phone-study-list">
            {university.classes.length ? university.classes.map((entry) => (
              <article className="phone-study-row" key={entry.sessionKey}>
                <div><strong>{entry.subject.title}</strong><small>{formatTotalMinutes(entry.startsAtTotalMinutes)}</small></div>
                <button type="button" disabled={!entry.canAttend} onClick={() => props.onAttendClass(entry.subject.id, entry.startsAtTotalMinutes)}>Посетить</button>
                {entry.failure ? <small className="phone-inline-error">{entry.failure}</small> : null}
              </article>
            )) : <div className="phone-empty-state">Ближайших пар нет</div>}
          </div>
          <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(university.activeUniversity!.locationId)}><Icon name="pin" size={17}/>Маршрут в кампус</button>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Задания</span><em>{university.assignments.filter((entry) => !entry.completed && !entry.missed).length}</em></div>
          <div className="phone-study-list">
            {university.assignments.length ? university.assignments.map((assignment) => (
              <article className="phone-study-row" key={assignment.id}>
                <div><strong>{assignment.title}</strong><small>Срок: день {assignment.dueDay} · {assignment.completed ? 'сдано' : assignment.missed ? 'просрочено' : `${assignment.durationMinutes} мин`}</small></div>
                {!assignment.completed && !assignment.missed ? <button type="button" onClick={() => props.onCompleteAssignment(assignment.id)}>Выполнить</button> : null}
              </article>
            )) : <div className="phone-empty-state">Заданий пока нет</div>}
          </div>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Успеваемость</span><em>{subjectRows.length} предмета</em></div>
          <div className="phone-requirements-list">
            {subjectRows.map((row) => (
              <div key={String(row.subjectId)}><span>{row.title}</span><strong>{row.progress?.knowledge ?? 0}% · {row.progress?.classesAttended ?? 0} пар</strong></div>
            ))}
          </div>
          <button className="phone-primary-action" type="button" onClick={props.onTakeExam}>Сдать семестровый экзамен</button>
        </section>
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--education"><Icon name="book" size={26}/><div><strong>Образование</strong><small>Реальные университеты Москвы и Ярославля</small></div></div>
      <div className="phone-university-list">
        {university.programs.map((view) => {
          const status = view.application?.status;
          return (
            <article className="phone-university-card" key={view.program.id}>
              <span>{view.university?.shortName ?? 'Университет'}</span>
              <h3>{view.program.title}</h3>
              <p>{view.university?.address}</p>
              <div className="phone-detail-grid">
                <div><span>Семестр</span><strong>{formatRubles(view.program.tuitionPerSemester)}</strong></div>
                <div><span>Срок</span><strong>{view.program.durationSemesters} семестров</strong></div>
              </div>
              <div className="phone-tag-row">{view.program.careerTags.map((tag) => <em key={tag}>{tag}</em>)}</div>
              {view.missingSkillRequirements.length ? <small className="phone-inline-error">Не хватает: {view.missingSkillRequirements.map((entry) => `${entry.name} ${entry.currentLevel}/${entry.minLevel}`).join(', ')}</small> : null}
              {status ? <div className={`phone-application-status phone-application-status--${status === 'passed' || status === 'enrolled' ? 'positive' : status === 'failed' ? 'negative' : 'neutral'}`}><span>{status === 'exam_scheduled' ? 'Испытание назначено' : status === 'passed' ? 'Испытание сдано' : status === 'failed' ? 'Не сдано' : status === 'enrolled' ? 'Зачислен' : 'Заявка'}</span>{view.application?.score !== undefined ? <strong>{view.application.score} баллов</strong> : null}</div> : null}
              <div className="phone-sticky-actions phone-sticky-actions--inline">
                {view.university ? <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(view.university!.locationId)}><Icon name="pin" size={16}/>Маршрут</button> : null}
                {(!status || status === 'failed') ? <button className="phone-primary-action" type="button" disabled={!view.canApply} onClick={() => props.onSubmit(view.program.id)}>{status === 'failed' ? 'Подать повторно' : 'Подать заявление'}</button> : null}
                {status === 'exam_scheduled' ? <button className="phone-primary-action" type="button" disabled={Boolean(view.examFailure)} onClick={() => props.onAttendEntrance(view.program.id)}>Сдать испытание</button> : null}
                {status === 'passed' ? <button className="phone-primary-action" type="button" disabled={!view.canEnroll} onClick={() => props.onEnroll(view.program.id)}>Зачислиться</button> : null}
              </div>
              {status === 'exam_scheduled' && view.examFailure ? <small className="phone-inline-error">{view.examFailure}</small> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ClockApp({ onSkip }: { onSkip: (minutes: number) => void }) {
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const total = Math.max(0, hours) * 60 + Math.max(0, minutes);
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--clock"><Icon name="clock" size={26}/><div><strong>Время</strong><small>Ожидание и свободное время</small></div></div>
      <section className="phone-time-card">
        <span>Перемотать</span>
        <div className="phone-time-inputs">
          <label><input type="number" min="0" max="24" value={hours} onChange={(event) => setHours(Math.max(0, Math.min(24, Number(event.target.value))))}/><small>часов</small></label>
          <label><input type="number" min="0" max="59" value={minutes} onChange={(event) => setMinutes(Math.max(0, Math.min(59, Number(event.target.value))))}/><small>минут</small></label>
        </div>
        <div className="phone-time-presets">
          {[30, 60, 180, 360].map((value) => <button key={value} type="button" onClick={() => onSkip(value)}>{value < 60 ? `${value} мин` : `${value / 60} ч`}</button>)}
        </div>
        <button className="phone-primary-action" disabled={total < 1 || total > 1440} type="button" onClick={() => onSkip(total)}>Подождать</button>
        <p className="phone-muted">Потребности, расписания, NPC, бизнес, здоровье и учёба продолжают обновляться.</p>
      </section>
    </div>
  );
}

function MapsApp(props: {
  state: PhonePanelState;
  currentLocation?: Location;
  onClear: () => void;
  onMove: (locationId: LocationId, modeId: TravelModeId) => void;
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
}) {
  const [selectedDistrictId, setSelectedDistrictId] = useState<DistrictId>();
  const target = props.state.mapTarget;
  const route = props.state.mapRoute;
  const districtRoute = props.state.districtTravelOptions.find((entry) => entry.district.id === selectedDistrictId);
  const currentDistrictSlug = String(props.currentLocation?.districtId ?? '').replace('msk_', '').replace('yar_', '');
  const isYaroslavl = String(props.currentLocation?.cityId ?? '') === 'yaroslavl';
  const cityName = isYaroslavl ? 'Ярославль' : 'Москва';
  const selectedTitle = target?.name ?? districtRoute?.district.name ?? cityName;
  const selectedAddress = target?.address ?? (districtRoute ? `Переезд в район: ${districtRoute.district.name}` : `Сейчас: ${props.currentLocation?.name ?? cityName}`);

  function selectDistrict(id: DistrictId): void {
    setSelectedDistrictId(id);
    props.onClear();
  }

  return (
    <div className="phone-app-page phone-screen-enter phone-maps-app">
      {isYaroslavl ? (
        <div className="yaroslavl-map" role="img" aria-label="Карта Ярославля с районами">
          <svg viewBox="0 0 420 360" aria-hidden="true">
            <defs><linearGradient id="yarMapBg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#253f4d"/><stop offset="1" stopColor="#0b1821"/></linearGradient></defs>
            <path className="yaroslavl-map__outline" d="M55 42C127 10 284 15 354 67c54 40 61 140 22 207-40 68-168 83-255 58C41 309 11 227 28 139 37 94 49 58 55 42Z" fill="url(#yarMapBg)"/>
            <path className="yaroslavl-map__river" d="M18 98c75 29 107 52 139 98 30 44 74 82 127 91 48 8 88-4 132-32"/>
            <g className="yaroslavl-map__districts">
              <path className={`${selectedDistrictId === ('yar_kirovsky' as DistrictId) ? 'is-selected ' : ''}${currentDistrictSlug === 'kirovsky' ? 'is-current' : ''}`} d="M116 52 248 48 285 130 230 190 137 164 82 105Z" onClick={() => selectDistrict('yar_kirovsky' as DistrictId)}/>
              <path className={`${selectedDistrictId === ('yar_leninsky' as DistrictId) ? 'is-selected ' : ''}${currentDistrictSlug === 'leninsky' ? 'is-current' : ''}`} d="M68 112 137 164 230 190 202 300 94 313 38 230Z" onClick={() => selectDistrict('yar_leninsky' as DistrictId)}/>
              <path className={`${selectedDistrictId === ('yar_frunzensky' as DistrictId) ? 'is-selected ' : ''}${currentDistrictSlug === 'frunzensky' ? 'is-current' : ''}`} d="M285 130 374 98 397 225 326 314 202 300 230 190Z" onClick={() => selectDistrict('yar_frunzensky' as DistrictId)}/>
            </g>
            <text x="137" y="108">Кировский</text><text x="86" y="245">Ленинский</text><text x="280" y="232">Фрунзенский</text>
          </svg>
          <span className="yaroslavl-map__caption">Схема районов Ярославля</span>
        </div>
      ) : (
        <div className="moscow-map" role="img" aria-label="Карта Москвы с районами">
          <svg viewBox="0 0 420 360" aria-hidden="true">
            <defs>
              <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1a3441"/><stop offset="1" stopColor="#0a1720"/></linearGradient>
              <filter id="mapGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path className="moscow-map__mkad" d="M57 62C111 8 302 7 365 69c51 51 48 171 3 225-54 65-232 72-306 9C4 253 8 111 57 62Z" fill="url(#mapBg)"/>
            <path className="moscow-map__river" d="M4 202c64-30 90-5 128-20 41-17 54-70 102-69 39 1 53 39 91 45 37 6 64-15 95-44"/>
            <path className="moscow-map__road" d="M80 80 340 287M342 75 82 292M205 28v310M40 178h345"/>
            <circle className="moscow-map__ring" cx="212" cy="176" r="82"/>
            <g className="moscow-map__districts">
              <path data-id="msk_presnya" d="M104 94 188 78 201 142 165 184 94 159Z"/>
              <path data-id="msk_tverskoy" d="M190 70 264 83 280 147 218 166 201 142Z"/>
              <path data-id="msk_khamovniki" d="M109 171 166 184 216 168 224 236 151 260 92 225Z"/>
              <path data-id="msk_danilovsky" d="M218 168 282 151 321 213 284 276 224 236Z"/>
            </g>
            <text x="119" y="125">Пресня</text><text x="218" y="113">Тверской</text><text x="119" y="221">Хамовники</text><text x="248" y="222">Даниловский</text>
          </svg>
          <div className="moscow-map__hitboxes">
            {props.state.districtTravelOptions.map((option) => {
              const slug = String(option.district.id).replace('msk_', '');
              return <button className={`map-hitbox map-hitbox--${slug} ${selectedDistrictId === option.district.id ? 'is-active' : ''}`} key={option.district.id} type="button" aria-label={option.district.name} onClick={() => selectDistrict(option.district.id)}/>;
            })}
          </div>
          <span className={`moscow-map__current moscow-map__current--${currentDistrictSlug}`}><i/>Ты здесь</span>
        </div>
      )}
      <section className="phone-map-sheet">
        <span className="phone-kicker">Маршрут</span>
        <h2>{selectedTitle}</h2>
        <p>{selectedAddress}</p>
        {route?.transportOptions.length ? (
          <div className="phone-route-options">
            {route.transportOptions.map((option) => (
              <button disabled={!option.available} key={option.modeId} type="button" onClick={() => target && props.onMove(target.id, option.modeId)}>
                <Icon name={option.modeId} size={19}/><div><strong>{option.name}</strong><span>{option.durationMinutes} мин · {option.moneyCost ? formatRubles(option.moneyCost) : 'Бесплатно'}</span></div>
              </button>
            ))}
          </div>
        ) : districtRoute ? (
          <div className="phone-route-options">
            {districtRoute.transportOptions.map((option) => (
              <button disabled={!option.available || districtRoute.isCurrent} key={option.modeId} type="button" onClick={() => props.onMoveDistrict(districtRoute.district.id, option.modeId)}>
                <Icon name={option.modeId} size={19}/><div><strong>{option.name}</strong><span>{districtRoute.isCurrent ? 'Ты уже в этом районе' : `${option.durationMinutes} мин · ${option.moneyCost ? formatRubles(option.moneyCost) : 'Бесплатно'}`}</span></div>
              </button>
            ))}
          </div>
        ) : <p className="phone-muted">Нажми на цветной район или открой маршрут из вакансии.</p>}
        {target || selectedDistrictId ? <button className="phone-text-button" type="button" onClick={() => { props.onClear(); setSelectedDistrictId(undefined); }}>Сбросить маршрут</button> : null}
      </section>
    </div>
  );
}

function BankApp(props: {
  state: PhonePanelState;
  onTransfer: PhoneShellProps['onTransferFunds'];
  onSetAutoSave: PhoneShellProps['onSetAutoSave'];
  onCreateGoal: PhoneShellProps['onCreateSavingsGoal'];
  onFundGoal: PhoneShellProps['onFundSavingsGoal'];
}) {
  const [amount, setAmount] = useState(1000);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(50000);
  const finance = props.state.finance;
  return (
    <div className="phone-app-page phone-screen-enter phone-bank-app">
      <div className="phone-bank-card"><span>LifeBank · дебетовая</span><strong>{formatRubles(finance.bankBalance)}</strong><small>Доступно на счёте</small><i>•• 1842</i></div>
      <div className="phone-balance-grid">
        <div><span>Наличные</span><strong>{formatRubles(finance.finance.cash)}</strong></div>
        <div><span>Накопления</span><strong>{formatRubles(finance.finance.savings)}</strong></div>
        <div><span>Начислено</span><strong>{formatRubles(finance.finance.pendingSalary)}</strong></div>
        <div><span>Долги</span><strong className={finance.totalDebt > 0 ? 'negative' : ''}>{formatRubles(finance.totalDebt)}</strong></div>
      </div>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Переводы</span><em>{formatRubles(amount)}</em></div>
        <input className="phone-money-input" type="number" min="100" step="100" value={amount} onChange={(event) => setAmount(Number(event.target.value) || 100)}/>
        <div className="phone-transfer-grid">
          <button type="button" onClick={() => props.onTransfer('bank_to_cash', amount)}>Снять</button>
          <button type="button" onClick={() => props.onTransfer('cash_to_bank', amount)}>Внести</button>
          <button type="button" onClick={() => props.onTransfer('bank_to_savings', amount)}>В накопления</button>
          <button type="button" onClick={() => props.onTransfer('savings_to_bank', amount)}>Из накоплений</button>
        </div>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Автосбережение с зарплаты</span><em>{finance.finance.autoSavePercent}%</em></div>
        <div className="phone-autosave-row">{[0,5,10,20,30].map((value) => <button className={finance.finance.autoSavePercent === value ? 'active' : ''} key={value} type="button" onClick={() => props.onSetAutoSave(value)}>{value}%</button>)}</div>
        <p className="phone-muted">Следующая выплата: день {finance.finance.nextSalaryPayoutDay}</p>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Цели</span><em>{finance.finance.goals.length}/5</em></div>
        <div className="phone-goal-create"><input placeholder="Например, новая квартира" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)}/><input type="number" min="1000" step="1000" value={goalTarget} onChange={(event) => setGoalTarget(Number(event.target.value) || 1000)}/><button type="button" onClick={() => { props.onCreateGoal(goalTitle, goalTarget); setGoalTitle(''); }}>Создать</button></div>
        <div className="phone-goal-list">{finance.finance.goals.map((goal) => { const percent = Math.min(100, Math.round(goal.currentAmount / goal.targetAmount * 100)); return <article key={goal.id}><div><strong>{goal.title}</strong><span>{formatRubles(goal.currentAmount)} / {formatRubles(goal.targetAmount)}</span></div><i><b style={{width:`${percent}%`}}/></i><button type="button" onClick={() => props.onFundGoal(goal.id, amount)}>+ {formatRubles(amount)}</button></article>; })}</div>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Ближайшие платежи</span><em>{finance.upcomingPayments.length}</em></div>
        <div className="phone-payment-list">{finance.upcomingPayments.map((payment) => <div key={payment.id}><span><strong>{payment.title}</strong><small>День {payment.dueDay}</small></span><b>-{formatRubles(payment.amount)}</b></div>)}</div>
      </section>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>История</span><em>{finance.finance.transactions.length}</em></div>
        <div className="phone-transaction-list">{finance.finance.transactions.length ? finance.finance.transactions.slice(0,20).map((transaction) => <div key={transaction.id}><span><strong>{transaction.title}</strong><small>{formatTotalMinutes(transaction.totalMinutes)}</small></span><b className={transaction.amount >= 0 ? 'positive' : 'negative'}>{transaction.amount >= 0 ? '+' : ''}{formatRubles(transaction.amount)}</b></div>) : <p className="phone-muted">Операций пока нет.</p>}</div>
      </section>
    </div>
  );
}


function VehiclesApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onScheduleInspection: (listingId: VehicleListingId) => void;
  onInspect: (listingId: VehicleListingId) => void;
  onBuyUsed: (listingId: VehicleListingId) => void;
  onBuyNew: (modelId: VehicleModelId) => void;
  onRefuel: (liters: number) => void;
  onService: () => void;
  onSell: () => void;
}) {
  const [tab, setTab] = useState<'used' | 'new' | 'mine'>('used');
  const [selectedListingId, setSelectedListingId] = useState<VehicleListingId>();
  const selected = props.state.vehicles.listings.find((entry) => entry.listing.id === selectedListingId);
  const vehicle = props.state.vehicles.ownedVehicle;
  const ownedModel = props.state.vehicles.ownedModel;

  if (selected) {
    return (
      <div className="phone-app-page phone-screen-enter vehicle-app-page">
        <button className="phone-text-button" type="button" onClick={() => setSelectedListingId(undefined)}>← Все объявления</button>
        <section className="vehicle-detail-card">
          <div className="vehicle-detail-card__hero">
            <span className="vehicle-brand-mark">{selected.model.brand.slice(0, 1)}</span>
            <div><span>{selected.listing.year} · {selected.model.bodyType}</span><h2>{selected.model.brand} {selected.model.model}</h2><strong>{formatRubles(selected.listing.price)}</strong></div>
          </div>
          <div className="vehicle-metric-grid">
            <div><span>Пробег</span><strong>{new Intl.NumberFormat('ru-RU').format(selected.listing.mileageKm)} км</strong></div>
            <div><span>Состояние</span><strong>{selected.listing.conditionPercent}%</strong></div>
            <div><span>Мощность</span><strong>{selected.model.powerHp} л.с.</strong></div>
            <div><span>Расход</span><strong>{selected.model.consumptionLitersPer100Km} л/100 км</strong></div>
          </div>
          <div className="phone-address-block"><Icon name="pin" size={18}/><div><strong>{selected.listing.sellerName}</strong><span>{selected.listing.sellerLocationId === props.state.vehicles.currentLocation?.id ? 'Ты уже на месте' : 'Нужно приехать на осмотр'}</span></div></div>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Диагностика</span><em>{selected.inspected ? 'Проверено' : 'Не проверено'}</em></div>
          {selected.inspected ? (
            selected.revealedDefects.length ? <div className="vehicle-defect-list">{selected.revealedDefects.map((defect) => <div key={defect}><Icon name="wrench" size={16}/><span>{VEHICLE_DEFECT_LABELS[defect]}</span></div>)}</div> : <p className="phone-muted">Серьёзных проблем не обнаружено.</p>
          ) : <p className="phone-muted">Скрытые дефекты станут известны после личного осмотра.</p>}
        </section>
        <div className="phone-sticky-actions vehicle-sticky-actions">
          <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(selected.listing.sellerLocationId)}><Icon name="pin" size={17}/>Маршрут</button>
          {!selected.inspected ? <button className="phone-secondary-action" type="button" onClick={() => props.onScheduleInspection(selected.listing.id)}>{selected.scheduled ? 'Осмотр назначен' : 'Назначить осмотр'}</button> : null}
          {!selected.inspected ? <button className="phone-primary-action" type="button" disabled={!selected.isAtSeller} onClick={() => props.onInspect(selected.listing.id)}>Осмотреть</button> : <button className="phone-primary-action" type="button" disabled={!selected.isAtSeller || Boolean(vehicle)} onClick={() => props.onBuyUsed(selected.listing.id)}>Купить</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter vehicle-app-page">
      <div className="phone-app-banner phone-app-banner--auto"><Icon name="car" size={27}/><div><strong>Авто</strong><small>Объявления, дилеры и твоя машина</small></div></div>
      <div className="phone-filter-row vehicle-filter-row">
        <button className={tab === 'used' ? 'active' : ''} type="button" onClick={() => setTab('used')}>С пробегом</button>
        <button className={tab === 'new' ? 'active' : ''} type="button" onClick={() => setTab('new')}>Новые</button>
        <button className={tab === 'mine' ? 'active' : ''} type="button" onClick={() => setTab('mine')}>Моя машина</button>
      </div>

      {tab === 'used' ? (
        <div className="vehicle-list">
          <div className="vehicle-market-brand"><b>Авто.ру</b><span>{props.state.vehicles.listings.length} объявлений</span></div>
          {props.state.vehicles.listings.map((entry) => (
            <button className="vehicle-listing-card" key={entry.listing.id} type="button" onClick={() => setSelectedListingId(entry.listing.id)}>
              <span className="vehicle-listing-card__badge">{entry.model.tier}</span>
              <div className="vehicle-listing-card__mark">{entry.model.brand.slice(0, 1)}</div>
              <div><strong>{entry.model.brand} {entry.model.model}</strong><b>{formatRubles(entry.listing.price)}</b><small>{entry.listing.year} · {new Intl.NumberFormat('ru-RU').format(entry.listing.mileageKm)} км · {entry.listing.conditionPercent}%</small></div>
              {entry.inspected ? <em>Проверено</em> : null}
            </button>
          ))}
        </div>
      ) : null}

      {tab === 'new' ? (
        <div className="vehicle-list">
          <div className="vehicle-market-brand"><b>Дилерские центры</b><span>Новые автомобили</span></div>
          {props.state.vehicles.dealerModels.map((entry) => (
            <article className="vehicle-dealer-card" key={entry.model.id}>
              <div className="vehicle-dealer-card__top"><span className="vehicle-listing-card__mark">{entry.model.brand.slice(0, 1)}</span><div><span>{entry.model.tier}</span><h3>{entry.model.brand} {entry.model.model}</h3></div></div>
              <strong>{formatRubles(entry.model.newPrice)}</strong>
              <div className="vehicle-dealer-specs"><span>{entry.model.powerHp} л.с.</span><span>{entry.model.consumptionLitersPer100Km} л/100 км</span><span>ТО {formatRubles(entry.model.baseServiceCost)}</span></div>
              <small>{entry.dealerLocation?.name}<br/>{entry.dealerLocation?.address}</small>
              <div className="phone-inline-actions"><button type="button" onClick={() => props.onRoute(entry.dealerLocationId)}>Маршрут</button><button type="button" disabled={!entry.isAtDealer || !entry.canAfford || Boolean(vehicle)} onClick={() => props.onBuyNew(entry.model.id)}>Купить в салоне</button></div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'mine' ? (
        vehicle && ownedModel ? (
          <div className="owned-vehicle-panel">
            <section className="owned-vehicle-hero">
              <span>{vehicle.year}</span><h2>{ownedModel.brand} {ownedModel.model}</h2><p>{vehicle.source === 'dealer' ? 'Куплен новым' : 'Куплен с пробегом'}</p>
            </section>
            <div className="vehicle-metric-grid">
              <div><span>Топливо</span><strong>{vehicle.fuelLiters.toFixed(1)} / {ownedModel.fuelTankLiters} л</strong></div>
              <div><span>Пробег</span><strong>{Math.round(vehicle.odometerKm).toLocaleString('ru-RU')} км</strong></div>
              <div><span>Состояние</span><strong>{vehicle.conditionPercent}%</strong></div>
              <div><span>Надёжность</span><strong>{vehicle.reliabilityPercent}%</strong></div>
            </div>
            <section className="phone-subsection">
              <div className="phone-section-title"><span>Где машина</span><em>{props.state.vehicles.parkedLocation?.name ?? 'Неизвестно'}</em></div>
              <p className="phone-muted">Следующее ТО: {Math.max(0, Math.round(vehicle.nextServiceOdometerKm - vehicle.odometerKm)).toLocaleString('ru-RU')} км.</p>
              {vehicle.knownDefectIds.length ? <div className="vehicle-defect-list">{vehicle.knownDefectIds.map((defect) => <div key={defect}><Icon name="wrench" size={16}/><span>{VEHICLE_DEFECT_LABELS[defect]}</span></div>)}</div> : null}
            </section>
            <div className="vehicle-owner-actions">
              {props.state.vehicles.parkedLocation && props.state.vehicles.parkedLocation.id !== props.state.vehicles.currentLocation?.id ? <button type="button" onClick={() => props.onRoute(props.state.vehicles.parkedLocation!.id)}><Icon name="pin" size={17}/>Добраться до машины</button> : null}
              <button type="button" disabled={!props.state.vehicles.atGasStation || vehicle.parkedLocationId !== props.state.vehicles.currentLocation?.id} onClick={() => props.onRefuel(10)}><Icon name="fuel" size={17}/>Заправить 10 л</button>
              <button type="button" disabled={!props.state.vehicles.atGasStation || vehicle.parkedLocationId !== props.state.vehicles.currentLocation?.id} onClick={() => props.onRefuel(0)}><Icon name="fuel" size={17}/>Полный бак</button>
              <button type="button" disabled={!props.state.vehicles.atService || vehicle.parkedLocationId !== props.state.vehicles.currentLocation?.id} onClick={props.onService}><Icon name="wrench" size={17}/>Пройти ТО</button>
              <button className="vehicle-sell-button" type="button" onClick={props.onSell}>Продать через Авто.ру</button>
            </div>
          </div>
        ) : <div className="phone-empty-state vehicle-empty-state"><Icon name="car" size={34}/><strong>Машины пока нет</strong><span>Выбери подержанный автомобиль или приезжай в дилерский центр.</span></div>
      ) : null}
    </div>
  );
}

function HealthApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onSchedule: (serviceId: MedicalServiceId) => void;
  onAttend: (serviceId: MedicalServiceId) => void;
  onSickLeave: () => void;
}) {
  const activeConditions = props.state.health.conditions;
  const diagnosedCount = activeConditions.filter((entry) => entry.condition.diagnosed).length;
  const severeCount = activeConditions.filter((entry) => entry.condition.severity === 'severe').length;
  const severityLabel = severeCount > 0 ? 'Нужен врач' : activeConditions.length > 0 ? 'Есть симптомы' : 'Состояние стабильное';

  return (
    <div className="phone-app-page phone-screen-enter phone-health-app">
      <div className="phone-app-banner phone-app-banner--health">
        <Icon name="heart" size={25}/>
        <div><strong>Здоровье</strong><small>{severityLabel}</small></div>
      </div>

      <section className="phone-health-summary">
        <div><span>Активные состояния</span><strong>{activeConditions.length}</strong></div>
        <div><span>Подтверждено врачом</span><strong>{diagnosedCount}</strong></div>
        <div><span>Назначения</span><strong>{props.state.health.prescriptions.filter((entry) => entry.prescription.active).length}</strong></div>
      </section>

      {props.state.health.sickLeave?.active ? (
        <section className="phone-health-sick-leave">
          <Icon name="calendar" size={19}/>
          <div><span>Больничный открыт</span><strong>До дня {props.state.health.sickLeave.endsAtDay}</strong></div>
        </section>
      ) : null}

      <section className="phone-subsection">
        <div className="phone-section-title"><span>Симптомы и состояния</span><em>{activeConditions.length}</em></div>
        {activeConditions.length ? (
          <div className="phone-health-condition-list">
            {activeConditions.map(({ condition, definition }) => (
              <article className={`phone-health-condition phone-health-condition--${condition.severity}`} key={condition.id}>
                <div>
                  <span>{condition.diagnosed ? 'Диагноз подтверждён' : 'По симптомам'}</span>
                  <h3>{condition.diagnosed ? definition?.name ?? condition.id : (definition?.symptoms.slice(0, 2).join(', ') || 'Недомогание')}</h3>
                  <p>{definition?.symptoms.join(' · ')}</p>
                </div>
                <strong>{Math.max(1, Math.ceil(condition.recoveryHoursRemaining / 24))} дн.</strong>
              </article>
            ))}
          </div>
        ) : <div className="phone-empty-state">Активных состояний нет</div>}
      </section>

      <section className="phone-subsection">
        <div className="phone-section-title"><span>Запись в клинику</span><em>МЕДСИ</em></div>
        <div className="phone-health-service-list">
          {props.state.health.services.map(({ service, clinic, appointment, scheduleStatus, attendFailure }) => (
            <article className="phone-health-service" key={service.id}>
              <div className="phone-health-service__top">
                <div><span>{service.specialty === 'therapist' ? 'Терапия' : service.specialty === 'traumatologist' ? 'Травматология' : service.specialty === 'sports_doctor' ? 'Спортивная медицина' : 'Диагностика'}</span><h3>{service.name}</h3></div>
                <strong>{formatRubles(service.price)}</strong>
              </div>
              <p>{clinic?.name}<br/>{clinic?.address}</p>
              <small>{scheduleStatus.label} · {service.durationMinutes} мин.</small>
              {appointment ? <div className="phone-health-appointment"><span>Запись</span><strong>{formatTotalMinutes(appointment.startsAtTotalMinutes)}</strong></div> : null}
              <div className="phone-inline-actions">
                {clinic ? <button type="button" onClick={() => props.onRoute(clinic.id)}>Маршрут</button> : null}
                {!appointment ? <button type="button" onClick={() => props.onSchedule(service.id)}>Записаться</button> : null}
                {appointment ? <button type="button" disabled={Boolean(attendFailure)} onClick={() => props.onAttend(service.id)}>Пройти приём</button> : null}
              </div>
              {appointment && attendFailure ? <small className="phone-inline-error">{attendFailure}</small> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="phone-subsection">
        <div className="phone-section-title"><span>Назначения</span><em>{props.state.health.prescriptions.filter((entry) => entry.prescription.active).length}</em></div>
        {props.state.health.prescriptions.filter((entry) => entry.prescription.active).length ? (
          <div className="phone-health-prescriptions">
            {props.state.health.prescriptions.filter((entry) => entry.prescription.active).map(({ prescription, product, conditionName }) => (
              <div key={prescription.id}><span>{conditionName}</span><strong>{product?.name ?? 'Назначенное средство'}</strong><small>{prescription.completedUses}/{prescription.recommendedUses} применений</small></div>
            ))}
          </div>
        ) : <p className="phone-muted">Назначений пока нет. Лекарства из аптеки работают только для подходящих состояний.</p>}
      </section>

      <button className="phone-primary-action phone-health-leave-button" type="button" disabled={!activeConditions.some((entry) => entry.condition.diagnosed && entry.condition.severity !== 'mild') || Boolean(props.state.health.sickLeave?.active)} onClick={props.onSickLeave}>
        Оформить больничный
      </button>
    </div>
  );
}

const SOCIAL_CIRCLE_LABELS: Record<SocialCircleTag, string> = {
  work: 'Работа',
  university: 'Учёба',
  boxing: 'Бокс',
  neighborhood: 'Район',
  business: 'Бизнес',
  friends: 'Друзья'
};

const ROMANCE_LABELS: Record<NpcRelationship['romanceStatus'], string> = {
  none: 'Нет романтической линии',
  interest: 'Есть взаимная симпатия',
  dating: 'Вы встречаетесь',
  partner: 'Пара'
};

function ContactsApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onSendMessage: (npcId: NpcId, actionId: SocialMessageActionId) => void;
  onInvite: (npcId: NpcId, meetingTypeId: SocialMeetingTypeId, locationId: LocationId, slot: SocialMeetingSlot) => void;
  onRespond: (invitationId: SocialInvitationId, accept: boolean) => void;
  onAttend: (meetingId: SocialMeetingId) => void;
  onCancel: (meetingId: SocialMeetingId) => void;
}) {
  const [selectedNpcId, setSelectedNpcId] = useState<NpcId>();
  const [filter, setFilter] = useState<'all' | SocialCircleTag>('all');
  const [meetingTypeId, setMeetingTypeId] = useState<SocialMeetingTypeId>();
  const [meetingLocationId, setMeetingLocationId] = useState<LocationId>();
  const [slot, setSlot] = useState<SocialMeetingSlot>('tomorrow_evening');
  const selected = props.state.social.contacts.find((entry) => entry.npc.id === selectedNpcId);
  const filtered = props.state.social.contacts.filter((entry) => filter === 'all' || entry.circles.includes(filter));
  const selectedMeetingOption = props.state.social.meetingOptions.find((entry) => entry.definition.id === meetingTypeId)
    ?? props.state.social.meetingOptions[0];
  const selectedMeetingLocation = selectedMeetingOption?.locations.find((entry) => entry.id === meetingLocationId)
    ?? selectedMeetingOption?.locations[0];

  if (selected) {
    const fullName = `${selected.npc.firstName} ${selected.npc.lastName}`;
    return (
      <div className="phone-app-page phone-screen-enter phone-contacts-app">
        <button className="phone-text-button" type="button" onClick={() => setSelectedNpcId(undefined)}>← Все контакты</button>
        <section className="phone-contact-profile">
          <span className="phone-contact-profile__avatar">{selected.npc.firstName[0]}{selected.npc.lastName[0]}</span>
          <div>
            <span className="phone-kicker">{selected.role?.name ?? 'Житель города'}</span>
            <h2>{fullName}</h2>
            <p>{selected.npc.age} лет · {getRelationshipStatusLabel(selected.status)}</p>
          </div>
        </section>

        <div className="phone-contact-metrics">
          <div><span>Отношение</span><strong>{selected.relationship.affinity}</strong></div>
          <div><span>Доверие</span><strong>{selected.relationship.trust}</strong></div>
          <div><span>Симпатия</span><strong>{selected.relationship.romance}</strong></div>
        </div>
        <div className="phone-contact-romance"><Icon name="heart" size={16}/><span>{ROMANCE_LABELS[selected.relationship.romanceStatus]}</span></div>
        <div className="phone-contact-circles">{selected.circles.length ? selected.circles.map((circle) => <span key={circle}>{SOCIAL_CIRCLE_LABELS[circle]}</span>) : <span>Личный контакт</span>}</div>

        {selected.scheduledMeeting ? (
          <section className="phone-social-active-card">
            <span>Запланирована встреча</span>
            <strong>{formatTotalMinutes(selected.scheduledMeeting.startsAtTotalMinutes)}</strong>
            <div className="phone-inline-actions">
              <button type="button" onClick={() => props.onRoute(selected.scheduledMeeting!.locationId)}>Маршрут</button>
              <button type="button" onClick={() => props.onAttend(selected.scheduledMeeting!.id)}>Встретиться</button>
              <button type="button" onClick={() => props.onCancel(selected.scheduledMeeting!.id)}>Отменить</button>
            </div>
          </section>
        ) : null}

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Написать</span><em>5 минут</em></div>
          <div className="phone-social-quick-grid">
            {selected.quickMessages.map(({ definition, failure }) => (
              <button disabled={Boolean(failure)} title={failure} key={definition.id} type="button" onClick={() => props.onSendMessage(selected.npc.id, definition.id)}>
                <Icon name="message" size={16}/><span>{definition.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Предложить встречу</span><em>{selected.pendingInvitation ? 'Ответ ожидается' : 'Планировщик'}</em></div>
          <label className="phone-field-label">Формат
            <select value={String(selectedMeetingOption?.definition.id ?? '')} onChange={(event) => { const value = event.target.value as SocialMeetingTypeId; setMeetingTypeId(value); setMeetingLocationId(undefined); }}>
              {props.state.social.meetingOptions.map((entry) => <option key={entry.definition.id} value={entry.definition.id}>{entry.definition.shortTitle} · {formatRubles(entry.definition.moneyCost)}</option>)}
            </select>
          </label>
          <label className="phone-field-label">Место
            <select value={String(selectedMeetingLocation?.id ?? '')} onChange={(event) => setMeetingLocationId(event.target.value as LocationId)}>
              {(selectedMeetingOption?.locations ?? []).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label className="phone-field-label">Когда
            <select value={slot} onChange={(event) => setSlot(event.target.value as SocialMeetingSlot)}>
              <option value="today_evening">Ближайший вечер</option>
              <option value="tomorrow_day">Завтра днём</option>
              <option value="tomorrow_evening">Завтра вечером</option>
            </select>
          </label>
          <button className="phone-primary-action" type="button" disabled={Boolean(selected.pendingInvitation || selected.scheduledMeeting || !selectedMeetingOption || !selectedMeetingLocation)} onClick={() => {
            if (selectedMeetingOption && selectedMeetingLocation) props.onInvite(selected.npc.id, selectedMeetingOption.definition.id, selectedMeetingLocation.id, slot);
          }}>Отправить приглашение</button>
          {selectedMeetingOption ? <p className="phone-muted">{selectedMeetingOption.definition.description} · {selectedMeetingOption.definition.durationMinutes} мин</p> : null}
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Переписка</span><em>{selected.messages.length}</em></div>
          <div className="phone-contact-chat">
            {selected.messages.length ? [...selected.messages].reverse().map((message) => (
              <div className={message.senderName === 'Ты' ? 'is-outgoing' : ''} key={message.id}>
                <strong>{message.senderName}</strong><p>{message.body}</p><small>{formatTotalMinutes(message.createdAtTotalMinutes)}</small>
              </div>
            )) : <p className="phone-muted">Переписка ещё не началась.</p>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter phone-contacts-app">
      <div className="phone-app-banner phone-app-banner--contacts"><Icon name="users" size={25}/><div><strong>Контакты</strong><small>{props.state.social.contacts.length} человек</small></div></div>

      {props.state.social.invitations.length ? (
        <section className="phone-subsection phone-social-invitations">
          <div className="phone-section-title"><span>Приглашения</span><em>{props.state.social.invitations.length}</em></div>
          {props.state.social.invitations.map(({ invitation, npc, definition, location }) => (
            <article key={invitation.id}>
              <span>{definition?.shortTitle ?? 'Встреча'}</span>
              <strong>{npc ? `${npc.firstName} ${npc.lastName}` : 'Контакт'}</strong>
              <p>{formatTotalMinutes(invitation.startsAtTotalMinutes)} · {location?.name}</p>
              <div className="phone-inline-actions"><button type="button" onClick={() => props.onRespond(invitation.id, true)}>Принять</button><button type="button" onClick={() => props.onRespond(invitation.id, false)}>Отказаться</button></div>
            </article>
          ))}
        </section>
      ) : null}

      {props.state.social.meetings.length ? (
        <section className="phone-subsection phone-social-schedule">
          <div className="phone-section-title"><span>Ближайшие встречи</span><em>{props.state.social.meetings.length}</em></div>
          {props.state.social.meetings.map(({ meeting, npc, definition, location, failure }) => (
            <article key={meeting.id}>
              <span>{formatTotalMinutes(meeting.startsAtTotalMinutes)}</span>
              <strong>{definition?.shortTitle} · {npc?.firstName}</strong>
              <p>{location?.name}</p>
              <div className="phone-inline-actions">
                <button type="button" onClick={() => props.onRoute(meeting.locationId)}>Маршрут</button>
                <button type="button" disabled={Boolean(failure)} title={failure} onClick={() => props.onAttend(meeting.id)}>Встретиться</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <div className="phone-filter-row phone-contact-filters">
        {(['all', 'friends', 'work', 'university', 'boxing', 'neighborhood'] as Array<'all' | SocialCircleTag>).map((entry) => (
          <button className={filter === entry ? 'active' : ''} key={entry} type="button" onClick={() => setFilter(entry)}>{entry === 'all' ? 'Все' : SOCIAL_CIRCLE_LABELS[entry]}</button>
        ))}
      </div>
      <div className="phone-contact-list">
        {filtered.length ? filtered.map((contact) => (
          <button type="button" key={contact.npc.id} onClick={() => setSelectedNpcId(contact.npc.id)}>
            <span className="phone-message-avatar">{contact.npc.firstName[0]}{contact.npc.lastName[0]}</span>
            <div><strong>{contact.npc.firstName} {contact.npc.lastName}</strong><small>{contact.role?.name ?? 'Житель города'} · {getRelationshipStatusLabel(contact.status)}</small><p>{contact.messages[0]?.body ?? 'Можно написать или назначить встречу'}</p></div>
            {contact.relationship.romanceStatus !== 'none' ? <Icon name="heart" size={16}/> : null}
          </button>
        )) : <div className="phone-empty-state">Контактов в этой категории нет</div>}
      </div>
    </div>
  );
}

function MessagesApp({ state, onRead }: { state: PhonePanelState; onRead: (id: PhoneMessageId) => void }) {
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--messages"><Icon name="message" size={25}/><div><strong>Сообщения</strong><small>{state.unreadMessages} непрочитанных</small></div></div>
      <div className="phone-message-list">
        {state.phone.messages.length ? state.phone.messages.map((message) => (
          <button className={`phone-message-row ${message.read ? '' : 'is-unread'}`} key={message.id} type="button" onClick={() => onRead(message.id)}>
            <span className="phone-message-avatar">{message.senderName.slice(0, 1)}</span>
            <div><strong>{message.senderName}</strong><b>{message.subject}</b><p>{message.body}</p><small>{formatTotalMinutes(message.createdAtTotalMinutes)}</small></div>
          </button>
        )) : <div className="phone-empty-state">Сообщений пока нет</div>}
      </div>
    </div>
  );
}

function TripsApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onBuyTicket: (routeId: IntercityRouteId, departureTotalMinutes: number) => void;
  onBoard: (ticketId: IntercityTicketId) => void;
  onBookStay: (accommodationId: TemporaryAccommodationId, nights: number) => void;
  onDrive: (destinationCityId: CityId) => void;
}) {
  const travel = props.state.intercity;
  const activeTickets = travel.tickets.filter((entry) => entry.ticket.status === 'booked');

  return (
    <div className="phone-app-page phone-screen-enter phone-trips-app">
      <div className="phone-app-banner phone-app-banner--trips">
        <Icon name="bus" size={25}/>
        <div><strong>Поездки</strong><small>{travel.currentCity?.name ?? 'Текущий город'} · междугородние маршруты</small></div>
      </div>

      {activeTickets.length ? (
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Мои билеты</span><em>{activeTickets.length}</em></div>
          <div className="phone-trip-ticket-list">
            {activeTickets.map(({ ticket, route, originTerminal, destinationTerminal, boardFailure }) => (
              <article className="phone-trip-ticket" key={ticket.id}>
                <div className="phone-trip-ticket__route">
                  <span>{route?.mode === 'train' ? 'Поезд' : 'Автобус'}</span>
                  <strong>{route?.title ?? 'Междугородняя поездка'}</strong>
                  <small>{formatTotalMinutes(ticket.departureTotalMinutes)} · прибытие {formatTotalMinutes(ticket.arrivalTotalMinutes)}</small>
                </div>
                <div className="phone-address-block">
                  <Icon name="pin" size={17}/>
                  <div><strong>{originTerminal?.name ?? 'Вокзал'}</strong><span>{originTerminal?.address}</span></div>
                </div>
                <div className="phone-inline-actions">
                  {originTerminal ? <button type="button" onClick={() => props.onRoute(originTerminal.id)}>Маршрут</button> : null}
                  <button type="button" disabled={Boolean(boardFailure)} onClick={() => props.onBoard(ticket.id)}>Сесть</button>
                </div>
                {boardFailure ? <small className="phone-inline-error">{boardFailure}</small> : <small className="positive">Посадка доступна</small>}
                <p>{destinationTerminal?.name}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="phone-subsection">
        <div className="phone-section-title"><span>Билеты</span><em>{travel.routes.length} маршрута</em></div>
        <div className="phone-trip-route-list">
          {travel.routes.map(({ route, destinationCity, originTerminal, departures }) => (
            <article className="phone-trip-route" key={route.id}>
              <div className="phone-trip-route__head">
                <span className={`phone-trip-mode phone-trip-mode--${route.mode}`}>{route.mode === 'train' ? 'РЖД' : 'BUS'}</span>
                <div><strong>{destinationCity?.name ?? route.title}</strong><small>{route.operatorName} · {Math.floor(route.durationMinutes / 60)} ч {route.durationMinutes % 60} мин</small></div>
              </div>
              <p>{originTerminal?.name} → {route.title.split(' — ')[1]}</p>
              <div className="phone-departure-list">
                {departures.map((departure) => (
                  <button key={departure.departureTotalMinutes} type="button" onClick={() => props.onBuyTicket(route.id, departure.departureTotalMinutes)}>
                    <span>{formatTotalMinutes(departure.departureTotalMinutes)}</span>
                    <strong>{formatRubles(departure.fare)}</strong>
                  </button>
                ))}
              </div>
            </article>
          ))}
          {travel.routes.length === 0 ? <div className="phone-empty-state">Из этого города пока нет рейсов</div> : null}
        </div>
      </section>

      <section className="phone-subsection phone-car-intercity-card">
        <div className="phone-section-title"><span>На своей машине</span><em>{travel.roadDestinations.length} направл.</em></div>
        {travel.roadDestinations.map(({ connection, city, arrivalLocation, carQuote }) => (
          <article className="phone-trip-route" key={`${String(connection.originCityId)}-${String(connection.destinationCityId)}`}>
            <div className="phone-trip-route__head">
              <span className="phone-trip-mode phone-trip-mode--car">AUTO</span>
              <div><strong>{city?.name ?? 'Другой город'}</strong><small>{arrivalLocation?.name ?? 'Точка прибытия'}</small></div>
            </div>
            <div className="phone-detail-grid">
              <div><span>Дорога</span><strong>{Math.floor(carQuote.durationMinutes / 60)} ч {carQuote.durationMinutes % 60} мин</strong></div>
              <div><span>Расстояние</span><strong>{carQuote.distanceKm} км</strong></div>
              <div><span>Топливо</span><strong>{carQuote.fuelLiters.toFixed(1)} л</strong></div>
              <div><span>Дорожные расходы</span><strong>{formatRubles(carQuote.roadCost)}</strong></div>
            </div>
            <button className="phone-primary-action" type="button" disabled={!carQuote.available} onClick={() => props.onDrive(connection.destinationCityId)}>
              Ехать в {city?.name ?? 'другой город'}
            </button>
            {!carQuote.available ? <p className="phone-inline-error">{carQuote.unavailableReason}</p> : null}
          </article>
        ))}
        {travel.roadDestinations.length === 0 ? <div className="phone-empty-state">Из этого города нет автомобильных маршрутов</div> : null}
      </section>

      {travel.accommodations.length ? (
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Где остановиться</span>{travel.activeStay ? <em>Бронь активна</em> : null}</div>
          <div className="phone-stay-list">
            {travel.accommodations.map(({ accommodation, location, active, canAffordNight }) => (
              <article className={`phone-stay-card ${active ? 'is-active' : ''}`} key={accommodation.id}>
                <div><span>{accommodation.type === 'hostel' ? 'Хостел' : accommodation.type === 'hotel' ? 'Отель' : 'Квартира'}</span><strong>{accommodation.name}</strong><small>{accommodation.address}</small></div>
                <div className="phone-stay-card__price"><strong>{formatRubles(accommodation.nightlyPrice)}</strong><span>за ночь</span></div>
                <div className="phone-inline-actions">
                  {location ? <button type="button" onClick={() => props.onRoute(location.id)}>Маршрут</button> : null}
                  <button type="button" disabled={!canAffordNight} onClick={() => props.onBookStay(accommodation.id, 1)}>1 ночь</button>
                  <button type="button" disabled={!canAffordNight} onClick={() => props.onBookStay(accommodation.id, 3)}>3 ночи</button>
                </div>
                {active ? <small className="positive">Забронировано до дня {travel.activeStay?.checkoutDay}</small> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {travel.state.history.length ? (
        <section className="phone-subsection">
          <div className="phone-section-title"><span>История</span></div>
          <div className="phone-history-list">
            {travel.state.history.slice(0, 6).map((entry, index) => (
              <div key={`${entry.departedAtTotalMinutes}_${index}`}><span>{entry.mode === 'car' ? 'Автомобиль' : entry.mode === 'train' ? 'Поезд' : 'Автобус'}</span><strong>{formatTotalMinutes(entry.arrivedAtTotalMinutes)}</strong></div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CalendarApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onAttend: (jobId: JobId) => void;
  onAttendMedical: (serviceId: MedicalServiceId) => void;
  onBoardIntercity: (ticketId: IntercityTicketId) => void;
  onAttendUniversity: (programId: DegreeProgramId) => void;
  onAttendSocial: (meetingId: SocialMeetingId) => void;
}) {
  const events = [...props.state.phone.calendarEvents].sort((a, b) => a.startsAtTotalMinutes - b.startsAtTotalMinutes);
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--calendar"><Icon name="calendar" size={25}/><div><strong>Календарь</strong><small>Встречи и приёмы</small></div></div>
      <div className="phone-calendar-list">
        {events.length ? events.map((event) => {
          const vacancy = event.jobId ? props.state.jobs.find((entry) => entry.job.id === event.jobId) : undefined;
          const medicalService = event.medicalServiceId
            ? props.state.health.services.find((entry) => entry.service.id === event.medicalServiceId)
            : undefined;
          const tripTicket = event.intercityTicketId
            ? props.state.intercity.tickets.find((entry) => entry.ticket.id === event.intercityTicketId)
            : undefined;
          const universityProgram = event.degreeProgramId ? props.state.university.programs.find((entry) => entry.program.id === event.degreeProgramId) : undefined;
          const socialMeeting = event.socialMeetingId ? props.state.social.meetings.find((entry) => entry.meeting.id === event.socialMeetingId) : undefined;
          const location = vacancy?.location ?? medicalService?.clinic ?? tripTicket?.originTerminal ?? socialMeeting?.location ?? (universityProgram?.university ? { name: universityProgram.university.shortName, address: universityProgram.university.address } : undefined);
          const failure = vacancy?.interviewFailure ?? medicalService?.attendFailure ?? tripTicket?.boardFailure ?? universityProgram?.examFailure ?? socialMeeting?.failure;
          return (
            <article className={`phone-calendar-event phone-calendar-event--${event.status}`} key={event.id}>
              <time><strong>{formatTotalMinutes(event.startsAtTotalMinutes).split(' · ')[0]}</strong><span>{formatTotalMinutes(event.startsAtTotalMinutes).split(' · ')[1]}</span></time>
              <div><em>{event.status === 'scheduled' ? 'Запланировано' : event.status === 'completed' ? 'Завершено' : 'Пропущено'}</em><h3>{event.title}</h3><p>{location?.name}<br/>{location?.address}</p>
                {event.status === 'scheduled' ? <div className="phone-inline-actions">
                  <button type="button" onClick={() => props.onRoute(event.locationId)}>Маршрут</button>
                  {event.type === 'job_interview' && event.jobId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttend(event.jobId!)}>Собеседование</button> : null}
                  {event.type === 'medical_appointment' && event.medicalServiceId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttendMedical(event.medicalServiceId!)}>Приём</button> : null}
                  {event.type === 'intercity_departure' && event.intercityTicketId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onBoardIntercity(event.intercityTicketId!)}>Посадка</button> : null}
                  {event.type === 'university_entrance_exam' && event.degreeProgramId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttendUniversity(event.degreeProgramId!)}>Испытание</button> : null}
                  {event.type === 'social_meeting' && event.socialMeetingId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttendSocial(event.socialMeetingId!)}>Встретиться</button> : null}
                </div> : null}
                {event.status === 'scheduled' && failure ? <small>{failure}</small> : null}
              </div>
            </article>
          );
        }) : <div className="phone-empty-state">Календарь свободен</div>}
      </div>
    </div>
  );
}

function NotificationsApp({ state, onRead }: { state: PhonePanelState; onRead: (id: PhoneNotificationId) => void }) {
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--notifications"><Icon name="bell" size={25}/><div><strong>Уведомления</strong><small>{state.unreadNotifications} новых</small></div></div>
      <div className="phone-notification-list">
        {state.phone.notifications.length ? state.phone.notifications.map((notification) => (
          <button className={`phone-notification-row ${notification.read ? '' : 'is-unread'}`} key={notification.id} type="button" onClick={() => onRead(notification.id)}>
            <span><Icon name={notification.appId === 'jobs' ? 'briefcase' : notification.appId === 'calendar' ? 'calendar' : notification.appId === 'health' ? 'heart' : notification.appId === 'trips' ? 'bus' : notification.appId === 'education' ? 'book' : notification.appId === 'clock' ? 'clock' : notification.appId === 'contacts' ? 'users' : 'bell'} size={18}/></span>
            <div><strong>{notification.title}</strong><p>{notification.body}</p><small>{formatTotalMinutes(notification.createdAtTotalMinutes)}</small></div>
          </button>
        )) : <div className="phone-empty-state">Уведомлений нет</div>}
      </div>
    </div>
  );
}

export function PhoneShell(props: PhoneShellProps) {
  const [mounted, setMounted] = useState(props.open);
  const appTitle = useMemo(() => APP_META.find((entry) => entry.id === props.activeApp)?.label ?? 'Телефон', [props.activeApp]);

  useEffect(() => {
    if (props.open) setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key.toLowerCase() === 'p') props.open ? props.onClose() : props.onOpen();
      if (event.key === 'Escape' && props.open) props.onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [props.open, props.onClose, props.onOpen]);

  if (!mounted && !props.open) {
    return (
      <button className="phone-launcher" type="button" onClick={props.onOpen} aria-label="Открыть телефон">
        <Icon name="phone" size={23}/><span>Телефон</span><AppBadge count={props.state.unreadCount}/><kbd>P</kbd>
      </button>
    );
  }

  return (
    <>
      {!props.open ? (
        <button className="phone-launcher" type="button" onClick={props.onOpen} aria-label="Открыть телефон">
          <Icon name="phone" size={23}/><span>Телефон</span><AppBadge count={props.state.unreadCount}/><kbd>P</kbd>
        </button>
      ) : null}
      <div className={`phone-overlay ${props.open ? 'is-open' : 'is-closing'}`} onAnimationEnd={() => { if (!props.open) setMounted(false); }}>
        <button className="phone-overlay__backdrop" type="button" aria-label="Закрыть телефон" onClick={props.onClose}/>
        <aside className="diegetic-phone" aria-label="Смартфон персонажа">
          <div className="diegetic-phone__hardware"><i/><i/><i/></div>
          <div className="diegetic-phone__screen">
            <header className="phone-status-bar">
              <strong>{formatGameTime(props.time)}</strong>
              <span>5G <i className="phone-signal"/> 87%</span>
            </header>
            {props.activeApp !== 'home' ? (
              <header className="phone-app-header">
                <button type="button" onClick={() => { props.onSelectJob(undefined); props.onOpenApp('home'); }}><Icon name="chevron" size={20}/></button>
                <strong>{appTitle}</strong>
                <button type="button" onClick={props.onClose}><Icon name="close" size={18}/></button>
              </header>
            ) : <button className="phone-close-button" type="button" onClick={props.onClose}><Icon name="close" size={18}/></button>}
            <div className="phone-app-content">
              {props.activeApp === 'home' ? <PhoneHome state={props.state} onOpenApp={props.onOpenApp}/> : null}
              {props.activeApp === 'contacts' ? <ContactsApp state={props.state} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onSendMessage={props.onSendSocialMessage} onInvite={props.onInviteSocialMeeting} onRespond={props.onRespondSocialInvitation} onAttend={props.onAttendSocialMeeting} onCancel={props.onCancelSocialMeeting}/> : null}
              {props.activeApp === 'education' ? <EducationApp state={props.state} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onSubmit={props.onSubmitDegreeApplication} onAttendEntrance={props.onAttendDegreeEntranceExam} onEnroll={props.onEnrollDegreeProgram} onAttendClass={props.onAttendDegreeClass} onCompleteAssignment={props.onCompleteDegreeAssignment} onTakeExam={props.onTakeDegreeSemesterExam}/> : null}
              {props.activeApp === 'clock' ? <ClockApp onSkip={(minutes) => { props.onSkipTime(minutes); props.onClose(); }}/> : null}
              {props.activeApp === 'jobs' ? <JobsApp state={props.state} selectedJobId={props.selectedJobId} onSelectJob={props.onSelectJob} onSubmit={props.onSubmitApplication} onToggleSaved={props.onToggleSavedJob} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onAttendInterview={props.onAttendInterview}/> : null}
              {props.activeApp === 'maps' ? <MapsApp state={props.state} currentLocation={props.currentLocation} onClear={() => props.onSetMapTarget(undefined)} onMove={(locationId, modeId) => { props.onMoveLocation(locationId, modeId); props.onClose(); }} onMoveDistrict={(districtId, modeId) => { props.onMoveDistrict(districtId, modeId); props.onClose(); }}/> : null}
              {props.activeApp === 'bank' ? <BankApp state={props.state} onTransfer={props.onTransferFunds} onSetAutoSave={props.onSetAutoSave} onCreateGoal={props.onCreateSavingsGoal} onFundGoal={props.onFundSavingsGoal}/> : null}
              {props.activeApp === 'auto' ? <VehiclesApp state={props.state} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onScheduleInspection={props.onScheduleVehicleInspection} onInspect={props.onInspectVehicle} onBuyUsed={props.onBuyUsedVehicle} onBuyNew={props.onBuyNewVehicle} onRefuel={props.onRefuelVehicle} onService={props.onServiceVehicle} onSell={props.onSellVehicle}/> : null}
              {props.activeApp === 'health' ? <HealthApp state={props.state} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onSchedule={props.onScheduleMedicalVisit} onAttend={props.onAttendMedicalVisit} onSickLeave={props.onRequestSickLeave}/> : null}
              {props.activeApp === 'trips' ? <TripsApp state={props.state} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onBuyTicket={props.onBuyIntercityTicket} onBoard={props.onBoardIntercityTicket} onBookStay={props.onBookTemporaryAccommodation} onDrive={props.onDriveIntercity}/> : null}
              {props.activeApp === 'messages' ? <MessagesApp state={props.state} onRead={props.onReadMessage}/> : null}
              {props.activeApp === 'calendar' ? <CalendarApp state={props.state} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onAttend={props.onAttendInterview} onAttendMedical={props.onAttendMedicalVisit} onBoardIntercity={props.onBoardIntercityTicket} onAttendUniversity={props.onAttendDegreeEntranceExam} onAttendSocial={props.onAttendSocialMeeting}/> : null}
              {props.activeApp === 'notifications' ? <NotificationsApp state={props.state} onRead={props.onReadNotification}/> : null}
            </div>
            <button className="phone-home-indicator" type="button" aria-label="На главный экран" onClick={() => { props.onSelectJob(undefined); props.onOpenApp('home'); }}/>
          </div>
        </aside>
      </div>
    </>
  );
}
