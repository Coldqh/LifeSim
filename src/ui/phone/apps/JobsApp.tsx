import { useState } from 'react';
import type { Job } from '../../../types/job';
import type { City, District, Location } from '../../../types/location';
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
} from '../../../types/ids';
import type { PhoneAppId, PhoneJobApplication, PhoneMessage, PhoneState } from '../../../types/phone';
import type { GameTime } from '../../../types/time';
import type { DistrictTravelOption, LocationTravelOption } from '../../../types/travel';
import type { PersonalFinanceState, UpcomingPayment } from '../../../types/finance';
import type { TravelModeId } from '../../../types/transport';
import type { VehicleListingView, VehicleModel, VehicleWorldState } from '../../../types/vehicle';
import type { ActiveMedicalCondition, MedicalAppointment, MedicalConditionDefinition, MedicalPrescription, MedicalService, MedicalState, SickLeave } from '../../../types/healthcare';
import type { Product } from '../../../types/product';
import type { IntercityCarQuote, IntercityDeparture, IntercityRoadConnection, IntercityRoute, IntercityTicket, IntercityTravelState, TemporaryAccommodation, TemporaryStay } from '../../../types/intercity';
import type { ScheduleStatus } from '../../../types/schedule';
import type { DegreeProgramDefinition, UniversityApplication, UniversityAssignment, UniversityClassView, UniversityDefinition, UniversityEnrollment, UniversityState } from '../../../types/university';
import type { Npc, NpcRoleDefinition } from '../../../types/npc';
import type { NpcRelationship, RelationshipStatus } from '../../../types/relationship';
import type { SocialContact, SocialCircleTag, SocialInvitation, SocialMeeting, SocialMeetingDefinition, SocialMeetingSlot, SocialMessageActionId, SocialQuickMessageDefinition } from '../../../types/socialLife';
import { VEHICLE_DEFECT_LABELS } from '../../../core/vehicles';
import { formatGameTime } from '../../../core/time';
import { getRelationshipStatusLabel } from '../../../core/relationships';
import { Icon } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';
import { APPLICATION_LABELS, formatRubles, formatTotalMinutes, getApplicationTone } from '../phoneShared';

export default function JobsApp(props: {
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
    const haystack = `${entry.job.title} ${entry.company?.name ?? ''} ${entry.location?.name ?? ''} ${entry.district?.name ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  if (selected) {
    const application = selected.application;
    return (
      <div className="phone-app-page phone-screen-enter">
        <button className="phone-text-button" type="button" onClick={() => props.onSelectJob(undefined)}>← Все вакансии</button>
        <section className="phone-job-detail">
          <div className="phone-job-detail__brand">{selected.company ? selected.company.name.slice(0, 2).toUpperCase() : 'hh'}</div>
          <span className="phone-kicker">{selected.company?.name ?? selected.location?.name ?? 'Работодатель'}</span>
          <h2>{selected.job.title}</h2>
          <strong className="phone-job-salary">{formatRubles(selected.estimatedMonthlyIncome)} / месяц</strong>
          <div className="phone-detail-grid">
            <div><span>Смена</span><strong>{selected.job.shiftDurationMinutes / 60} ч · {formatRubles(selected.job.wagePerShift)}</strong></div>
            <div><span>Формат</span><strong>{selected.job.employmentType === 'professional' ? 'Профессия' : selected.job.employmentType === 'internship' ? 'Стажировка' : 'Обычная работа'}</strong></div>
          </div>
          <div className="phone-address-block"><Icon name="pin" size={18}/><div><strong>{selected.location?.name ?? 'Место работы'}</strong><span>{selected.location?.address ?? 'Адрес не указан'}</span></div></div>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Требования</span>{selected.missingSkillRequirements.length === 0 && selected.hasRequiredDegree ? <em>Подходишь</em> : <em className="negative">Не выполнены</em>}</div>
          {selected.job.requirements?.skills?.length || selected.requiredDegreeTitles.length ? (
            <div className="phone-requirements-list">
              {(selected.job.requirements?.skills ?? []).map((requirement) => {
                const missing = selected.missingSkillRequirements.find((entry) => entry.skillId === requirement.skillId);
                return <div key={requirement.skillId}><span>{missing?.name ?? String(requirement.skillId)}</span><strong className={missing ? 'negative' : 'positive'}>{missing?.currentLevel ?? requirement.minLevel}/{requirement.minLevel}</strong></div>;
              })}
              {selected.requiredDegreeTitles.length ? (
                <div><span>Подходящий диплом</span><strong className={selected.hasRequiredDegree ? 'positive' : 'negative'}>{selected.hasRequiredDegree ? 'Есть' : 'Нет'}</strong></div>
              ) : null}
              {selected.requiredDegreeTitles.length ? <p className="phone-muted">Подойдут: {selected.requiredDegreeTitles.join(', ')}.</p> : null}
            </div>
          ) : <p className="phone-muted">Стартовая вакансия без требований к образованию и навыкам.</p>}
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
      <div className="phone-app-banner phone-app-banner--jobs"><span>hh</span><div><strong>Работа и карьера</strong><small>{filtered.length} вакансий</small></div></div>
      <section className="phone-subsection">
        <div className="phone-section-title"><span>Резюме</span><em>{props.state.career.qualifications.length} дипломов</em></div>
        <div className="phone-requirements-list">
          <div><span>Отработано смен</span><strong>{props.state.career.completedShiftCount}</strong></div>
          <div><span>История занятости</span><strong>{props.state.career.employmentHistory.length}</strong></div>
          <div><span>Текущая работа</span><strong>{props.state.career.activeEmployment ? 'Есть' : 'Нет'}</strong></div>
        </div>
      </section>
      <label className="phone-search"><Icon name="search" size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Должность, компания, район" /></label>
      <div className="phone-filter-row">
        <button className={!savedOnly ? 'active' : ''} type="button" onClick={() => setSavedOnly(false)}>Все</button>
        <button className={savedOnly ? 'active' : ''} type="button" onClick={() => setSavedOnly(true)}>Сохранённые</button>
      </div>
      <div className="phone-job-list">
        {filtered.map((view) => (
          <button className="phone-job-card" key={view.job.id} type="button" onClick={() => props.onSelectJob(view.job.id)}>
            <div className="phone-job-card__top"><span>{view.company?.name ?? view.location?.name ?? 'Работодатель'}</span>{view.application ? <em className={`status-${getApplicationTone(view.application.status)}`}>{APPLICATION_LABELS[view.application.status]}</em> : null}</div>
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


