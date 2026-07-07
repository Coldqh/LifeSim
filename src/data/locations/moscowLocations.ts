import type { Location } from '../../types/location';
import type { ActionId, CityId, DistrictId, JobId, LocationId, ShopId } from '../../types/ids';

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

function shopId(value: string): ShopId {
  return value as ShopId;
}

function jobId(value: string): JobId {
  return value as JobId;
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
    description: 'Простой магазин для базовой еды и воды.',
    availableActionIds: [],
    shopId: shopId('shop_local_grocery'),
    jobIds: [jobId('job_grocery_assistant')]
  },
  {
    id: locationId('msk_danilovsky_metro_cafe'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Кафе у метро',
    type: 'cafe',
    description: 'Быстрое кафе рядом с районом старта.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot'),
    jobIds: [jobId('job_barista_trainee')]
  },
  {
    id: locationId('msk_danilovsky_hair_salon'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Парикмахерская',
    type: 'service',
    description: 'Локальный сервисный салон.',
    availableActionIds: [],
    jobIds: [jobId('job_salon_administrator')]
  },
  {
    id: locationId('msk_danilovsky_small_warehouse'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Небольшой склад',
    type: 'warehouse',
    description: 'Складская точка района.',
    availableActionIds: [],
    jobIds: [jobId('job_warehouse_helper')]
  },
  {
    id: locationId('msk_danilovsky_fitness_hall'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Фитнес-зал',
    type: 'fitness',
    description: 'Районный зал.',
    availableActionIds: [actionId('light_training')],
    jobIds: [jobId('job_fitness_assistant')]
  },
  {
    id: locationId('msk_presnya_part_time_office'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Офисная подработка',
    type: 'workplace',
    description: 'Офисное рабочее место.',
    availableActionIds: [],
    jobIds: [jobId('job_office_part_time_assistant')]
  },
  {
    id: locationId('msk_presnya_business_center'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Бизнес-центр',
    type: 'business_center',
    description: 'Деловое место района.',
    availableActionIds: [actionId('walk_one_hour')],
    jobIds: [jobId('job_business_center_helper')]
  },
  {
    id: locationId('msk_presnya_coffee_spot'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Кофейня',
    type: 'cafe',
    description: 'Небольшая кофейня для короткой паузы.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot'),
    jobIds: [jobId('job_barista_business_cafe')]
  },
  {
    id: locationId('msk_presnya_phone_shop'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Салон связи',
    type: 'service',
    description: 'Сервисная точка с продажами.',
    availableActionIds: [],
    jobIds: [jobId('job_phone_shop_consultant')]
  },
  {
    id: locationId('msk_presnya_business_cafe'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Кофейня в БЦ',
    type: 'cafe',
    description: 'Кофейня рядом с офисами.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot')
  },
  {
    id: locationId('msk_presnya_coworking'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Коворкинг',
    type: 'coworking',
    description: 'Рабочая точка для фриланса и офисных задач.',
    availableActionIds: [],
    jobIds: [jobId('job_coworking_assistant')]
  },
  {
    id: locationId('msk_tverskoy_central_cafe'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Кафе в центре',
    type: 'cafe',
    description: 'Центральное кафе.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot')
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
    id: locationId('msk_tverskoy_bookstore'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Книжный магазин',
    type: 'shop',
    description: 'Магазин в центре.',
    availableActionIds: [],
    jobIds: [jobId('job_bookstore_assistant')]
  },
  {
    id: locationId('msk_tverskoy_barbershop'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Барбершоп',
    type: 'service',
    description: 'Сервисное место в центре.',
    availableActionIds: [],
    jobIds: [jobId('job_salon_administrator')]
  },
  {
    id: locationId('msk_tverskoy_clothing_store'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Магазин одежды',
    type: 'shop',
    description: 'Торговая точка в центре.',
    availableActionIds: []
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
  },
  {
    id: locationId('msk_khamovniki_fitness_club'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Спортзал',
    type: 'fitness',
    description: 'Фитнес-локация района.',
    availableActionIds: [actionId('light_training')],
    jobIds: [jobId('job_fitness_assistant')]
  },
  {
    id: locationId('msk_khamovniki_park_cafe'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Кафе у парка',
    type: 'cafe',
    description: 'Кафе рядом с прогулочной зоной.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot')
  },
  {
    id: locationId('msk_khamovniki_medical_center'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Медицинский центр',
    type: 'clinic',
    description: 'Медицинская точка района.',
    availableActionIds: []
  }
];
