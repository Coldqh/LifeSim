import type { CityId, DistrictId, LocationId, TemporaryAccommodationId } from '../../types/ids';
import type { TemporaryAccommodation } from '../../types/intercity';
import { cityRegistry, moscowCity, yaroslavlCity } from '../cities';
import {
  createBidirectionalRoadConnections,
  createIntercityNetwork,
  createScheduledRoutePair
} from './network';

const cityId = (value: string) => value as CityId;
const locationId = (value: string) => value as LocationId;
const districtId = (value: string) => value as DistrictId;
const accommodationId = (value: string) => value as TemporaryAccommodationId;

const scheduledRoutes = [
  ...createScheduledRoutePair({
    mode: 'train',
    cityA: {
      id: moscowCity.id,
      name: moscowCity.name,
      terminalLocationId: locationId('msk_tverskoy_yaroslavsky_station'),
      departureMinutes: [7 * 60 + 35, 13 * 60 + 5, 18 * 60 + 20]
    },
    cityB: {
      id: yaroslavlCity.id,
      name: yaroslavlCity.name,
      terminalLocationId: locationId('yar_leninsky_main_station'),
      departureMinutes: [6 * 60 + 42, 14 * 60 + 12, 19 * 60 + 30]
    },
    durationMinutes: 210,
    distanceKm: 282,
    fare: 1250,
    operatorName: 'РЖД'
  }),
  ...createScheduledRoutePair({
    mode: 'bus',
    cityA: {
      id: moscowCity.id,
      name: moscowCity.name,
      terminalLocationId: locationId('msk_tverskoy_central_bus_station'),
      departureMinutes: [8 * 60, 12 * 60 + 30, 17 * 60 + 30]
    },
    cityB: {
      id: yaroslavlCity.id,
      name: yaroslavlCity.name,
      terminalLocationId: locationId('yar_frunzensky_bus_station'),
      departureMinutes: [7 * 60 + 20, 13 * 60, 18 * 60]
    },
    durationMinutes: 285,
    distanceKm: 270,
    fare: 900,
    operatorName: 'Межрегиональные автобусные линии'
  })
];

const roadConnections = createBidirectionalRoadConnections({
  cityAId: cityId('moscow'),
  cityBId: cityId('yaroslavl'),
  distanceKm: 270,
  durationMinutes: 255,
  roadCost: 650
});

const accommodations: TemporaryAccommodation[] = [
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

export const intercityNetwork = createIntercityNetwork({
  cityRegistry,
  routes: scheduledRoutes,
  roadConnections,
  accommodations
});

export const intercityRoutes = [...intercityNetwork.routes];
export const intercityRoadConnections = [...intercityNetwork.roadConnections];
export const temporaryAccommodations = [...intercityNetwork.accommodations];

export const getIntercityRouteById = intercityNetwork.getRouteById;
export const getTemporaryAccommodationById = intercityNetwork.getAccommodationById;
export const getIntercityRoadConnection = intercityNetwork.getRoadConnection;
export const getIntercityRoutesFromCity = intercityNetwork.getRoutesFromCity;
export const getIntercityRoadConnectionsFromCity = intercityNetwork.getRoadConnectionsFromCity;
