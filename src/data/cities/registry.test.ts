import { describe, expect, it } from 'vitest';
import type { CityId, CountryId, DistrictId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';
import { createCityRegistry, defineCityContentPack } from './registry';

const cityId = (value: string) => value as CityId;
const countryId = (value: string) => value as CountryId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;

function createPack(index: number) {
  const cityValue = cityId(`city_${index}`);
  const districtValue = districtId(`city_${index}_center`);
  const locationValue = locationId(`city_${index}_station`);
  const city: City = {
    id: cityValue,
    countryId: countryId('test_country'),
    name: `City ${index}`,
    description: 'Test city',
    districtIds: [districtValue]
  };
  const district: District = {
    id: districtValue,
    cityId: cityValue,
    name: 'Center',
    description: 'Test district',
    locationIds: [locationValue]
  };
  const location: Location = {
    id: locationValue,
    cityId: cityValue,
    districtId: districtValue,
    name: 'Station',
    address: 'Test address',
    type: 'train_station',
    description: 'Test location',
    availableActionIds: []
  };

  return defineCityContentPack({
    city,
    districts: [district],
    locations: [location],
    defaultArrivalLocationId: locationValue
  });
}

describe('createCityRegistry', () => {
  it('indexes one hundred city packs without changing the lookup API', () => {
    const registry = createCityRegistry(Array.from({ length: 100 }, (_, index) => createPack(index)));

    expect(registry.cities).toHaveLength(100);
    expect(registry.districts).toHaveLength(100);
    expect(registry.locations).toHaveLength(100);
    expect(registry.getCity(cityId('city_73'))?.name).toBe('City 73');
    expect(registry.getDefaultArrivalLocationId(cityId('city_73'))).toBe('city_73_station');
    expect(registry.getDistrictsForCity(cityId('city_73')).map((district) => district.id)).toEqual(['city_73_center']);
    expect(registry.getLocationsForCity(cityId('city_73')).map((location) => location.id)).toEqual(['city_73_station']);
  });

  it('rejects duplicate city ids before the game starts', () => {
    expect(() => createCityRegistry([createPack(1), createPack(1)])).toThrow('Duplicate city id: city_1');
  });
});
