import type { Location, LocationType } from '../../types/location';
import type { WeeklySchedule } from '../../types/schedule';
import type { ActionId, CityId, DistrictId, JobId, LocationId, ShopId } from '../../types/ids';
import {
  ALWAYS_OPEN_SCHEDULE,
  BANK_SCHEDULE,
  BUSINESS_CENTER_SCHEDULE,
  CAFE_SCHEDULE,
  CLINIC_SCHEDULE,
  COWORKING_SCHEDULE,
  EDUCATION_CENTER_SCHEDULE,
  FITNESS_SCHEDULE,
  FOOD_COURT_SCHEDULE,
  GROCERY_SCHEDULE,
  MALL_SCHEDULE,
  OFFICE_SCHEDULE,
  PHARMACY_SCHEDULE,
  PICKUP_POINT_SCHEDULE,
  PREMIUM_CAFE_SCHEDULE,
  RESTAURANT_SCHEDULE,
  RETAIL_SCHEDULE,
  SERVICE_SCHEDULE,
  SPORT_FACILITY_SCHEDULE,
  WAREHOUSE_SCHEDULE
} from '../schedules/basicSchedules';

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

const baseMoscowLocations: Location[] = [
  {
    id: locationId('msk_danilovsky_home'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Комната в старом доме',
    address: 'Восточная ул., 5',
    type: 'home',
    description: 'Стартовая точка. Здесь можно спать и восстанавливаться.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_danilovsky_home_bed'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Койко-место у Автозаводской',
    address: 'Автозаводская ул., 7',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_danilovsky_home_studio'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Старая студия у Дубровки',
    address: 'Шарикоподшипниковская ул., 6/14',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_danilovsky_home_flat'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Однокомнатная у ЗИЛа',
    address: 'Автозаводская ул., 23с931',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_presnya_home_room'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Комната у 1905 года',
    address: 'ул. 1905 года, 15',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_presnya_home_studio'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Студия на Шелепихе',
    address: 'Шелепихинская наб., 34к2',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_presnya_home_flat'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Однокомнатная на Красной Пресне',
    address: 'Красная Пресня ул., 32–34',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_presnya_home_premium'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Квартира рядом с Москва-Сити',
    address: 'Пресненская наб., 8с1',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_tverskoy_home_room'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Комната в коммуналке на Садовой',
    address: 'Садовая-Каретная ул., 20с1',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_tverskoy_home_studio'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Маленькая студия на Цветном',
    address: 'Цветной б-р, 25с1',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_tverskoy_home_flat'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Однокомнатная у Пушкинской',
    address: 'Большая Бронная ул., 17',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_tverskoy_home_premium'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Квартира на Тверском бульваре',
    address: 'Тверской б-р, 20с1',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_khamovniki_home_room'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Комната у Спортивной',
    address: 'ул. 10-летия Октября, 11',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_khamovniki_home_old_flat'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Старая однокомнатная на Пироговской',
    address: 'Малая Пироговская ул., 21',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_khamovniki_home_studio'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Студия на Усачёва',
    address: 'ул. Усачёва, 11Б',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_khamovniki_home_premium'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Однокомнатная у Фрунзенской',
    address: 'Фрунзенская наб., 26',
    type: 'home',
    description: 'Жилое объявление. Доступно после аренды.',
    availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')],
    hiddenFromCityBrowser: true
  },
  {
    id: locationId('msk_danilovsky_grocery'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Даниловский рынок',
    address: 'Мытная ул., 74',
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
    name: 'Cofix — ТРЦ «Ривьера»',
    address: 'Автозаводская ул., 18',
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
    name: 'TOPGUN — Ереван Плаза',
    address: 'Большая Тульская ул., 13',
    type: 'service',
    description: 'Локальный сервисный салон.',
    availableActionIds: [],
    jobIds: [jobId('job_salon_administrator')]
  },
  {
    id: locationId('msk_danilovsky_small_warehouse'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'СДЭК — Павелецкая',
    address: '2-й Павелецкий пр., 5с1',
    type: 'warehouse',
    description: 'Складская точка района.',
    availableActionIds: [],
    jobIds: [jobId('job_warehouse_helper')]
  },
  {
    id: locationId('msk_danilovsky_fitness_hall'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'World Class Тульская',
    address: 'Большая Тульская ул., 13',
    type: 'fitness',
    description: 'Районный зал.',
    availableActionIds: [actionId('light_training')],
    jobIds: [jobId('job_fitness_assistant')]
  },
  {
    id: locationId('msk_presnya_part_time_office'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Башня «Империя»',
    address: 'Пресненская наб., 6с2',
    type: 'workplace',
    description: 'Офисное рабочее место.',
    availableActionIds: [],
    jobIds: [jobId('job_office_part_time_assistant')]
  },
  {
    id: locationId('msk_presnya_business_center'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Башня «Федерация»',
    address: 'Пресненская наб., 12',
    type: 'business_center',
    description: 'Деловое место района.',
    availableActionIds: [actionId('walk_one_hour')],
    jobIds: [jobId('job_business_center_helper')]
  },
  {
    id: locationId('msk_presnya_coffee_spot'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Stars Coffee — Афимолл',
    address: 'Пресненская наб., 2',
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
    name: 'МТС — Афимолл',
    address: 'Пресненская наб., 2',
    type: 'service',
    description: 'Сервисная точка с продажами.',
    availableActionIds: [],
    jobIds: [jobId('job_phone_shop_consultant')]
  },
  {
    id: locationId('msk_presnya_business_cafe'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Cofix — Афимолл',
    address: 'Пресненская наб., 2',
    type: 'cafe',
    description: 'Кофейня рядом с офисами.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot')
  },
  {
    id: locationId('msk_presnya_coworking'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'SOK City',
    address: 'Пресненская наб., 8с1',
    type: 'coworking',
    description: 'Рабочая точка для фриланса и офисных задач.',
    availableActionIds: [],
    jobIds: [jobId('job_coworking_assistant')]
  },
  {
    id: locationId('msk_tverskoy_central_cafe'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Шоколадница на Тверской',
    address: 'Тверская ул., 19',
    type: 'cafe',
    description: 'Центральное кафе.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot')
  },
  {
    id: locationId('msk_tverskoy_walking_zone'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Сад «Эрмитаж»',
    address: 'ул. Каретный Ряд, 3',
    type: 'park',
    description: 'Место для простой прогулки по центру.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_tverskoy_bookstore'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Читай-город на Тверской',
    address: 'Тверская ул., 8к1',
    type: 'shop',
    description: 'Магазин в центре.',
    availableActionIds: [],
    jobIds: [jobId('job_bookstore_assistant')]
  },
  {
    id: locationId('msk_tverskoy_barbershop'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Chop-Chop Столешников',
    address: 'Столешников пер., 6с3',
    type: 'service',
    description: 'Сервисное место в центре.',
    availableActionIds: [],
    jobIds: [jobId('job_salon_administrator')]
  },
  {
    id: locationId('msk_tverskoy_clothing_store'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'LIME на Тверской',
    address: 'Тверская ул., 23',
    type: 'shop',
    description: 'Торговая точка в центре.',
    availableActionIds: []
  },
  {
    id: locationId('msk_khamovniki_sports_ground'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Спортивные площадки «Лужники»',
    address: 'ул. Лужники, 24',
    type: 'sport_ground',
    description: 'Пока без спорт-системы. Только базовая тренировка.',
    availableActionIds: [actionId('light_training')]
  },
  {
    id: locationId('msk_khamovniki_park'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Парк «Усадьба Трубецких»',
    address: 'ул. Усачёва, 1А',
    type: 'park',
    description: 'Точка для прогулки и восстановления настроения.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_khamovniki_fitness_club'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'World Class Хамовники',
    address: 'ул. Усачёва, 2с1',
    type: 'fitness',
    description: 'Фитнес-локация района.',
    availableActionIds: [actionId('light_training')],
    jobIds: [jobId('job_fitness_assistant')]
  },
  {
    id: locationId('msk_khamovniki_park_cafe'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Кофемания — Усачёвский рынок',
    address: 'ул. Усачёва, 26',
    type: 'cafe',
    description: 'Кафе рядом с прогулочной зоной.',
    availableActionIds: [],
    shopId: shopId('shop_coffee_spot')
  },
  {
    id: locationId('msk_khamovniki_medical_center'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'МЕДСИ на Пироговской',
    address: 'Большая Пироговская ул., 7',
    type: 'clinic',
    description: 'Медицинская точка района.',
    availableActionIds: []
  },

  {
    id: locationId('msk_danilovsky_pharmacy'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Аптека 36,6 — Даниловский рынок',
    address: 'Мытная ул., 74',
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
    name: 'Грабли — Ереван Плаза',
    address: 'Большая Тульская ул., 13',
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
    name: 'Ozon — Холодильный переулок',
    address: 'Холодильный пер., 3к1с3',
    type: 'pickup_point',
    description: 'Точка выдачи заказов с простой районной подработкой.',
    availableActionIds: [],
    jobIds: [jobId('job_pickup_point_operator')]
  },
  {
    id: locationId('msk_danilovsky_small_mall'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'ТРЦ «Ривьера»',
    address: 'Автозаводская ул., 18',
    type: 'mall',
    description: 'Небольшой торговый центр рядом с бытовыми сервисами.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_danilovsky_sport_goods'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Спортмастер — ТРЦ «Ривьера»',
    address: 'Автозаводская ул., 18',
    type: 'sports_store',
    description: 'Место для базового спортивного питания и расходников.',
    availableActionIds: [],
    shopId: shopId('shop_sport_goods')
  },
  {
    id: locationId('msk_presnya_electronics_store'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'М.Видео — Афимолл',
    address: 'Пресненская наб., 2',
    type: 'electronics_store',
    description: 'Точка продаж техники и аксессуаров в деловом районе.',
    availableActionIds: [],
    jobIds: [jobId('job_electronics_store_assistant')]
  },
  {
    id: locationId('msk_presnya_food_court'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Фудкорт «Афимолл Сити»',
    address: 'Пресненская наб., 2',
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
    name: 'ВТБ — Башня «Федерация»',
    address: 'Пресненская наб., 12',
    type: 'bank',
    description: 'Офис обслуживания в деловом районе.',
    availableActionIds: [],
    jobIds: [jobId('job_bank_lobby_assistant')]
  },
  {
    id: locationId('msk_presnya_small_office'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'IQ-квартал',
    address: 'Пресненская наб., 10с2',
    type: 'workplace',
    description: 'Малый офис с рутинными задачами и стабильными сменами.',
    availableActionIds: [],
    jobIds: [jobId('job_small_office_clerk')]
  },
  {
    id: locationId('msk_presnya_clothing_store'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'LIME — Афимолл',
    address: 'Пресненская наб., 2',
    type: 'clothing_store',
    description: 'Торговая точка с базовой работой в зале.',
    availableActionIds: [],
    jobIds: [jobId('job_clothing_store_assistant')]
  },
  {
    id: locationId('msk_tverskoy_restaurant'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Кафе «Пушкинъ»',
    address: 'Тверской б-р, 26А',
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
    name: 'Кофемания на Никитской',
    address: 'Большая Никитская ул., 13/6с1',
    type: 'cafe',
    description: 'Дорогая кофейня в центре с плотным потоком гостей.',
    availableActionIds: [],
    shopId: shopId('shop_premium_coffee')
  },
  {
    id: locationId('msk_tverskoy_education_center'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'МГУУ Правительства Москвы',
    address: 'Сретенка ул., 28',
    type: 'education_center',
    description: 'Будущая точка для обучения и курсов.',
    availableActionIds: []
  },
  {
    id: locationId('msk_tverskoy_night_store'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Азбука вкуса на Тверской',
    address: 'Тверская ул., 8к1',
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
    name: 'Универмаг «Цветной»',
    address: 'Цветной б-р, 15с1',
    type: 'mall',
    description: 'Центральная торговая зона с магазинами и услугами.',
    availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('msk_khamovniki_pharmacy'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Горздрав — Усачёвский рынок',
    address: 'ул. Усачёва, 26',
    type: 'pharmacy',
    description: 'Аптека рядом со спортивными и прогулочными местами.',
    availableActionIds: [],
    shopId: shopId('shop_pharmacy')
  },
  {
    id: locationId('msk_khamovniki_pool'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Аквакомплекс «Лужники»',
    address: 'ул. Лужники, 24с4',
    type: 'pool',
    description: 'Спортивная точка без отдельной системы плавания пока.',
    availableActionIds: [],
    jobIds: [jobId('job_pool_attendant')]
  },
  {
    id: locationId('msk_khamovniki_boxing_gym'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Академия бокса «Лужники»',
    address: 'ул. Лужники, 24с10',
    type: 'boxing_gym',
    description: 'Боксёрский зал с тренерами, тренировками, спаррингами и клубным турниром.',
    availableActionIds: []
  },
  {
    id: locationId('msk_khamovniki_sport_goods'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Спортмастер PRO Киевский',
    address: 'пл. Киевского Вокзала, 2',
    type: 'sports_store',
    description: 'Спортивное питание и базовые расходники.',
    availableActionIds: [],
    shopId: shopId('shop_sport_goods')
  },
  {
    id: locationId('msk_khamovniki_canteen'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Усачёвский рынок',
    address: 'ул. Усачёва, 26',
    type: 'restaurant',
    description: 'Простая еда после прогулки или тренировки.',
    availableActionIds: [],
    shopId: shopId('shop_canteen')
  }
  ,{
    id: locationId('msk_danilovsky_auto_market'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'Площадка автомобилей с пробегом',
    address: 'Автозаводская ул., 23к7',
    type: 'auto_market',
    description: 'Осмотры автомобилей из объявлений Авто.ру.',
    availableActionIds: []
  },
  {
    id: locationId('msk_danilovsky_gas_station'),
    cityId: moscow,
    districtId: districtId('msk_danilovsky'),
    name: 'ЛУКОЙЛ',
    address: 'Дубининская ул., 69',
    type: 'gas_station',
    description: 'Заправка личного автомобиля.',
    availableActionIds: []
  },
  {
    id: locationId('msk_presnya_auto_market'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Автомобили с пробегом — Магистральный',
    address: '2-й Магистральный тупик, 5А',
    type: 'auto_market',
    description: 'Мультибрендовая площадка подержанных автомобилей.',
    availableActionIds: []
  },
  {
    id: locationId('msk_presnya_gas_station'),
    cityId: moscow,
    districtId: districtId('msk_presnya'),
    name: 'Газпромнефть',
    address: 'Звенигородское ш., 28с1',
    type: 'gas_station',
    description: 'АЗС рядом с деловым районом.',
    availableActionIds: []
  },
  {
    id: locationId('msk_tverskoy_auto_showroom'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Московский мультибрендовый автосалон',
    address: 'Садовая-Каретная ул., 20с1',
    type: 'car_dealer',
    description: 'Новые массовые автомобили и машины с пробегом.',
    availableActionIds: []
  },
  {
    id: locationId('msk_tverskoy_service_center'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Городской автосервис',
    address: 'Олимпийский просп., 16с2',
    type: 'service_center',
    description: 'Базовое техническое обслуживание автомобиля.',
    availableActionIds: []
  },
  {
    id: locationId('msk_khamovniki_import_dealer'),
    cityId: moscow,
    districtId: districtId('msk_khamovniki'),
    name: 'Premium Import Centre',
    address: 'Бережковская наб., 20с6',
    type: 'car_dealer',
    description: 'Новые премиальные автомобили параллельного импорта.',
    availableActionIds: []
  }

  ,{
    id: locationId('msk_tverskoy_yaroslavsky_station'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Ярославский вокзал',
    address: 'Комсомольская пл., 5',
    type: 'train_station',
    description: 'Железнодорожные отправления в Ярославль и другие города.',
    availableActionIds: []
  },
  {
    id: locationId('msk_tverskoy_central_bus_station'),
    cityId: moscow,
    districtId: districtId('msk_tverskoy'),
    name: 'Центральный автовокзал',
    address: 'Щёлковское ш., 75',
    type: 'bus_station',
    description: 'Междугородние автобусные отправления.',
    availableActionIds: []
  }

];

const LOCATION_TYPE_SCHEDULES: Record<LocationType, WeeklySchedule> = {
  home: ALWAYS_OPEN_SCHEDULE,
  shop: GROCERY_SCHEDULE,
  cafe: CAFE_SCHEDULE,
  workplace: OFFICE_SCHEDULE,
  business_center: BUSINESS_CENTER_SCHEDULE,
  park: ALWAYS_OPEN_SCHEDULE,
  sport_ground: ALWAYS_OPEN_SCHEDULE,
  service: SERVICE_SCHEDULE,
  warehouse: WAREHOUSE_SCHEDULE,
  fitness: FITNESS_SCHEDULE,
  coworking: COWORKING_SCHEDULE,
  clinic: CLINIC_SCHEDULE,
  pharmacy: PHARMACY_SCHEDULE,
  restaurant: RESTAURANT_SCHEDULE,
  food_court: FOOD_COURT_SCHEDULE,
  pickup_point: PICKUP_POINT_SCHEDULE,
  mall: MALL_SCHEDULE,
  electronics_store: RETAIL_SCHEDULE,
  clothing_store: RETAIL_SCHEDULE,
  bank: BANK_SCHEDULE,
  education_center: EDUCATION_CENTER_SCHEDULE,
  sports_store: RETAIL_SCHEDULE,
  boxing_gym: SPORT_FACILITY_SCHEDULE,
  pool: SPORT_FACILITY_SCHEDULE,
  car_dealer: RETAIL_SCHEDULE,
  gas_station: ALWAYS_OPEN_SCHEDULE,
  service_center: SERVICE_SCHEDULE,
  auto_market: RETAIL_SCHEDULE,
  train_station: ALWAYS_OPEN_SCHEDULE,
  bus_station: ALWAYS_OPEN_SCHEDULE,
  hotel: ALWAYS_OPEN_SCHEDULE,
  hostel: ALWAYS_OPEN_SCHEDULE,
  other: ALWAYS_OPEN_SCHEDULE
};

const LOCATION_SCHEDULE_OVERRIDES: Record<string, WeeklySchedule> = {
  msk_tverskoy_night_store: ALWAYS_OPEN_SCHEDULE,
  msk_tverskoy_premium_coffee: PREMIUM_CAFE_SCHEDULE
};

export const moscowLocations: Location[] = baseMoscowLocations.map((location) => ({
  ...location,
  openingHours: LOCATION_SCHEDULE_OVERRIDES[location.id] ?? LOCATION_TYPE_SCHEDULES[location.type]
}));

