import type { CityId, IntercityRouteId, IntercityTicketId, LocationId, TemporaryAccommodationId } from '../../types/ids';
import type {
  IntercityCarQuote,
  IntercityDeparture,
  IntercityRoute,
  IntercityTicket,
  IntercityTravelResult,
  IntercityTravelState,
  TemporaryAccommodation
} from '../../types/intercity';
import type { VehicleModel, VehicleWorldState } from '../../types/vehicle';

const MINUTES_IN_DAY = 24 * 60;
const BOARD_EARLY_MINUTES = 50;
const BOARD_LATE_MINUTES = 12;
const CAR_DISTANCE_KM = 270;
const CAR_DURATION_MINUTES = 255;
const CAR_ROAD_COST = 650;

const ticketId = (value: string) => value as IntercityTicketId;

export function createInitialIntercityState(currentTotalMinutes: number): IntercityTravelState {
  return {
    tickets: [],
    history: [],
    lastProcessedTotalMinutes: Math.max(0, currentTotalMinutes)
  };
}

export function getRoutesFromCity(routes: IntercityRoute[], cityId: CityId): IntercityRoute[] {
  return routes.filter((route) => route.originCityId === cityId);
}

export function getUpcomingDepartures(input: {
  route: IntercityRoute;
  currentTotalMinutes: number;
  days?: number;
}): IntercityDeparture[] {
  const days = Math.max(1, Math.min(4, input.days ?? 3));
  const currentDayIndex = Math.floor(input.currentTotalMinutes / MINUTES_IN_DAY);
  const departures: IntercityDeparture[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const dayStart = (currentDayIndex + dayOffset) * MINUTES_IN_DAY;
    input.route.departureMinutes.forEach((minute) => {
      const departureTotalMinutes = dayStart + minute;
      if (departureTotalMinutes < input.currentTotalMinutes + 30) return;
      departures.push({
        routeId: input.route.id,
        departureTotalMinutes,
        arrivalTotalMinutes: departureTotalMinutes + input.route.durationMinutes,
        fare: input.route.fare
      });
    });
  }

  return departures.slice(0, 6);
}

export function bookIntercityTicket(input: {
  state: IntercityTravelState;
  route: IntercityRoute;
  departureTotalMinutes: number;
  currentTotalMinutes: number;
  bankBalance: number;
}): { state: IntercityTravelState; ticket?: IntercityTicket; result: IntercityTravelResult } {
  if (input.departureTotalMinutes < input.currentTotalMinutes + 30) {
    return { state: input.state, result: { ok: false, title: 'Билет не куплен', message: 'До отправления осталось слишком мало времени.', timeDeltaMinutes: 0 } };
  }
  if (input.bankBalance < input.route.fare) {
    return { state: input.state, result: { ok: false, title: 'Билет не куплен', message: `Не хватает ${input.route.fare - input.bankBalance} ₽.`, timeDeltaMinutes: 0 } };
  }
  if (input.state.tickets.some((ticket) => ticket.status === 'booked' && ticket.departureTotalMinutes === input.departureTotalMinutes)) {
    return { state: input.state, result: { ok: false, title: 'Билет уже куплен', message: 'На это отправление уже есть билет.', timeDeltaMinutes: 0 } };
  }

  const ticket: IntercityTicket = {
    id: ticketId(`ticket_${String(input.route.id)}_${input.departureTotalMinutes}`),
    routeId: input.route.id,
    departureTotalMinutes: input.departureTotalMinutes,
    arrivalTotalMinutes: input.departureTotalMinutes + input.route.durationMinutes,
    purchasedAtTotalMinutes: input.currentTotalMinutes,
    price: input.route.fare,
    status: 'booked'
  };

  return {
    state: { ...input.state, tickets: [ticket, ...input.state.tickets].slice(0, 30) },
    ticket,
    result: { ok: true, title: 'Билет куплен', message: `${input.route.title}. Отправление запланировано.`, timeDeltaMinutes: 0, moneyDelta: -input.route.fare }
  };
}

