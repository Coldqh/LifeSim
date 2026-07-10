import { lifeActions } from '../../data/lifeActions';
import { cities } from '../../data/cities/moscow';
import { moscowDistricts } from '../../data/districts/moscowDistricts';
import { moscowLocations } from '../../data/locations/moscowLocations';
import type { LifeAction } from '../../types/actions';
import type { CityId, DistrictId, JobId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';

export function getCityById(cityId: CityId): City | undefined {
  return cities.find((city) => city.id === cityId);
}

export function getDistrictById(districtId: DistrictId): District | undefined {
  return moscowDistricts.find((district) => district.id === districtId);
}

export function getLocationById(locationId: LocationId | undefined): Location | undefined {
  if (!locationId) return undefined;

  return moscowLocations.find((location) => location.id === locationId);
}

export function getDistrictsForCity(cityId: CityId): District[] {
  return moscowDistricts.filter((district) => district.cityId === cityId);
}

export function getLocationsForDistrict(districtId: DistrictId): Location[] {
  return moscowLocations.filter((location) => location.districtId === districtId);
}

export function getDefaultLocationForDistrict(districtId: DistrictId): Location | undefined {
  return getLocationsForDistrict(districtId).find((location) => !location.hiddenFromCityBrowser);
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
  if (!location) return false;

  return location.availableActionIds.includes(actionId);
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
