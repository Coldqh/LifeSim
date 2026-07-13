import type { City } from '../../types/location';
import type { CityId, CountryId, DistrictId } from '../../types/ids';

const cityId = (value: string) => value as CityId;
const countryId = (value: string) => value as CountryId;
const districtId = (value: string) => value as DistrictId;

export const yaroslavlCity: City = {
  id: cityId('yaroslavl'),
  countryId: countryId('russia'),
  name: 'Ярославль',
  description: 'Региональный город с более дешёвой жизнью, локальной работой и собственным ритмом.',
  districtIds: [
    districtId('yar_kirovsky'),
    districtId('yar_leninsky'),
    districtId('yar_frunzensky')
  ]
};