export function processIntercityTime(state: IntercityTravelState, currentTotalMinutes: number): IntercityTravelState {
  if (currentTotalMinutes <= state.lastProcessedTotalMinutes) return state;
  return {
    ...state,
    tickets: state.tickets.map((ticket) => (
      ticket.status === 'booked' && currentTotalMinutes > ticket.departureTotalMinutes + BOARD_LATE_MINUTES
        ? { ...ticket, status: 'missed' as const }
        : ticket
    )),
    activeStay: state.activeStay && Math.floor(currentTotalMinutes / MINUTES_IN_DAY) + 1 >= state.activeStay.checkoutDay
      ? undefined
      : state.activeStay,
    lastProcessedTotalMinutes: currentTotalMinutes
  };
}

export function getTicketBoardFailure(input: {
  ticket: IntercityTicket | undefined;
  route: IntercityRoute | undefined;
  currentLocationId?: LocationId;
  currentTotalMinutes: number;
}): string | undefined {
  if (!input.ticket || !input.route) return 'Билет или маршрут не найден.';
  if (input.ticket.status !== 'booked') return input.ticket.status === 'missed' ? 'Отправление уже пропущено.' : 'Билет больше не действует.';
  if (input.currentLocationId !== input.route.originTerminalLocationId) return 'Нужно приехать на вокзал отправления.';
  if (input.currentTotalMinutes < input.ticket.departureTotalMinutes - BOARD_EARLY_MINUTES) return 'Посадка ещё не началась.';
  if (input.currentTotalMinutes > input.ticket.departureTotalMinutes + BOARD_LATE_MINUTES) return 'Ты опоздал на отправление.';
  return undefined;
}

export function useIntercityTicket(input: {
  state: IntercityTravelState;
  ticket: IntercityTicket | undefined;
  route: IntercityRoute | undefined;
  currentLocationId?: LocationId;
  currentTotalMinutes: number;
}): { state: IntercityTravelState; result: IntercityTravelResult } {
  const failure = getTicketBoardFailure(input);
  if (failure || !input.ticket || !input.route) {
    return { state: input.state, result: { ok: false, title: 'Поездка недоступна', message: failure ?? 'Маршрут не найден.', timeDeltaMinutes: 0 } };
  }

  return {
    state: {
      ...input.state,
      tickets: input.state.tickets.map((ticket) => ticket.id === input.ticket?.id ? { ...ticket, status: 'used' } : ticket),
      history: [{
        mode: input.route.mode,
        originCityId: input.route.originCityId,
        destinationCityId: input.route.destinationCityId,
        departedAtTotalMinutes: input.ticket.departureTotalMinutes,
        arrivedAtTotalMinutes: input.ticket.arrivalTotalMinutes,
        cost: input.ticket.price
      }, ...input.state.history].slice(0, 30)
    },
    result: {
      ok: true,
      title: input.route.mode === 'train' ? 'Поезд прибыл' : 'Автобус прибыл',
      message: `${input.route.title}. Ты прибыл в другой город.`,
      timeDeltaMinutes: Math.max(0, input.ticket.arrivalTotalMinutes - input.currentTotalMinutes),
      needsDelta: input.route.mode === 'train' ? { energy: -4, hunger: -5, thirst: -5, mood: -1 } : { energy: -7, hunger: -7, thirst: -8, mood: -3 }
    }
  };
}

export function bookTemporaryAccommodation(input: {
  state: IntercityTravelState;
  accommodation: TemporaryAccommodation;
  currentCityId: CityId;
  currentDay: number;
  nights: number;
  bankBalance: number;
}): { state: IntercityTravelState; result: IntercityTravelResult } {
  const nights = Math.max(1, Math.min(14, Math.floor(input.nights)));
  const cost = input.accommodation.nightlyPrice * nights;
  if (input.currentCityId !== input.accommodation.cityId) {
    return { state: input.state, result: { ok: false, title: 'Бронь недоступна', message: 'Сначала нужно приехать в этот город.', timeDeltaMinutes: 0 } };
  }
  if (input.bankBalance < cost) {
    return { state: input.state, result: { ok: false, title: 'Бронь недоступна', message: `Не хватает ${cost - input.bankBalance} ₽.`, timeDeltaMinutes: 0 } };
  }
  return {
    state: {
      ...input.state,
      activeStay: {
        accommodationId: input.accommodation.id,
        locationId: input.accommodation.locationId,
        cityId: input.accommodation.cityId,
        checkInDay: input.currentDay,
        checkoutDay: input.currentDay + nights,
        paidAmount: cost
      }
    },
    result: { ok: true, title: 'Проживание забронировано', message: `${input.accommodation.name}: ${nights} ноч.`, timeDeltaMinutes: 0, moneyDelta: -cost }
  };
}

