import { describe, expect, it } from 'vitest';
import type { CityId, CountryId, DistrictId, JobId, LocationId, ShopId } from '../../types/ids';
import type { Job } from '../../types/job';
import type { City, District, Location } from '../../types/location';
import type { Shop } from '../../types/product';
import { createCityRegistry, defineCityContentPack } from './registry';

const cityId = (value: string) => value as CityId;
const countryId = (value: string) => value as CountryId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;
const jobId = (value: string) => value as JobId;
const shopId = (value: string) => value as ShopId;

function createPack(index: number) {
  const cityValue = cityId(`city_${index}`);
  const districtValue = districtId(`city_${index}_center`);
  const locationValue = locationId(`city_${index}_station`);
  const sharedShopId = shopId('shared_station_shop');
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
    availableActionIds: [],
    shopId: sharedShopId
  };

  return defineCityContentPack({
    city,
    districts: [district],
    locations: [location],
    defaultArrivalLocationId: locationValue,
    content: {
      jobs: [{ id: jobId(`job_${index}`), locationId: locationValue } as Job],
      shops: [{ id: sharedShopId, name: 'Shared shop', description: '', productIds: [] } as Shop],
      transportNodeLocationIds: [locationValue]
    }
  });
}

describe('createCityRegistry', () => {
  it('indexes one hundred complete city packs without changing the location lookup API', () => {
    const registry = createCityRegistry(Array.from({ length: 100 }, (_, index) => createPack(index)));

    expect(registry.cities).toHaveLength(100);
    expect(registry.districts).toHaveLength(100);
    expect(registry.locations).toHaveLength(100);
    expect(registry.content.jobs).toHaveLength(100);
    expect(registry.content.shops.map((shop) => shop.id)).toEqual(['shared_station_shop']);
    expect(registry.getCity(cityId('city_73'))?.name).toBe('City 73');
    expect(registry.getDefaultArrivalLocationId(cityId('city_73'))).toBe('city_73_station');
    expect(registry.getDistrictsForCity(cityId('city_73')).map((district) => district.id)).toEqual(['city_73_center']);
    expect(registry.getLocationsForCity(cityId('city_73')).map((location) => location.id)).toEqual(['city_73_station']);
    expect(registry.getContentForCity(cityId('city_73'))?.jobs.map((job) => job.id)).toEqual(['job_73']);
    expect(registry.getCompletenessForCity(cityId('city_73'))).toMatchObject({
      counts: { jobs: 1, shops: 1, transport: 1 },
      availableCategories: ['jobs', 'shops', 'transport']
    });
  });

  it('keeps old city packs valid by filling empty content arrays', () => {
    const pack = createPack(1);
    const legacyShape = defineCityContentPack({
      city: pack.city,
      districts: pack.districts,
      locations: pack.locations.map((location) => ({ ...location, shopId: undefined })),
      defaultArrivalLocationId: pack.defaultArrivalLocationId
    });

    expect(legacyShape.content.jobs).toEqual([]);
    expect(legacyShape.content.transportNodeLocationIds).toEqual([]);
  });

  it('rejects duplicate city ids before the game starts', () => {
    expect(() => createCityRegistry([createPack(1), createPack(1)])).toThrow('Duplicate city id: city_1');
  });

  it('rejects city content that points to another city location', () => {
    const pack = createPack(1);
    const broken = defineCityContentPack({
      ...pack,
      content: {
        ...pack.content,
        transportNodeLocationIds: [locationId('foreign_station')]
      }
    });

    expect(() => createCityRegistry([broken])).toThrow('transport node points outside its city pack');
  });
});
