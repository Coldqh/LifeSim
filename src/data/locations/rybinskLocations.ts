import type { ActionId, CityId, DistrictId, JobId, LocationId, ShopId } from '../../types/ids';
import type { Location } from '../../types/location';
import { RYBINSK_DISTRICT_IDS } from '../cities/rybinsk';
import {
  ALWAYS_OPEN_SCHEDULE,
  BANK_SCHEDULE,
  CAFE_SCHEDULE,
  CLINIC_SCHEDULE,
  EDUCATION_CENTER_SCHEDULE,
  FITNESS_SCHEDULE,
  GROCERY_SCHEDULE,
  OFFICE_SCHEDULE,
  PHARMACY_SCHEDULE,
  SPORT_FACILITY_SCHEDULE,
  UNIVERSITY_SCHEDULE,
  WAREHOUSE_SCHEDULE
} from '../schedules/basicSchedules';

const actionId = (value: string) => value as ActionId;
const cityId = (value: string) => value as CityId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;
const shopId = (value: string) => value as ShopId;
const jobId = (value: string) => value as JobId;

const rybinsk = cityId('rybinsk');
const CENTER = RYBINSK_DISTRICT_IDS.center;
const SEVERNY = RYBINSK_DISTRICT_IDS.severny;
const PEREBORY = RYBINSK_DISTRICT_IDS.perebory;
const homeActions = [actionId('sleep_eight_hours'), actionId('rest_one_hour')];

