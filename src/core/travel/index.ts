import type { District, Location } from '../../types/location';
import type { DistrictTravelOption, LocationTravelOption, TravelResult } from '../../types/travel';

const SAME_LOCATION_DURATION_MINUTES = 0;
const SAME_DISTRICT_FALLBACK_MINUTES = 20;
const CROSS_DISTRICT_DURATION_MINUTES = 45;

function getSameDistrictDuration(fromLocation: Location, toLocation: Location): number {
  if (fromLocation.id === toLocation.id) return SAME_LOCATION_DURATION_MINUTES;

  const pairKey = [fromLocation.type, toLocation.type].sort().join(':');

  const pairDurations: Record<string, number> = {
    'home:shop': 15,
    'cafe:home': 20,
    'cafe:shop': 10,
    'business_center:workplace': 12,
    'park:sport_ground': 18
  };

  if (pairDurations[pairKey] !== undefined) {
    return pairDurations[pairKey];
  }

  if (fromLocation.type === 'park' || toLocation.type === 'park') return 25;
  if (fromLocation.type === 'sport_ground' || toLocation.type === 'sport_ground') return 25;
  if (fromLocation.type === 'workplace' || toLocation.type === 'workplace') return 18;
  if (fromLocation.type === 'business_center' || toLocation.type === 'business_center') return 18;

  return SAME_DISTRICT_FALLBACK_MINUTES;
}

export function getTravelDurationMinutes(fromLocation: Location, toLocation: Location): number {
  if (fromLocation.id === toLocation.id) return SAME_LOCATION_DURATION_MINUTES;

  if (fromLocation.districtId !== toLocation.districtId) {
    return CROSS_DISTRICT_DURATION_MINUTES;
  }

  return getSameDistrictDuration(fromLocation, toLocation);
}

export function calculateLocationTravel(fromLocation: Location | undefined, toLocation: Location | undefined): TravelResult {
  if (!fromLocation || !toLocation) {
    return {
      ok: false,
      kind: 'location',
      durationMinutes: 0,
      message: 'Маршрут не найден.'
    };
  }

  if (fromLocation.id === toLocation.id) {
    return {
      ok: false,
      kind: 'location',
      durationMinutes: 0,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toLocation.districtId,
      message: 'Ты уже находишься в этом месте.'
    };
  }

  const durationMinutes = getTravelDurationMinutes(fromLocation, toLocation);

  return {
    ok: true,
    kind: 'location',
    durationMinutes,
    fromLocationId: fromLocation.id,
    toLocationId: toLocation.id,
    fromDistrictId: fromLocation.districtId,
    toDistrictId: toLocation.districtId,
    message: `Ты дошёл до места «${toLocation.name}». Потрачено ${durationMinutes} мин.`
  };
}

export function calculateDistrictTravel(input: {
  fromLocation: Location | undefined;
  toDistrict: District | undefined;
  toLocation: Location | undefined;
}): TravelResult {
  const { fromLocation, toDistrict, toLocation } = input;

  if (!fromLocation || !toDistrict || !toLocation) {
    return {
      ok: false,
      kind: 'district',
      durationMinutes: 0,
      message: 'Район или точка прибытия не найдены.'
    };
  }

  if (fromLocation.districtId === toDistrict.id) {
    return {
      ok: false,
      kind: 'district',
      durationMinutes: 0,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toDistrict.id,
      message: 'Ты уже находишься в этом районе.'
    };
  }

  const durationMinutes = getTravelDurationMinutes(fromLocation, toLocation);

  return {
    ok: true,
    kind: 'district',
    durationMinutes,
    fromLocationId: fromLocation.id,
    toLocationId: toLocation.id,
    fromDistrictId: fromLocation.districtId,
    toDistrictId: toDistrict.id,
    message: `Ты приехал в район «${toDistrict.name}» и оказался в месте «${toLocation.name}». Потрачено ${durationMinutes} мин.`
  };
}

export function createLocationTravelOptions(
  currentLocation: Location | undefined,
  locations: Location[]
): LocationTravelOption[] {
  return locations.map((location) => ({
    location,
    durationMinutes: currentLocation ? getTravelDurationMinutes(currentLocation, location) : 0,
    isCurrent: currentLocation?.id === location.id
  }));
}

export function createDistrictTravelOption(input: {
  currentLocation: Location | undefined;
  district: District;
  defaultLocation?: Location;
}): DistrictTravelOption {
  const { currentLocation, district, defaultLocation } = input;

  return {
    district,
    defaultLocation,
    durationMinutes: currentLocation && defaultLocation ? getTravelDurationMinutes(currentLocation, defaultLocation) : 0,
    isCurrent: currentLocation?.districtId === district.id
  };
}
