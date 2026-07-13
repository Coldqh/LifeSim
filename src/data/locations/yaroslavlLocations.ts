import type { Location, LocationType } from '../../types/location';
import type { WeeklySchedule } from '../../types/schedule';
import type { ActionId, CityId, DistrictId, JobId, LocationId, ShopId } from '../../types/ids';
import {
  ALWAYS_OPEN_SCHEDULE,
  CAFE_SCHEDULE,
  CLINIC_SCHEDULE,
  GROCERY_SCHEDULE,
  MALL_SCHEDULE,
  PHARMACY_SCHEDULE,
  RESTAURANT_SCHEDULE,
  SPORT_FACILITY_SCHEDULE,
  UNIVERSITY_SCHEDULE
} from '../schedules/basicSchedules';

const actionId = (value: string) => value as ActionId;
const cityId = (value: string) => value as CityId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;
const shopId = (value: string) => value as ShopId;
const jobId = (value: string) => value as JobId;
const city = cityId('yaroslavl');

const base: Location[] = [
  {
    id: locationId('yar_leninsky_main_station'), cityId: city, districtId: districtId('yar_leninsky'),
    name: 'Ярославль-Главный', address: 'пл. Ярославль-Главный, 1А', type: 'train_station',
    description: 'Главный железнодорожный вокзал города.', availableActionIds: []
  },
  {
    id: locationId('yar_frunzensky_bus_station'), cityId: city, districtId: districtId('yar_frunzensky'),
    name: 'Ярославский автовокзал', address: 'Московский просп., 80А', type: 'bus_station',
    description: 'Междугородние автобусы и зал ожидания.', availableActionIds: []
  },
  {
    id: locationId('yar_kirovsky_volkov_theatre'), cityId: city, districtId: districtId('yar_kirovsky'),
    name: 'Театр имени Ф. Волкова', address: 'пл. Волкова, 1', type: 'other',
    description: 'Центральная городская точка и место встреч.', availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('yar_kirovsky_kirova_walk'), cityId: city, districtId: districtId('yar_kirovsky'),
    name: 'Пешеходная улица Кирова', address: 'ул. Кирова', type: 'park',
    description: 'Прогулочная улица в центре Ярославля.', availableActionIds: [actionId('walk_one_hour')]
  },
  {
    id: locationId('yar_kirovsky_aura_mall'), cityId: city, districtId: districtId('yar_kirovsky'),
    name: 'ТРЦ «Аура»', address: 'ул. Победы, 41', type: 'mall',
    description: 'Крупный торговый центр.', availableActionIds: [], shopId: shopId('shop_food_court'),
    jobIds: [jobId('job_yar_food_court_cashier')]
  },
  {
    id: locationId('yar_kirovsky_baget_cafe'), cityId: city, districtId: districtId('yar_kirovsky'),
    name: 'Кафе «Багет, паштет и жёлтый плед»', address: 'ул. Собинова, 41Б', type: 'cafe',
    description: 'Кафе в центре города.', availableActionIds: [], shopId: shopId('shop_coffee_spot'),
    jobIds: [jobId('job_yar_barista')]
  },
  {
    id: locationId('yar_leninsky_shinnik_stadium'), cityId: city, districtId: districtId('yar_leninsky'),
    name: 'Стадион «Шинник»', address: 'пл. Труда, 3', type: 'sport_ground',
    description: 'Городской стадион и спортивная зона.', availableActionIds: [actionId('light_training')]
  },
  {
    id: locationId('yar_leninsky_grocery'), cityId: city, districtId: districtId('yar_leninsky'),
    name: 'Супермаркет «Пятёрочка»', address: 'ул. Свободы, 63', type: 'shop',
    description: 'Повседневные продукты и вода.', availableActionIds: [], shopId: shopId('shop_local_grocery'),
    jobIds: [jobId('job_yar_grocery_assistant')]
  },
  {
    id: locationId('yar_leninsky_pharmacy'), cityId: city, districtId: districtId('yar_leninsky'),
    name: 'Аптека «Ригла»', address: 'ул. Свободы, 46', type: 'pharmacy',
    description: 'Лекарства и товары восстановления.', availableActionIds: [], shopId: shopId('shop_pharmacy')
  },
  {
    id: locationId('yar_frunzensky_arena_2000'), cityId: city, districtId: districtId('yar_frunzensky'),
    name: 'Арена-2000-Локомотив', address: 'ул. Гагарина, 15', type: 'sport_ground',
    description: 'Крупный спортивный комплекс.', availableActionIds: [actionId('light_training')]
  },
  {
    id: locationId('yar_frunzensky_canteen'), cityId: city, districtId: districtId('yar_frunzensky'),
    name: 'Городская столовая', address: 'Московский просп., 88', type: 'restaurant',
    description: 'Недорогой обед рядом с автовокзалом.', availableActionIds: [], shopId: shopId('shop_canteen')
  },
  {
    id: locationId('yar_frunzensky_clinic'), cityId: city, districtId: districtId('yar_frunzensky'),
    name: 'Клиническая больница имени Н.А. Семашко', address: 'ул. Семашко, 7', type: 'clinic',
    description: 'Городская медицинская помощь.', availableActionIds: []
  },
  {
    id: locationId('yar_kirovsky_ibis_hotel'), cityId: city, districtId: districtId('yar_kirovsky'),
    name: 'Ibis Ярославль Центр', address: 'Первомайский пер., 2А', type: 'hotel',
    description: 'Гостиница в центре.', availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')]
  },
  {
    id: locationId('yar_leninsky_hostel'), cityId: city, districtId: districtId('yar_leninsky'),
    name: 'Хостел у вокзала', address: 'ул. Ухтомского, 12', type: 'hostel',
    description: 'Недорогое место на одну или несколько ночей.', availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')]
  },
  {
    id: locationId('yar_frunzensky_daily_apartment'), cityId: city, districtId: districtId('yar_frunzensky'),
    name: 'Квартира посуточно на Московском проспекте', address: 'Московский просп., 90', type: 'home',
    description: 'Посуточная квартира.', availableActionIds: [actionId('sleep_eight_hours'), actionId('rest_one_hour')]
  }
  ,{
    id: locationId('yar_kirovsky_demidov_university'), cityId: city, districtId: districtId('yar_kirovsky'),
    name: 'ЯрГУ им. П. Г. Демидова', address: 'Советская ул., 14', type: 'university',
    description: 'Главный корпус Демидовского университета.', availableActionIds: []
  },
  {
    id: locationId('yar_frunzensky_ystu'), cityId: city, districtId: districtId('yar_frunzensky'),
    name: 'Ярославский государственный технический университет', address: 'Московский просп., 88', type: 'university',
    description: 'Главный учебный корпус ЯГТУ.', availableActionIds: []
  }

];

