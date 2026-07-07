import type { DistrictId, LocationId } from './ids';
import type { District, Location } from './location';

export type TravelKind = 'location' | 'district';

export type TravelResult = {
  ok: boolean;
  kind: TravelKind;
  durationMinutes: number;
  fromLocationId?: LocationId;
  toLocationId?: LocationId;
  fromDistrictId?: DistrictId;
  toDistrictId?: DistrictId;
  message: string;
};

export type LocationTravelOption = {
  location: Location;
  durationMinutes: number;
  isCurrent: boolean;
};

export type DistrictTravelOption = {
  district: District;
  defaultLocation?: Location;
  durationMinutes: number;
  isCurrent: boolean;
};