export function getTemporaryStayFailure(input: {
  state: IntercityTravelState;
  locationId?: LocationId;
  day: number;
}): string | undefined {
  const stay = input.state.activeStay;
  if (!stay || stay.locationId !== input.locationId) return 'Нужно забронировать проживание через телефон.';
  if (input.day >= stay.checkoutDay) return 'Срок проживания закончился.';
  return undefined;
}

export function getIntercityCarQuote(input: {
  world: VehicleWorldState;
  model?: VehicleModel;
  currentLocationId?: LocationId;
}): IntercityCarQuote {
  const vehicle = input.world.ownedVehicle;
  if (!vehicle || !input.model) return { durationMinutes: CAR_DURATION_MINUTES, distanceKm: CAR_DISTANCE_KM, fuelLiters: 0, roadCost: CAR_ROAD_COST, available: false, unavailableReason: 'Нет личного автомобиля.' };
  if (vehicle.parkedLocationId !== input.currentLocationId) return { durationMinutes: CAR_DURATION_MINUTES, distanceKm: CAR_DISTANCE_KM, fuelLiters: 0, roadCost: CAR_ROAD_COST, available: false, unavailableReason: 'Автомобиль находится в другом месте.' };
  if (vehicle.conditionPercent < 30) return { durationMinutes: CAR_DURATION_MINUTES, distanceKm: CAR_DISTANCE_KM, fuelLiters: 0, roadCost: CAR_ROAD_COST, available: false, unavailableReason: 'Состояние автомобиля слишком плохое для междугородней поездки.' };
  const fuelLiters = Math.ceil(input.model.consumptionLitersPer100Km * CAR_DISTANCE_KM / 100 * 10) / 10;
  if (vehicle.fuelLiters < fuelLiters) return { durationMinutes: CAR_DURATION_MINUTES, distanceKm: CAR_DISTANCE_KM, fuelLiters, roadCost: CAR_ROAD_COST, available: false, unavailableReason: `Нужно ${fuelLiters} л топлива. Сейчас ${vehicle.fuelLiters.toFixed(1)} л.` };
  return { durationMinutes: CAR_DURATION_MINUTES, distanceKm: CAR_DISTANCE_KM, fuelLiters, roadCost: CAR_ROAD_COST, available: true };
}

export function applyIntercityCarTravel(input: {
  state: IntercityTravelState;
  originCityId: CityId;
  destinationCityId: CityId;
  currentTotalMinutes: number;
  quote: IntercityCarQuote;
}): { state: IntercityTravelState; result: IntercityTravelResult } {
  if (!input.quote.available) return { state: input.state, result: { ok: false, title: 'Поездка недоступна', message: input.quote.unavailableReason ?? 'Маршрут недоступен.', timeDeltaMinutes: 0 } };
  return {
    state: {
      ...input.state,
      history: [{
        mode: 'car' as const, originCityId: input.originCityId, destinationCityId: input.destinationCityId,
        departedAtTotalMinutes: input.currentTotalMinutes, arrivedAtTotalMinutes: input.currentTotalMinutes + input.quote.durationMinutes,
        cost: input.quote.roadCost
      }, ...input.state.history].slice(0, 30)
    },
    result: {
      ok: true,
      title: 'Междугородняя поездка',
      message: 'Ты добрался до другого города на личном автомобиле.',
      timeDeltaMinutes: input.quote.durationMinutes,
      moneyDelta: -input.quote.roadCost,
      needsDelta: { energy: -12, hunger: -9, thirst: -10, mood: -4 }
    }
  };
}
