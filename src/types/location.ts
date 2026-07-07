import type { ActionId, CityId, CountryId, DistrictId, LocationId, ShopId } from './ids';

export type City = {
  id: CityId;
  countryId: CountryId;
  name: string;
  description: string;
  districtIds: DistrictId[];
};

export type District = {
  id: DistrictId;
  cityId: CityId;
  name: string;
  description: string;
  locationIds: LocationId[];
};

export type LocationType =
  | 'home'
  | 'shop'
  | 'cafe'
  | 'workplace'
  | 'business_center'
  | 'park'
  | 'sport_ground'
  | 'service'
  | 'other';

export type Location = {
  id: LocationId;
  cityId: CityId;
  districtId: DistrictId;
  name: string;
  type: LocationType;
  description: string;
  availableActionIds: ActionId[];
  shopId?: ShopId;
};
