import type { Location } from '../../types/location';
import type { ActionId, CityId, DistrictId, LocationId } from '../../types/ids';

function actionId(value: string): ActionId {
  return value as ActionId;
}

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

export const moscowLocations: Location[] = [
  {
    id: locationId('msk_danilovsky_home'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Дом',
    type: 'home',
    description: 'Стартовая точка. Здесь можно спать и восстанавливаться.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')]
  },
  {
    id: locationId('msk_danilovsky_grocery'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Магазин у дома',
    type: 'shop',
    description: 'Простой магазин для базовой еды и воды. Без инвентаря в этом патче.',
    availableActionIds: [actionId('buy_simple_food'), actionId('buy_water')]
  },
  {
    id: locationId('msk_danilovsky_metro_cafe'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Кафе у метро',
    type: 'cafe',
    description: 'Быстрое кафе рядом с районом старта.',
    availableActionIds: [actionId('eat_at_cafe'), actionId('drink_coffee')]
  },
  {
    id: locationId('msk_presnya_part_time_office'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Офисная подработка',
    type: 'workplace',
    description: 'Место для короткой смены. Это ещё не полноценная job-система.',
    availableActionIds: [actionId('part_time_shift_4h')]
  },
  {
    id: locationId('msk_presnya_business_center'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Бизнес-центр',
    type: 'business_center',
    description: 'Пока только городская точка без отдельной бизнес-системы.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_presnya_coffee_spot'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Кофейня',
    type: 'cafe',
    description: 'Небольшая кофейня для короткой паузы.',
    availableActionIds: [actionId('drink_coffee'), actionId('eat_at_cafe')]
  },
  {
    id: locationId('msk_tverskoy_central_cafe'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Кафе в центре',
    type: 'cafe',
    description: 'Центральное кафе. Дороже магазина, но поднимает настроение.',
    availableActionIds: [actionId('eat_at_cafe'), actionId('drink_coffee')]
  },
  {
    id: locationId('msk_tverskoy_walking_zone'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Прогулочная зона',
    type: 'park',
    description: 'Место для простой прогулки по центру.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_khamovniki_sports_ground'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Спортплощадка',
    type: 'sport_ground',
    description: 'Пока без спорт-системы. Только базовая тренировка.',
    availableActionIds: [actionId('light_training')]
  },
  {
    id: locationId('msk_khamovniki_park'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Парк',
    type: 'park',
    description: 'Точка для прогулки и восстановления настроения.',
    availableActionIds: [actionId('walk_one_hour')]
  }
];
