import { lifeActions } from '../../data/lifeActions';
import { allCities } from '../../data/cities';
import { allDistricts } from '../../data/districts';
import { allLocations } from '../../data/locations';
import type { LifeAction } from '../../types/actions';
import type { CityId, DistrictId, JobId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';

export function getCityById(cityId: CityId): City | undefined {
  return allCities.find((city) => city.id === cityId);
}

export function getDistrictById(districtId: DistrictId): District | undefined {
  return allDistricts.find((district) => district.id === districtId);
}

export function getLocationById(locationId: LocationId | undefined): Location | undefined {
  if (!locationId) return undefined;
  return allLocations.find((location) => location.id === locationId);
}

export function getDistrictsForCity(cityId: CityId): District[] {
  return allDistricts.filter((district) => district.cityId === cityId);
}

export function getLocationsForDistrict(districtId: DistrictId): Location[] {
  return allLocations.filter((location) => location.districtId === districtId);
}

export function getLocationsForCity(cityId: CityId): Location[] {
  return allLocations.filter((location) => location.cityId === cityId);
}

export function getDefaultLocationForDistrict(districtId: DistrictId): Location | undefined {
  return getLocationsForDistrict(districtId).find((location) => !location.hiddenFromCityBrowser);
}

export function getDefaultLocationForCity(cityId: CityId): Location | undefined {
  return getLocationsForCity(cityId).find((location) => ['train_station', 'bus_station'].includes(location.type))
    ?? getLocationsForCity(cityId).find((location) => !location.hiddenFromCityBrowser);
}

export function getJobIdsForLocation(locationId: LocationId | undefined): JobId[] {
  return getLocationById(locationId)?.jobIds ?? [];
}

export function getActionsForLocation(locationId: LocationId | undefined): LifeAction[] {
  const location = getLocationById(locationId);
  if (!location) return [];
  return location.availableActionIds
    .map((actionId) => lifeActions.find((action) => action.id === actionId))
    .filter((action): action is LifeAction => Boolean(action));
}

export function isActionAvailableAtLocation(locationId: LocationId | undefined, actionId: LifeAction['id']): boolean {
  const location = getLocationById(locationId);
  return Boolean(location?.availableActionIds.includes(actionId));
}

export function getCityDistrictAndLocation(input: {
  cityId: CityId;
  districtId: DistrictId;
  locationId?: LocationId;
}): { city?: City; district?: District; location?: Location } {
  return {
    city: getCityById(input.cityId),
    district: getDistrictById(input.districtId),
    location: getLocationById(input.locationId)
  };
}
