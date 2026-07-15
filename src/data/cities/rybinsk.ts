import type { CityId, CountryId, DistrictId } from '../../types/ids';
import type { City } from '../../types/location';

const cityId = (value: string) => value as CityId;
const countryId = (value: string) => value as CountryId;
const districtId = (value: string) => value as DistrictId;

export const RYBINSK_DISTRICT_IDS = {
  center: districtId('ryb_center'),
  severny: districtId('ryb_severny'),
  perebory: districtId('ryb_perebory')
} as const;

export const rybinskCity: City = {
  id: cityId('rybinsk'),
  countryId: countryId('russia'),
  name: 'Рыбинск',
  description: 'Промышленный город на Волге с более доступным жильём, инженерными предприятиями и спокойным ритмом жизни.',
  districtIds: Object.values(RYBINSK_DISTRICT_IDS)
};
