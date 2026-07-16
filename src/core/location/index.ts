import { lifeActions } from '../../data/lifeActions';
import { getDefaultActionIdsForLocationType } from '../../data/locations/defaultLocationActions';
import { cityRegistry } from '../../data/cities';
import type { LifeAction } from '../../types/actions';
import type { CityId, DistrictId, JobId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';

export function getCityById(cityId: CityId): City | undefined {
  return cityRegistry.getCity(cityId);
}

export function getDistrictById(districtId: DistrictId): District | undefined {
  return cityRegistry.getDistrict(districtId);
}

export function getLocationById(locationId: LocationId | undefined): Location | undefined {
  return cityRegistry.getLocation(locationId);
}

export function getDistrictsForCity(cityId: CityId): District[] {
  return cityRegistry.getDistrictsForCity(cityId);
}

export function getLocationsForDistrict(districtId: DistrictId): Location[] {
  return cityRegistry.getLocationsForDistrict(districtId);
}

export function getLocationsForCity(cityId: CityId): Location[] {
  return cityRegistry.getLocationsForCity(cityId);
}

export function getDefaultLocationForDistrict(districtId: DistrictId): Location | undefined {
  return getLocationsForDistrict(districtId).find((location) => !location.hiddenFromCityBrowser);
}

export function getDefaultLocationForCity(cityId: CityId): Location | undefined {
  return getLocationsForCity(cityId).find((location) => ['train_station', 'bus_station'].includes(location.type))
    ?? getLocationsForCity(cityId).find((location) => !location.hiddenFromCityBrowser);
}

export function getDefaultArrivalLocationForCity(cityId: CityId): Location | undefined {
  return getLocationById(cityRegistry.getDefaultArrivalLocationId(cityId));
}

export function getJobIdsForLocation(locationId: LocationId | undefined): JobId[] {
  return getLocationById(locationId)?.jobIds ?? [];
}

function getActionIdsForLocation(location: Location): LifeAction['id'][] {
  return [...new Set([
    ...location.availableActionIds,
    ...getDefaultActionIdsForLocationType(location.type)
  ])];
}

export function getActionsForLocation(locationId: LocationId | undefined): LifeAction[] {
  const location = getLocationById(locationId);
  if (!location) return [];
  return getActionIdsForLocation(location)
    .map((actionId) => lifeActions.find((action) => action.id === actionId))
    .filter((action): action is LifeAction => Boolean(action));
}

export function isActionAvailableAtLocation(locationId: LocationId | undefined, actionId: LifeAction['id']): boolean {
  const location = getLocationById(locationId);
  return Boolean(location && getActionIdsForLocation(location).includes(actionId));
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
