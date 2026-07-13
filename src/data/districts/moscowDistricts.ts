import type { District } from '../../types/location';
import type { CityId, DistrictId, LocationId } from '../../types/ids';

function cityId(value: string): CityId {
  return value as CityId;
}

function districtId(value: string): DistrictId {
  return value as DistrictId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}

const moscow = cityId('moscow');

export const moscowDistricts: District[] = [
  {
    id: districtId('msk_danilovsky'),
    cityId: moscow,
    name: 'Даниловский',
    description: 'Стартовый бытовой район: дом, магазин, кафе у метро.',
    locationIds: [
      locationId('msk_danilovsky_home'),
      locationId('msk_danilovsky_home_bed'),
      locationId('msk_danilovsky_home_studio'),
      locationId('msk_danilovsky_home_flat'),
      locationId('msk_danilovsky_grocery'),
      locationId('msk_danilovsky_metro_cafe'),
      locationId('msk_danilovsky_misis')
    ]
  },
  {
    id: districtId('msk_presnya'),
    cityId: moscow,
    name: 'Пресня',
    description: 'Офисы, бизнес-центры и короткие рабочие возможности.',
    locationIds: [
      locationId('msk_presnya_home_room'),
      locationId('msk_presnya_home_studio'),
      locationId('msk_presnya_home_flat'),
      locationId('msk_presnya_home_premium'),
      locationId('msk_presnya_part_time_office'),
      locationId('msk_presnya_business_center'),
      locationId('msk_presnya_coffee_spot')
    ]
  },
  {
    id: districtId('msk_tverskoy'),
    cityId: moscow,
    name: 'Тверской',
    description: 'Центр, кафе и прогулочные места.',
    locationIds: [
      locationId('msk_tverskoy_home_room'),
      locationId('msk_tverskoy_home_studio'),
      locationId('msk_tverskoy_home_flat'),
      locationId('msk_tverskoy_home_premium'),
      locationId('msk_tverskoy_central_cafe'),
      locationId('msk_tverskoy_walking_zone'),
      locationId('msk_tverskoy_yaroslavsky_station'),
      locationId('msk_tverskoy_central_bus_station'),
      locationId('msk_tverskoy_hse')
    ]
  },
  {
    id: districtId('msk_khamovniki'),
    cityId: moscow,
    name: 'Хамовники',
    description: 'Парк и простая спортивная активность.',
    locationIds: [
      locationId('msk_khamovniki_home_room'),
      locationId('msk_khamovniki_home_old_flat'),
      locationId('msk_khamovniki_home_studio'),
      locationId('msk_khamovniki_home_premium'),
      locationId('msk_khamovniki_sports_ground'),
      locationId('msk_khamovniki_park')
    ]
  }
];
