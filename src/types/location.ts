import type { CityId, CountryId, DistrictId, LocationId } from './ids';

export type City = {
  id: CityId;
  countryId: CountryId;
  name: string;
};

export type District = {
  id: DistrictId;
  cityId: CityId;
  name: string;
};

export type LocationType =
  | 'home'
  | 'shop'
  | 'workplace'
  | 'education'
  | 'sport'
  | 'transport'
  | 'service'
  | 'other';

export type Location = {
  id: LocationId;
  cityId: CityId;
  districtId: DistrictId;
  name: string;
  type: LocationType;
};