const schedules: Record<LocationType, WeeklySchedule> = {
  home: ALWAYS_OPEN_SCHEDULE, shop: GROCERY_SCHEDULE, cafe: CAFE_SCHEDULE, workplace: ALWAYS_OPEN_SCHEDULE,
  business_center: ALWAYS_OPEN_SCHEDULE, park: ALWAYS_OPEN_SCHEDULE, sport_ground: SPORT_FACILITY_SCHEDULE,
  service: ALWAYS_OPEN_SCHEDULE, warehouse: ALWAYS_OPEN_SCHEDULE, fitness: SPORT_FACILITY_SCHEDULE,
  coworking: CAFE_SCHEDULE, clinic: CLINIC_SCHEDULE, pharmacy: PHARMACY_SCHEDULE, restaurant: RESTAURANT_SCHEDULE,
  food_court: RESTAURANT_SCHEDULE, pickup_point: ALWAYS_OPEN_SCHEDULE, mall: MALL_SCHEDULE,
  electronics_store: MALL_SCHEDULE, clothing_store: MALL_SCHEDULE, bank: ALWAYS_OPEN_SCHEDULE,
  education_center: ALWAYS_OPEN_SCHEDULE, university: UNIVERSITY_SCHEDULE, sports_store: MALL_SCHEDULE, boxing_gym: SPORT_FACILITY_SCHEDULE,
  pool: SPORT_FACILITY_SCHEDULE, car_dealer: MALL_SCHEDULE, gas_station: ALWAYS_OPEN_SCHEDULE,
  service_center: ALWAYS_OPEN_SCHEDULE, auto_market: MALL_SCHEDULE, train_station: ALWAYS_OPEN_SCHEDULE,
  bus_station: ALWAYS_OPEN_SCHEDULE, hotel: ALWAYS_OPEN_SCHEDULE, hostel: ALWAYS_OPEN_SCHEDULE, other: ALWAYS_OPEN_SCHEDULE
};

export const yaroslavlLocations = base.map((location) => ({ ...location, openingHours: schedules[location.type] }));
