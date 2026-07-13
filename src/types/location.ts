import type { ActionId, CityId, CountryId, DistrictId, JobId, LocationId, ShopId } from './ids';
import type { WeeklySchedule } from './schedule';

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
  | 'warehouse'
  | 'fitness'
  | 'coworking'
  | 'clinic'
  | 'pharmacy'
  | 'restaurant'
  | 'food_court'
  | 'pickup_point'
  | 'mall'
  | 'electronics_store'
  | 'clothing_store'
  | 'bank'
  | 'education_center'
  | 'sports_store'
  | 'boxing_gym'
  | 'pool'
  | 'car_dealer'
  | 'gas_station'
  | 'service_center'
  | 'auto_market'
  | 'other';

export type Location = {
  id: LocationId;
  cityId: CityId;
  districtId: DistrictId;
  name: string;
  address: string;
  type: LocationType;
  description: string;
  availableActionIds: ActionId[];
  shopId?: ShopId;
  jobIds?: JobId[];
  openingHours?: WeeklySchedule;
  hiddenFromCityBrowser?: boolean;
};
