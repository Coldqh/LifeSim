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
      locationId('msk_danilovsky_grocery'),
      locationId('msk_danilovsky_metro_cafe')
    ]
  },
  {
    id: districtId('msk_presnya'),
    cityId: moscow,
    name: 'Пресня',
    description: 'Офисы, бизнес-центры и короткие рабочие возможности.',
    locationIds: [
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
    locationIds: [locationId('msk_tverskoy_central_cafe'), locationId('msk_tverskoy_walking_zone')]
  },
  {
    id: districtId('msk_khamovniki'),
    cityId: moscow,
    name: 'Хамовники',
    description: 'Парк и простая спортивная активность.',
    locationIds: [locationId('msk_khamovniki_sports_ground'), locationId('msk_khamovniki_park')]
  }
];
