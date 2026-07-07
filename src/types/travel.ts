import type { DistrictId, LocationId } from './ids';
import type { District, Location } from './location';
import type { NeedsState } from './needs';
import type { TravelModeId } from './transport';

export type TravelKind = 'location' | 'district';

export type TransportOption = {
  modeId: TravelModeId;
  name: string;
  description: string;
  durationMinutes: number;
  moneyCost: number;
  needsDelta?: Partial<NeedsState>;
  available: boolean;
  unavailableReason?: string;
};

export type TravelResult = {
  ok: boolean;
  kind: TravelKind;
  modeId?: TravelModeId;
  modeName?: string;
  durationMinutes: number;
  moneyCost?: number;
  needsDelta?: Partial<NeedsState>;
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
  transportOptions: TransportOption[];
};

export type DistrictTravelOption = {
  district: District;
  defaultLocation?: Location;
  durationMinutes: number;
  isCurrent: boolean;
  transportOptions: TransportOption[];
};
