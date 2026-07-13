import { useMemo, useState } from 'react';
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

export default function HealthApp(props: {
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

