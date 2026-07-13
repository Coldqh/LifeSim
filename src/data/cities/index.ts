import type { LocationId } from '../../types/ids';
import { moscowDistricts } from '../districts/moscowDistricts';
import { yaroslavlDistricts } from '../districts/yaroslavlDistricts';
import { moscowLocations } from '../locations/moscowLocations';
import { yaroslavlLocations } from '../locations/yaroslavlLocations';
import { moscowCity } from './moscow';
import { createCityRegistry, defineCityContentPack } from './registry';
import { yaroslavlCity } from './yaroslavl';

export { moscowCity, yaroslavlCity };
export * from './registry';

export const cityRegistry = createCityRegistry([
  defineCityContentPack({
    city: moscowCity,
    districts: moscowDistricts,
    locations: moscowLocations,
    defaultArrivalLocationId: 'msk_tverskoy_yaroslavsky_station' as LocationId
  }),
  defineCityContentPack({
    city: yaroslavlCity,
    districts: yaroslavlDistricts,
    locations: yaroslavlLocations,
    defaultArrivalLocationId: 'yar_leninsky_main_station' as LocationId
  })
]);

export const allCities = [...cityRegistry.cities];
