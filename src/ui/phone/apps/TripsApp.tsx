import { useMemo, useState } from 'react';
import type { CityId, IntercityRouteId, IntercityTicketId, LocationId, TemporaryAccommodationId } from '../../../types/ids';
import type { IntercityMode } from '../../../types/intercity';
import { Icon } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';
import { formatRubles, formatTotalMinutes } from '../phoneShared';

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours > 0 && restMinutes > 0) return `${hours} ч ${restMinutes} мин`;
  if (hours > 0) return `${hours} ч`;
  return `${restMinutes} мин`;
}

function getModeLabel(mode: IntercityMode): string {
  if (mode === 'train') return 'Поезд';
  if (mode === 'bus') return 'Автобус';
  return 'Своя машина';
}

export default function TripsApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onBuyTicket: (routeId: IntercityRouteId, departureTotalMinutes: number) => void;
  onBoard: (ticketId: IntercityTicketId) => void;
  onBookStay: (accommodationId: TemporaryAccommodationId, nights: number) => void;
  onDrive: (destinationCityId: CityId) => void;
}) {
  const travel = props.state.intercity;
  const [selectedCityId, setSelectedCityId] = useState<CityId>();
  const [selectedMode, setSelectedMode] = useState<IntercityMode>();
  const activeTickets = travel.tickets.filter((entry) => entry.ticket.status === 'booked');

  const destinationCities = useMemo(() => {
    const cities = new Map<CityId, NonNullable<(typeof travel.routes)[number]['destinationCity']>>();

    travel.routes.forEach(({ route, destinationCity }) => {
      if (destinationCity) cities.set(route.destinationCityId, destinationCity);
    });
    travel.roadDestinations.forEach(({ connection, city }) => {
      if (city) cities.set(connection.destinationCityId, city);
    });

    return [...cities.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [travel.roadDestinations, travel.routes]);

  const selectedCity = destinationCities.find((city) => city.id === selectedCityId);
  const selectedRoutes = travel.routes.filter(({ route }) => route.destinationCityId === selectedCityId);
  const selectedRoadDestination = travel.roadDestinations.find(({ connection }) => connection.destinationCityId === selectedCityId);
  const availableModes = useMemo(() => {
    const modes: IntercityMode[] = [];
    if (selectedRoutes.some(({ route }) => route.mode === 'train')) modes.push('train');
    if (selectedRoutes.some(({ route }) => route.mode === 'bus')) modes.push('bus');
    if (selectedRoadDestination) modes.push('car');
    return modes;
  }, [selectedRoadDestination, selectedRoutes]);

  function selectCity(cityId: CityId): void {
    setSelectedCityId(cityId);
    setSelectedMode(undefined);
  }

  function resetPlanner(): void {
    setSelectedCityId(undefined);
    setSelectedMode(undefined);
  }

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

      <section className="phone-subsection phone-trip-planner">
        <div className="phone-section-title"><span>Новая поездка</span><em>3 шага</em></div>

        <div className="phone-trip-stepper" aria-label="Этапы выбора поездки">
          <span className={selectedCityId ? 'is-complete' : 'is-active'}><i>1</i>Город</span>
          <span className={selectedMode ? 'is-complete' : selectedCityId ? 'is-active' : ''}><i>2</i>Транспорт</span>
          <span className={selectedMode ? 'is-active' : ''}><i>3</i>Место</span>
        </div>

        {!selectedCity ? (
          <div className="phone-trip-choice-list">
            {destinationCities.map((city) => {
              const routeCount = travel.routes.filter(({ route }) => route.destinationCityId === city.id).length;
              const hasCarRoute = travel.roadDestinations.some(({ connection }) => connection.destinationCityId === city.id);
              return (
                <button key={city.id} type="button" onClick={() => selectCity(city.id)}>
                  <span className="phone-trip-choice-list__icon"><Icon name="city" size={20}/></span>
                  <span><strong>{city.name}</strong><small>{routeCount + (hasCarRoute ? 1 : 0)} вариантов поездки</small></span>
                  <Icon name="chevron" size={16}/>
                </button>
              );
            })}
            {destinationCities.length === 0 ? <div className="phone-empty-state">Из этого города пока нет междугородних маршрутов</div> : null}
          </div>
        ) : (
          <div className="phone-trip-selection">
            <div><span>Город</span><strong>{selectedCity.name}</strong></div>
            <button type="button" onClick={resetPlanner}>Изменить</button>
          </div>
        )}

        {selectedCity && !selectedMode ? (
          <div className="phone-trip-mode-grid">
            {availableModes.map((mode) => (
              <button key={mode} type="button" onClick={() => setSelectedMode(mode)}>
                <span className={`phone-trip-mode phone-trip-mode--${mode}`}>{mode === 'train' ? 'РЖД' : mode === 'bus' ? 'BUS' : 'AUTO'}</span>
                <strong>{getModeLabel(mode)}</strong>
                <small>{mode === 'car' ? selectedRoadDestination?.arrivalLocation?.name ?? 'Точка прибытия' : `${selectedRoutes.filter(({ route }) => route.mode === mode).length} маршрут(а)`}</small>
              </button>
            ))}
          </div>
        ) : null}

        {selectedCity && selectedMode ? (
          <div className="phone-trip-selection">
            <div><span>Транспорт</span><strong>{getModeLabel(selectedMode)}</strong></div>
            <button type="button" onClick={() => setSelectedMode(undefined)}>Изменить</button>
          </div>
        ) : null}

        {selectedCity && selectedMode && selectedMode !== 'car' ? selectedRoutes.filter(({ route }) => route.mode === selectedMode).map(({ route, originTerminal, destinationTerminal, departures }) => (
          <article className="phone-trip-route phone-trip-route--selected" key={route.id}>
            <div className="phone-trip-route__head">
              <span className={`phone-trip-mode phone-trip-mode--${route.mode}`}>{route.mode === 'train' ? 'РЖД' : 'BUS'}</span>
              <div><strong>{destinationTerminal?.name ?? selectedCity.name}</strong><small>{route.operatorName} · {formatDuration(route.durationMinutes)}</small></div>
            </div>
            <div className="phone-trip-terminal-flow">
              <div><span>Отправление</span><strong>{originTerminal?.name ?? 'Вокзал'}</strong><small>{originTerminal?.address}</small></div>
              <Icon name="arrow" size={17}/>
              <div><span>Прибытие</span><strong>{destinationTerminal?.name ?? selectedCity.name}</strong><small>{destinationTerminal?.address}</small></div>
            </div>
            <div className="phone-departure-list">
              {departures.map((departure) => (
                <button key={departure.departureTotalMinutes} type="button" onClick={() => props.onBuyTicket(route.id, departure.departureTotalMinutes)}>
                  <span>{formatTotalMinutes(departure.departureTotalMinutes)}</span>
                  <strong>{formatRubles(departure.fare)}</strong>
                </button>
              ))}
            </div>
            {departures.length === 0 ? <div className="phone-empty-state">Ближайших рейсов нет</div> : null}
          </article>
        )) : null}

        {selectedCity && selectedMode === 'car' && selectedRoadDestination ? (
          <article className="phone-trip-route phone-trip-route--selected">
            <div className="phone-trip-route__head">
              <span className="phone-trip-mode phone-trip-mode--car">AUTO</span>
              <div><strong>{selectedRoadDestination.arrivalLocation?.name ?? selectedCity.name}</strong><small>{selectedRoadDestination.arrivalLocation?.address ?? 'Точка прибытия'}</small></div>
            </div>
            <div className="phone-detail-grid">
              <div><span>Дорога</span><strong>{formatDuration(selectedRoadDestination.carQuote.durationMinutes)}</strong></div>
              <div><span>Расстояние</span><strong>{selectedRoadDestination.carQuote.distanceKm} км</strong></div>
              <div><span>Топливо</span><strong>{selectedRoadDestination.carQuote.fuelLiters.toFixed(1)} л</strong></div>
              <div><span>Дорожные расходы</span><strong>{formatRubles(selectedRoadDestination.carQuote.roadCost)}</strong></div>
            </div>
            <button className="phone-primary-action" type="button" disabled={!selectedRoadDestination.carQuote.available} onClick={() => props.onDrive(selectedRoadDestination.connection.destinationCityId)}>
              Ехать в {selectedCity.name}
            </button>
            {!selectedRoadDestination.carQuote.available ? <p className="phone-inline-error">{selectedRoadDestination.carQuote.unavailableReason}</p> : null}
          </article>
        ) : null}
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
              <div key={`${entry.departedAtTotalMinutes}_${index}`}><span>{getModeLabel(entry.mode)}</span><strong>{formatTotalMinutes(entry.arrivedAtTotalMinutes)}</strong></div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