export const rybinskLocations: Location[] = [
  {
    id: locationId('ryb_center_home_room'), cityId: rybinsk, districtId: CENTER,
    name: 'Комната у Вокзальной площади', address: 'ул. Плеханова, 12', type: 'home',
    description: 'Недорогая комната рядом с вокзалом и центром.', availableActionIds: homeActions, hiddenFromCityBrowser: true
  },
  {
    id: locationId('ryb_center_home_studio'), cityId: rybinsk, districtId: CENTER,
    name: 'Студия у набережной', address: 'Волжская наб., 33', type: 'home',
    description: 'Компактная студия рядом с историческим центром.', availableActionIds: homeActions, hiddenFromCityBrowser: true
  },
  {
    id: locationId('ryb_center_home_flat'), cityId: rybinsk, districtId: CENTER,
    name: 'Однокомнатная на Крестовой', address: 'Крестовая ул., 74', type: 'home',
    description: 'Отдельная квартира в центральной части города.', availableActionIds: homeActions, hiddenFromCityBrowser: true
  },
  {
    id: locationId('ryb_center_station'), cityId: rybinsk, districtId: CENTER,
    name: 'Рыбинск-Пассажирский', address: 'Пассажирская ул., 1А', type: 'train_station',
    description: 'Главный железнодорожный вокзал Рыбинска.', availableActionIds: [], openingHours: ALWAYS_OPEN_SCHEDULE
  },
  {
    id: locationId('ryb_center_bus_station'), cityId: rybinsk, districtId: CENTER,
    name: 'Автовокзал Рыбинска', address: 'Вокзальная пл., 1', type: 'bus_station',
    description: 'Междугородние и пригородные автобусные отправления.', availableActionIds: [], openingHours: ALWAYS_OPEN_SCHEDULE
  },
  {
    id: locationId('ryb_center_grocery'), cityId: rybinsk, districtId: CENTER,
    name: 'Городской универсам', address: 'ул. Герцена, 31', type: 'shop',
    description: 'Базовые продукты и вода.', availableActionIds: [], shopId: shopId('shop_local_grocery'),
    jobIds: [jobId('job_ryb_grocery_assistant')], openingHours: GROCERY_SCHEDULE
  },
  {
    id: locationId('ryb_center_cafe'), cityId: rybinsk, districtId: CENTER,
    name: 'Кофейня на Крестовой', address: 'Крестовая ул., 52', type: 'cafe',
    description: 'Небольшая кофейня в центре.', availableActionIds: [], shopId: shopId('shop_coffee_spot'),
    jobIds: [jobId('job_ryb_barista')], openingHours: CAFE_SCHEDULE
  },
  {
    id: locationId('ryb_center_rgatu'), cityId: rybinsk, districtId: CENTER,
    name: 'РГАТУ имени П. А. Соловьёва', address: 'ул. Пушкина, 53', type: 'university',
    description: 'Инженерный университет города.', availableActionIds: [],
    jobIds: [jobId('job_ryb_university_assistant')], openingHours: UNIVERSITY_SCHEDULE
  },
  {
    id: locationId('ryb_center_education_center'), cityId: rybinsk, districtId: CENTER,
    name: 'Центр профессиональных компетенций', address: 'ул. Чкалова, 21', type: 'education_center',
    description: 'Короткие курсы по цифровым и производственным навыкам.', availableActionIds: [], openingHours: EDUCATION_CENTER_SCHEDULE
  },
  {
    id: locationId('ryb_center_clinic'), cityId: rybinsk, districtId: CENTER,
    name: 'Городской медицинский центр', address: 'ул. Свободы, 4', type: 'clinic',
    description: 'Терапия, травматология и спортивная медицина.', availableActionIds: [],
    jobIds: [jobId('job_ryb_clinic_registrar')], openingHours: CLINIC_SCHEDULE
  },
  {
    id: locationId('ryb_center_pharmacy'), cityId: rybinsk, districtId: CENTER,
    name: 'Аптека на Стоялой', address: 'Стоялая ул., 18', type: 'pharmacy',
    description: 'Лекарства и средства восстановления.', availableActionIds: [], shopId: shopId('shop_pharmacy'), openingHours: PHARMACY_SCHEDULE
  },
  {
    id: locationId('ryb_center_embankment'), cityId: rybinsk, districtId: CENTER,
    name: 'Волжская набережная', address: 'Волжская наб.', type: 'park',
    description: 'Прогулочная зона вдоль Волги.', availableActionIds: [actionId('walk_one_hour')], openingHours: ALWAYS_OPEN_SCHEDULE
  },
  {
    id: locationId('ryb_center_bank'), cityId: rybinsk, districtId: CENTER,
    name: 'Городской банковский офис', address: 'Крестовая ул., 35', type: 'bank',
    description: 'Офис обслуживания и стабильная офисная работа.', availableActionIds: [],
    jobIds: [jobId('job_ryb_bank_assistant')], openingHours: BANK_SCHEDULE
  },
  {
    id: locationId('ryb_center_hostel'), cityId: rybinsk, districtId: CENTER,
    name: 'Хостел у вокзала', address: 'Вокзальная ул., 7', type: 'hostel',
    description: 'Простое временное жильё рядом с транспортом.', availableActionIds: [], openingHours: ALWAYS_OPEN_SCHEDULE
  },
  {
    id: locationId('ryb_center_hotel'), cityId: rybinsk, districtId: CENTER,
    name: 'Гостиница «Волга»', address: 'Крестовая ул., 120', type: 'hotel',
    description: 'Городская гостиница среднего уровня.', availableActionIds: [], openingHours: ALWAYS_OPEN_SCHEDULE
  },
  {
    id: locationId('ryb_center_daily_apartment'), cityId: rybinsk, districtId: CENTER,
    name: 'Квартира посуточно в центре', address: 'ул. Ломоносова, 8', type: 'hotel',
    description: 'Отдельная квартира для временной остановки.', availableActionIds: [], openingHours: ALWAYS_OPEN_SCHEDULE
  },

  {
    id: locationId('ryb_severny_home_room'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Комната в Северном', address: 'просп. Серова, 14', type: 'home',
    description: 'Доступная комната рядом с промышленными предприятиями.', availableActionIds: homeActions, hiddenFromCityBrowser: true
  },
  {
    id: locationId('ryb_severny_home_flat'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Однокомнатная на Приборостроителей', address: 'ул. Приборостроителей, 9', type: 'home',
    description: 'Отдельная квартира в спокойном жилом районе.', availableActionIds: homeActions, hiddenFromCityBrowser: true
  },
  {
    id: locationId('ryb_severny_plant'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Машиностроительный производственный комплекс', address: 'просп. Ленина, 163', type: 'workplace',
    description: 'Крупное производство с техническими и рабочими должностями.', availableActionIds: [],
    jobIds: [jobId('job_ryb_plant_trainee')], openingHours: OFFICE_SCHEDULE
  },
  {
    id: locationId('ryb_severny_engineering_office'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Инженерный центр', address: 'ул. Бабушкина, 29', type: 'business_center',
    description: 'Проектные и технические отделы местных предприятий.', availableActionIds: [],
    jobIds: [jobId('job_ryb_engineering_assistant')], openingHours: OFFICE_SCHEDULE
  },
  {
    id: locationId('ryb_severny_mall'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Торговый центр «Север»', address: 'просп. Серова, 41', type: 'mall',
    description: 'Магазины, фудкорт и бытовые услуги.', availableActionIds: [actionId('walk_one_hour')],
    shopId: shopId('shop_food_court'), openingHours: GROCERY_SCHEDULE
  },
  {
    id: locationId('ryb_severny_fitness'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Фитнес-клуб «Высота»', address: 'ул. 9 Мая, 18', type: 'fitness',
    description: 'Тренажёрный зал и групповые занятия.', availableActionIds: [actionId('light_training')], openingHours: FITNESS_SCHEDULE
  },
  {
    id: locationId('ryb_severny_pool'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Городской бассейн «Темп»', address: 'ул. Академика Губкина, 5', type: 'pool',
    description: 'Бассейн для тренировок и будущей системы плавания.', availableActionIds: [],
    jobIds: [jobId('job_ryb_pool_attendant')], openingHours: SPORT_FACILITY_SCHEDULE
  },
  {
    id: locationId('ryb_severny_boxing_gym'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Боксёрский клуб «Волга»', address: 'ул. 9 Мая, 22', type: 'boxing_gym',
    description: 'Региональный боксёрский зал с доступной абонентской платой.', availableActionIds: [], openingHours: SPORT_FACILITY_SCHEDULE
  },
  {
    id: locationId('ryb_severny_gas_station'), cityId: rybinsk, districtId: SEVERNY,
    name: 'Городская АЗС', address: 'Окружная дорога, 6', type: 'gas_station',
    description: 'Заправка личного автомобиля.', availableActionIds: [], openingHours: ALWAYS_OPEN_SCHEDULE
  },

  {
    id: locationId('ryb_perebory_home_room'), cityId: rybinsk, districtId: PEREBORY,
    name: 'Комната в Переборах', address: 'просп. 50 лет Октября, 31', type: 'home',
    description: 'Самое доступное жильё вдали от центра.', availableActionIds: homeActions, hiddenFromCityBrowser: true
  },
  {
    id: locationId('ryb_perebory_home_flat'), cityId: rybinsk, districtId: PEREBORY,
    name: 'Однокомнатная у водохранилища', address: 'Инженерная ул., 12', type: 'home',
    description: 'Простая квартира рядом с промышленной зоной и водой.', availableActionIds: homeActions, hiddenFromCityBrowser: true
  },
  {
    id: locationId('ryb_perebory_warehouse'), cityId: rybinsk, districtId: PEREBORY,
    name: 'Логистический терминал', address: 'Промышленная ул., 17', type: 'warehouse',
    description: 'Склад и погрузочная площадка.', availableActionIds: [],
    jobIds: [jobId('job_ryb_warehouse_worker')], openingHours: WAREHOUSE_SCHEDULE
  },
  {
    id: locationId('ryb_perebory_stadium'), cityId: rybinsk, districtId: PEREBORY,
    name: 'Стадион «Метеор»', address: 'Спортивная ул., 4', type: 'sport_ground',
    description: 'Открытый стадион для бега и командных тренировок.', availableActionIds: [actionId('light_training')], openingHours: SPORT_FACILITY_SCHEDULE
  },
  {
    id: locationId('ryb_perebory_park'), cityId: rybinsk, districtId: PEREBORY,
    name: 'Парк у Рыбинского водохранилища', address: 'Волжская ул.', type: 'park',
    description: 'Тихая прогулочная зона на окраине города.', availableActionIds: [actionId('walk_one_hour')], openingHours: ALWAYS_OPEN_SCHEDULE
  },
  {
    id: locationId('ryb_perebory_grocery'), cityId: rybinsk, districtId: PEREBORY,
    name: 'Магазин в Переборах', address: 'просп. 50 лет Октября, 44', type: 'shop',
    description: 'Продукты и вода рядом с жилыми кварталами.', availableActionIds: [], shopId: shopId('shop_local_grocery'), openingHours: GROCERY_SCHEDULE
  },
  {
    id: locationId('ryb_perebory_business_point'), cityId: rybinsk, districtId: PEREBORY,
    name: 'Сервисный павильон', address: 'Инженерная ул., 20', type: 'service',
    description: 'Небольшое помещение для локального бизнеса.', availableActionIds: [], openingHours: OFFICE_SCHEDULE
  }
];
