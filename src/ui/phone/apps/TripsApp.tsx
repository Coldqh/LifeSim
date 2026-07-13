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

export default function TripsApp(props: {
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

