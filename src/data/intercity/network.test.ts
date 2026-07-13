import { describe, expect, it } from 'vitest';
import type { CityId, CountryId, DistrictId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';
import { createCityRegistry, defineCityContentPack } from '../cities/registry';
import {
  createBidirectionalRoadConnections,
  createIntercityNetwork,
  createScheduledRoutePair
} from './network';

const cityId = (value: string) => value as CityId;
const countryId = (value: string) => value as CountryId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;

function createCityPack(slug: string, name: string) {
  const cityValue = cityId(slug);
  const districtValue = districtId(`${slug}_center`);
  const stationValue = locationId(`${slug}_station`);
  const city: City = { id: cityValue, countryId: countryId('test'), name, description: '', districtIds: [districtValue] };
  const district: District = { id: districtValue, cityId: cityValue, name: 'Center', description: '', locationIds: [stationValue] };
  const location: Location = {
    id: stationValue,
    cityId: cityValue,
    districtId: districtValue,
    name: `${name} Station`,
    address: '',
    type: 'train_station',
    description: '',
    availableActionIds: []
  };
  return defineCityContentPack({ city, districts: [district], locations: [location], defaultArrivalLocationId: stationValue });
}

describe('intercity network builders', () => {
  it('creates both scheduled directions from one route-pair definition', () => {
    const routes = createScheduledRoutePair({
      mode: 'train',
      cityA: { id: cityId('alpha'), name: 'Alpha', terminalLocationId: locationId('alpha_station'), departureMinutes: [420] },
      cityB: { id: cityId('beta'), name: 'Beta', terminalLocationId: locationId('beta_station'), departureMinutes: [480] },
      durationMinutes: 120,
      distanceKm: 160,
      fare: 900,
      operatorName: 'Test Rail'
    });

    expect(routes.map((route) => route.id)).toEqual([
      'route_alpha_beta_train',
      'route_beta_alpha_train'
    ]);
    expect(routes.map((route) => route.departureMinutes)).toEqual([[420], [480]]);
  });

  it('indexes several destinations from the same origin without city-specific code', () => {
    const registry = createCityRegistry([
      createCityPack('alpha', 'Alpha'),
      createCityPack('beta', 'Beta'),
      createCityPack('gamma', 'Gamma')
    ]);
    const roads = [
      ...createBidirectionalRoadConnections({ cityAId: cityId('alpha'), cityBId: cityId('beta'), distanceKm: 160, durationMinutes: 120, roadCost: 300 }),
      ...createBidirectionalRoadConnections({ cityAId: cityId('alpha'), cityBId: cityId('gamma'), distanceKm: 260, durationMinutes: 200, roadCost: 500 })
    ];
    const network = createIntercityNetwork({ cityRegistry: registry, routes: [], roadConnections: roads, accommodations: [] });

    expect(network.getRoadConnectionsFromCity(cityId('alpha')).map((entry) => entry.destinationCityId)).toEqual(['beta', 'gamma']);
    expect(network.getRoutesFromCity(cityId('alpha'))).toEqual([]);
    expect(network.getRoadConnection(cityId('gamma'), cityId('alpha'))?.distanceKm).toBe(260);
  });
});
