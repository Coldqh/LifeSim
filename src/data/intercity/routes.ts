import type { CityId, IntercityRouteId, LocationId } from '../../types/ids';
import type { IntercityRoute, TemporaryAccommodation } from '../../types/intercity';
import type { DistrictId, TemporaryAccommodationId } from '../../types/ids';

const routeId = (value: string) => value as IntercityRouteId;
const cityId = (value: string) => value as CityId;
const locationId = (value: string) => value as LocationId;
const districtId = (value: string) => value as DistrictId;
const accommodationId = (value: string) => value as TemporaryAccommodationId;

export const intercityRoutes: IntercityRoute[] = [
  {
    id: routeId('route_moscow_yaroslavl_train'), mode: 'train', originCityId: cityId('moscow'), destinationCityId: cityId('yaroslavl'),
    originTerminalLocationId: locationId('msk_tverskoy_yaroslavsky_station'), destinationTerminalLocationId: locationId('yar_leninsky_main_station'),
    departureMinutes: [7 * 60 + 35, 13 * 60 + 5, 18 * 60 + 20], durationMinutes: 210, distanceKm: 282, fare: 1250,
    operatorName: 'РЖД', title: 'Москва — Ярославль'
  },
  {
    id: routeId('route_yaroslavl_moscow_train'), mode: 'train', originCityId: cityId('yaroslavl'), destinationCityId: cityId('moscow'),
    originTerminalLocationId: locationId('yar_leninsky_main_station'), destinationTerminalLocationId: locationId('msk_tverskoy_yaroslavsky_station'),
    departureMinutes: [6 * 60 + 42, 14 * 60 + 12, 19 * 60 + 30], durationMinutes: 210, distanceKm: 282, fare: 1250,
    operatorName: 'РЖД', title: 'Ярославль — Москва'
  },
  {
    id: routeId('route_moscow_yaroslavl_bus'), mode: 'bus', originCityId: cityId('moscow'), destinationCityId: cityId('yaroslavl'),
    originTerminalLocationId: locationId('msk_tverskoy_central_bus_station'), destinationTerminalLocationId: locationId('yar_frunzensky_bus_station'),
    departureMinutes: [8 * 60, 12 * 60 + 30, 17 * 60 + 30], durationMinutes: 285, distanceKm: 270, fare: 900,
    operatorName: 'Межрегиональные автобусные линии', title: 'Москва — Ярославль'
  },
  {
    id: routeId('route_yaroslavl_moscow_bus'), mode: 'bus', originCityId: cityId('yaroslavl'), destinationCityId: cityId('moscow'),
    originTerminalLocationId: locationId('yar_frunzensky_bus_station'), destinationTerminalLocationId: locationId('msk_tverskoy_central_bus_station'),
    departureMinutes: [7 * 60 + 20, 13 * 60, 18 * 60], durationMinutes: 285, distanceKm: 270, fare: 900,
    operatorName: 'Межрегиональные автобусные линии', title: 'Ярославль — Москва'
  }
];

export const temporaryAccommodations: TemporaryAccommodation[] = [
  {
    id: accommodationId('stay_yar_hostel_station'), cityId: cityId('yaroslavl'), districtId: districtId('yar_leninsky'),
    locationId: locationId('yar_leninsky_hostel'), name: 'Хостел у вокзала', type: 'hostel', nightlyPrice: 1200, comfort: 35,
    address: 'ул. Ухтомского, 12'
  },
  {
    id: accommodationId('stay_yar_ibis_center'), cityId: cityId('yaroslavl'), districtId: districtId('yar_kirovsky'),
    locationId: locationId('yar_kirovsky_ibis_hotel'), name: 'Ibis Ярославль Центр', type: 'hotel', nightlyPrice: 4200, comfort: 72,
    address: 'Первомайский пер., 2А'
  },
  {
    id: accommodationId('stay_yar_daily_apartment'), cityId: cityId('yaroslavl'), districtId: districtId('yar_frunzensky'),
    locationId: locationId('yar_frunzensky_daily_apartment'), name: 'Квартира посуточно', type: 'apartment', nightlyPrice: 3000, comfort: 60,
    address: 'Московский просп., 90'
  }
];

export const getIntercityRouteById = (id: IntercityRouteId | undefined) => intercityRoutes.find((route) => route.id === id);
export const getTemporaryAccommodationById = (id: TemporaryAccommodationId | undefined) => temporaryAccommodations.find((entry) => entry.id === id);
