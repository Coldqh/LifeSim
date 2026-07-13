import type { District } from '../../types/location';
import type { CityId, DistrictId, LocationId } from '../../types/ids';

const cityId = (value: string) => value as CityId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;
const city = cityId('yaroslavl');

export const yaroslavlDistricts: District[] = [
  {
    id: districtId('yar_kirovsky'),
    cityId: city,
    name: 'Кировский',
    description: 'Исторический центр, кафе, торговые точки и основные городские места.',
    locationIds: [
      locationId('yar_kirovsky_volkov_theatre'),
      locationId('yar_kirovsky_kirova_walk'),
      locationId('yar_kirovsky_aura_mall'),
      locationId('yar_kirovsky_baget_cafe'),
      locationId('yar_kirovsky_ibis_hotel')
    ]
  },
  {
    id: districtId('yar_leninsky'),
    cityId: city,
    name: 'Ленинский',
    description: 'Вокзал, стадион, жилые кварталы и повседневная инфраструктура.',
    locationIds: [
      locationId('yar_leninsky_main_station'),
      locationId('yar_leninsky_shinnik_stadium'),
      locationId('yar_leninsky_grocery'),
      locationId('yar_leninsky_pharmacy'),
      locationId('yar_leninsky_hostel')
    ]
  },
  {
    id: districtId('yar_frunzensky'),
    cityId: city,
    name: 'Фрунзенский',
    description: 'Автовокзал, спортивные объекты, недорогая еда и временное жильё.',
    locationIds: [
      locationId('yar_frunzensky_bus_station'),
      locationId('yar_frunzensky_arena_2000'),
      locationId('yar_frunzensky_canteen'),
      locationId('yar_frunzensky_clinic'),
      locationId('yar_frunzensky_daily_apartment')
    ]
  }
];
