import type { CityId, DistrictId, IntercityRouteId, IntercityTicketId, LocationId, TemporaryAccommodationId } from './ids';
import type { NeedsState } from './needs';

export type IntercityMode = 'train' | 'bus' | 'car';
export type IntercityTicketStatus = 'booked' | 'used' | 'missed' | 'cancelled';

export type IntercityRoute = {
  id: IntercityRouteId;
  mode: Exclude<IntercityMode, 'car'>;
  originCityId: CityId;
  destinationCityId: CityId;
  originTerminalLocationId: LocationId;
  destinationTerminalLocationId: LocationId;
  departureMinutes: number[];
  durationMinutes: number;
  distanceKm: number;
  fare: number;
  operatorName: string;
  title: string;
};

export type IntercityDeparture = {
  routeId: IntercityRouteId;
  departureTotalMinutes: number;
  arrivalTotalMinutes: number;
  fare: number;
};

export type IntercityTicket = {
  id: IntercityTicketId;
  routeId: IntercityRouteId;
  departureTotalMinutes: number;
  arrivalTotalMinutes: number;
  purchasedAtTotalMinutes: number;
  price: number;
  status: IntercityTicketStatus;
  reminderSent?: boolean;
};

export type IntercityTravelHistoryEntry = {
  mode: IntercityMode;
  originCityId: CityId;
  destinationCityId: CityId;
  departedAtTotalMinutes: number;
  arrivedAtTotalMinutes: number;
  cost: number;
};

export type TemporaryAccommodation = {
  id: TemporaryAccommodationId;
  cityId: CityId;
  districtId: DistrictId;
  locationId: LocationId;
  name: string;
  type: 'hostel' | 'hotel' | 'apartment';
  nightlyPrice: number;
  comfort: number;
  address: string;
};

export type TemporaryStay = {
  accommodationId: TemporaryAccommodationId;
  locationId: LocationId;
  cityId: CityId;
  checkInDay: number;
  checkoutDay: number;
  paidAmount: number;
};

export type IntercityTravelState = {
  tickets: IntercityTicket[];
  activeStay?: TemporaryStay;
  history: IntercityTravelHistoryEntry[];
  lastProcessedTotalMinutes: number;
};

export type IntercityTravelResult = {
  ok: boolean;
  title: string;
  message: string;
  timeDeltaMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
};

export type IntercityCarQuote = {
  durationMinutes: number;
  distanceKm: number;
  fuelLiters: number;
  roadCost: number;
  available: boolean;
  unavailableReason?: string;
};
