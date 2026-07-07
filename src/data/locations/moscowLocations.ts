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
  },

  {
    id: locationId('msk_danilovsky_pharmacy'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Аптека у дома',
    type: 'pharmacy',
    description: 'Районная аптека для базовых лекарств и бытовых мелочей.',
    availableActionIds: [],
    shopId: shopId('shop_pharmacy'),
    jobIds: [jobId('job_pharmacy_counter_assistant')]
  },
  {
    id: locationId('msk_danilovsky_canteen'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Недорогая столовая',
    type: 'restaurant',
    description: 'Простая точка с плотной едой без лишней наценки.',
    availableActionIds: [],
    shopId: shopId('shop_canteen'),
    jobIds: [jobId('job_canteen_cashier')]
  },
  {
    id: locationId('msk_danilovsky_pickup_point'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Пункт выдачи',
    type: 'pickup_point',
    description: 'Точка выдачи заказов с простой районной подработкой.',
    availableActionIds: [],
    jobIds: [jobId('job_pickup_point_operator')]
  },
  {
    id: locationId('msk_danilovsky_small_mall'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Районный ТЦ',
    type: 'mall',
    description: 'Небольшой торговый центр рядом с бытовыми сервисами.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_danilovsky_sport_goods'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Магазин спорттоваров',
    type: 'sports_store',
    description: 'Место для базового спортивного питания и расходников.',
    availableActionIds: [],
    shopId: shopId('shop_sport_goods')
  },
  {
    id: locationId('msk_presnya_electronics_store'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Магазин техники',
    type: 'electronics_store',
    description: 'Точка продаж техники и аксессуаров в деловом районе.',
    availableActionIds: [],
    jobIds: [jobId('job_electronics_store_assistant')]
  },
  {
    id: locationId('msk_presnya_food_court'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Фудкорт',
    type: 'food_court',
    description: 'Быстрая еда рядом с офисными потоками.',
    availableActionIds: [],
    shopId: shopId('shop_food_court'),
    jobIds: [jobId('job_food_court_cashier')]
  },
  {
    id: locationId('msk_presnya_bank'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Банк',
    type: 'bank',
    description: 'Офис обслуживания в деловом районе.',
    availableActionIds: [],
    jobIds: [jobId('job_bank_lobby_assistant')]
  },
  {
    id: locationId('msk_presnya_small_office'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Небольшой офис',
    type: 'workplace',
    description: 'Малый офис с рутинными задачами и стабильными сменами.',
    availableActionIds: [],
    jobIds: [jobId('job_small_office_clerk')]
  },
  {
    id: locationId('msk_presnya_clothing_store'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Магазин одежды',
    type: 'clothing_store',
    description: 'Торговая точка с базовой работой в зале.',
    availableActionIds: [],
    jobIds: [jobId('job_clothing_store_assistant')]
  },
  {
    id: locationId('msk_tverskoy_restaurant'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Ресторан в центре',
    type: 'restaurant',
    description: 'Центральная точка общепита с высокой нагрузкой.',
    availableActionIds: [],
    shopId: shopId('shop_food_court'),
    jobIds: [jobId('job_restaurant_runner')]
  },
  {
    id: locationId('msk_tverskoy_premium_coffee'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Премиальная кофейня',
    type: 'cafe',
    description: 'Дорогая кофейня в центре с плотным потоком гостей.',
    availableActionIds: [],
    shopId: shopId('shop_premium_coffee')
  },
  {
    id: locationId('msk_tverskoy_education_center'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Образовательный центр',
    type: 'education_center',
    description: 'Будущая точка для обучения и курсов.',
    availableActionIds: []
  },
  {
    id: locationId('msk_tverskoy_night_store'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Ночной магазин',
    type: 'shop',
    description: 'Магазин с поздним потоком и простой работой.',
    availableActionIds: [],
    shopId: shopId('shop_local_grocery'),
    jobIds: [jobId('job_night_store_cashier')]
  },
  {
    id: locationId('msk_tverskoy_gallery'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Торговая галерея',
    type: 'mall',
    description: 'Центральная торговая зона с магазинами и услугами.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_khamovniki_pharmacy'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Аптека у парка',
    type: 'pharmacy',
    description: 'Аптека рядом со спортивными и прогулочными местами.',
    availableActionIds: [],
    shopId: shopId('shop_pharmacy')
  },
  {
    id: locationId('msk_khamovniki_pool'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Бассейн',
    type: 'pool',
    description: 'Спортивная точка без отдельной системы плавания пока.',
    availableActionIds: [],
    jobIds: [jobId('job_pool_attendant')]
  },
  {
    id: locationId('msk_khamovniki_boxing_gym'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Боксёрский зал',
    type: 'boxing_gym',
    description: 'Будущая точка для боксёрской системы. Пока доступна лёгкая тренировка.',
    availableActionIds: [actionId('light_training')]
  },
  {
    id: locationId('msk_khamovniki_sport_goods'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Спортивный магазин',
    type: 'sports_store',
    description: 'Спортивное питание и базовые расходники.',
    availableActionIds: [],
    shopId: shopId('shop_sport_goods')
  },
  {
    id: locationId('msk_khamovniki_canteen'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Столовая у парка',
    type: 'restaurant',
    description: 'Простая еда после прогулки или тренировки.',
    availableActionIds: [],
    shopId: shopId('shop_canteen')
  }
];
