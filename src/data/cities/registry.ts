import type { CityId, DistrictId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';

export type CityContentPack = {
  city: City;
  districts: readonly District[];
  locations: readonly Location[];
  defaultArrivalLocationId: LocationId;
};

export type CityRegistry = {
  packs: readonly CityContentPack[];
  cities: readonly City[];
  districts: readonly District[];
  locations: readonly Location[];
  getPack: (cityId: CityId) => CityContentPack | undefined;
  getCity: (cityId: CityId) => City | undefined;
  getDistrict: (districtId: DistrictId) => District | undefined;
  getLocation: (locationId: LocationId | undefined) => Location | undefined;
  getDefaultArrivalLocationId: (cityId: CityId) => LocationId | undefined;
  getDistrictsForCity: (cityId: CityId) => District[];
  getLocationsForCity: (cityId: CityId) => Location[];
  getLocationsForDistrict: (districtId: DistrictId) => Location[];
};

export function defineCityContentPack(pack: CityContentPack): CityContentPack {
  return pack;
}

function assertUnique<T>(items: readonly T[], getId: (item: T) => string, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    const id = getId(item);
    if (seen.has(id)) throw new Error(`Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
}

export function createCityRegistry(packs: readonly CityContentPack[]): CityRegistry {
  assertUnique(packs, (pack) => String(pack.city.id), 'city');

  const cities = packs.map((pack) => pack.city);
  const districts = packs.flatMap((pack) => [...pack.districts]);
  const locations = packs.flatMap((pack) => [...pack.locations]);

  assertUnique(districts, (district) => String(district.id), 'district');
  assertUnique(locations, (location) => String(location.id), 'location');

  const packByCityId = new Map(packs.map((pack) => [pack.city.id, pack]));
  const cityById = new Map(cities.map((city) => [city.id, city]));
  const districtById = new Map(districts.map((district) => [district.id, district]));
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const districtsByCityId = new Map(packs.map((pack) => [pack.city.id, [...pack.districts]]));
  const locationsByCityId = new Map(packs.map((pack) => [pack.city.id, [...pack.locations]]));
  const locationsByDistrictId = new Map(districts.map((district) => [
    district.id,
    locations.filter((location) => location.districtId === district.id)
  ]));

  for (const pack of packs) {
    const cityDistrictIds = new Set(pack.city.districtIds.map(String));
    const packDistrictIds = new Set(pack.districts.map((district) => String(district.id)));

    if (cityDistrictIds.size !== packDistrictIds.size || [...cityDistrictIds].some((id) => !packDistrictIds.has(id))) {
      throw new Error(`City ${String(pack.city.id)} districtIds do not match its city pack.`);
    }

    for (const district of pack.districts) {
      if (district.cityId !== pack.city.id) {
        throw new Error(`District ${String(district.id)} belongs to another city.`);
      }

      for (const locationId of district.locationIds) {
        const location = locationById.get(locationId);
        if (!location || location.cityId !== pack.city.id || location.districtId !== district.id) {
          throw new Error(`District ${String(district.id)} points to an invalid location ${String(locationId)}.`);
        }
      }
    }

    for (const location of pack.locations) {
      if (location.cityId !== pack.city.id) {
        throw new Error(`Location ${String(location.id)} belongs to another city.`);
      }
      if (!packDistrictIds.has(String(location.districtId))) {
        throw new Error(`Location ${String(location.id)} points to a district outside its city pack.`);
      }
    }

    const arrivalLocation = locationById.get(pack.defaultArrivalLocationId);
    if (!arrivalLocation || arrivalLocation.cityId !== pack.city.id) {
      throw new Error(`City ${String(pack.city.id)} has an invalid default arrival location.`);
    }
  }

  return {
    packs: [...packs],
    cities,
    districts,
    locations,
    getPack: (cityId) => packByCityId.get(cityId),
    getCity: (cityId) => cityById.get(cityId),
    getDistrict: (districtId) => districtById.get(districtId),
    getLocation: (locationId) => locationId ? locationById.get(locationId) : undefined,
    getDefaultArrivalLocationId: (cityId) => packByCityId.get(cityId)?.defaultArrivalLocationId,
    getDistrictsForCity: (cityId) => [...(districtsByCityId.get(cityId) ?? [])],
    getLocationsForCity: (cityId) => [...(locationsByCityId.get(cityId) ?? [])],
    getLocationsForDistrict: (districtId) => [...(locationsByDistrictId.get(districtId) ?? [])]
  };
}
