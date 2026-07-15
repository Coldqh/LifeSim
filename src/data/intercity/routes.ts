import type { CityId, DistrictId, LocationId, TemporaryAccommodationId } from '../../types/ids';
import type { TemporaryAccommodation } from '../../types/intercity';
import { cityRegistry, moscowCity, rybinskCity, yaroslavlCity } from '../cities';
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
  }),
  ...createScheduledRoutePair({
    mode: 'train',
    cityA: {
      id: yaroslavlCity.id,
      name: yaroslavlCity.name,
      terminalLocationId: locationId('yar_leninsky_main_station'),
      departureMinutes: [7 * 60 + 10, 12 * 60 + 45, 18 * 60 + 15]
    },
    cityB: {
      id: rybinskCity.id,
      name: rybinskCity.name,
      terminalLocationId: locationId('ryb_center_station'),
      departureMinutes: [6 * 60 + 55, 13 * 60 + 20, 19 * 60]
    },
    durationMinutes: 85,
    distanceKm: 82,
    fare: 480,
    operatorName: 'Северная пригородная пассажирская компания'
  }),
  ...createScheduledRoutePair({
    mode: 'bus',
    cityA: {
      id: yaroslavlCity.id,
      name: yaroslavlCity.name,
      terminalLocationId: locationId('yar_frunzensky_bus_station'),
      departureMinutes: [8 * 60, 11 * 60 + 30, 16 * 60 + 40, 20 * 60]
    },
    cityB: {
      id: rybinskCity.id,
      name: rybinskCity.name,
      terminalLocationId: locationId('ryb_center_bus_station'),
      departureMinutes: [6 * 60 + 30, 10 * 60, 15 * 60, 18 * 60 + 30]
    },
    durationMinutes: 110,
    distanceKm: 86,
    fare: 380,
    operatorName: 'Ярославское межмуниципальное сообщение'
  }),
  ...createScheduledRoutePair({
    mode: 'bus',
    cityA: {
      id: moscowCity.id,
      name: moscowCity.name,
      terminalLocationId: locationId('msk_tverskoy_central_bus_station'),
      departureMinutes: [7 * 60 + 30, 15 * 60 + 30]
    },
    cityB: {
      id: rybinskCity.id,
      name: rybinskCity.name,
      terminalLocationId: locationId('ryb_center_bus_station'),
      departureMinutes: [6 * 60 + 15, 14 * 60 + 15]
    },
    durationMinutes: 330,
    distanceKm: 310,
    fare: 1400,
    operatorName: 'Верхневолжские автобусные линии'
  })
];

const roadConnections = [
  ...createBidirectionalRoadConnections({
    cityAId: cityId('moscow'), cityBId: cityId('yaroslavl'), distanceKm: 270, durationMinutes: 255, roadCost: 650
  }),
  ...createBidirectionalRoadConnections({
    cityAId: cityId('yaroslavl'), cityBId: cityId('rybinsk'), distanceKm: 86, durationMinutes: 95, roadCost: 280
  }),
  ...createBidirectionalRoadConnections({
    cityAId: cityId('moscow'), cityBId: cityId('rybinsk'), distanceKm: 310, durationMinutes: 310, roadCost: 900
  })
];

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
  },
  {
    id: accommodationId('stay_ryb_hostel_station'), cityId: cityId('rybinsk'), districtId: districtId('ryb_center'),
    locationId: locationId('ryb_center_hostel'), name: 'Хостел у вокзала', type: 'hostel', nightlyPrice: 950, comfort: 34,
    address: 'Вокзальная ул., 7'
  },
  {
    id: accommodationId('stay_ryb_hotel_volga'), cityId: cityId('rybinsk'), districtId: districtId('ryb_center'),
    locationId: locationId('ryb_center_hotel'), name: 'Гостиница «Волга»', type: 'hotel', nightlyPrice: 2900, comfort: 66,
    address: 'Крестовая ул., 120'
  },
  {
    id: accommodationId('stay_ryb_daily_apartment'), cityId: cityId('rybinsk'), districtId: districtId('ryb_center'),
    locationId: locationId('ryb_center_daily_apartment'), name: 'Квартира посуточно в центре', type: 'apartment', nightlyPrice: 2200, comfort: 58,
    address: 'ул. Ломоносова, 8'
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
