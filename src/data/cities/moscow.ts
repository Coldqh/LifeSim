import type { City } from '../../types/location';
import type { CityId, CountryId, DistrictId } from '../../types/ids';

function cityId(value: string): CityId {
  return value as CityId;
}

function countryId(value: string): CountryId {
  return value as CountryId;
}

function districtId(value: string): DistrictId {
  return value as DistrictId;
}

export const moscowCity: City = {
  id: cityId('moscow'),
  countryId: countryId('russia'),
  name: 'Москва',
  description: 'Стартовый город MVP. Пока только районы, места и привязанные действия.',
  districtIds: [
    districtId('msk_danilovsky'),
    districtId('msk_presnya'),
    districtId('msk_tverskoy'),
    districtId('msk_khamovniki')
  ]
};

export const cities: City[] = [moscowCity];
