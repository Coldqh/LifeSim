import housingBudgetRoomImage from '../../assets/housing/housing_budget_room.jpg';
import housingStandardRoomImage from '../../assets/housing/housing_standard_room.jpg';
import housingStudioImage from '../../assets/housing/housing_studio.jpg';
import type { DistrictId, LocationId } from '../../types/ids';
import type { Housing, HousingId } from '../../types/housing';

const housingId = (value: string) => value as HousingId;
const locationId = (value: string) => value as LocationId;
const districtId = (value: string) => value as DistrictId;

export const rybinskHousing: Housing[] = [
  {
    id: housingId('housing_ryb_center_room'), name: 'Комната у Вокзальной площади',
    locationId: locationId('ryb_center_home_room'), districtId: districtId('ryb_center'), address: 'ул. Плеханова, 12',
    kind: 'room', areaSqm: 14, condition: 'standard', rentPerWeek: 3200, rentPeriodDays: 7, deposit: 3200,
    movingCost: 800, dailyUtilities: 100, comfort: 36, sleepRecoveryBonus: 5, moodRecoveryBonus: 1,
    boxingFatigueRecoveryBonus: 2, description: 'Простая комната рядом с вокзалом и центром.', imageSrc: housingBudgetRoomImage
  },
  {
    id: housingId('housing_ryb_center_studio'), name: 'Студия у набережной',
    locationId: locationId('ryb_center_home_studio'), districtId: districtId('ryb_center'), address: 'Волжская наб., 33',
    kind: 'studio', areaSqm: 24, condition: 'good', rentPerWeek: 6200, rentPeriodDays: 7, deposit: 6200,
    movingCost: 1400, dailyUtilities: 160, comfort: 62, sleepRecoveryBonus: 10, moodRecoveryBonus: 4,
    boxingFatigueRecoveryBonus: 4, description: 'Небольшая студия рядом с прогулочной зоной.', imageSrc: housingStudioImage
  },
  {
    id: housingId('housing_ryb_center_flat'), name: 'Однокомнатная на Крестовой',
    locationId: locationId('ryb_center_home_flat'), districtId: districtId('ryb_center'), address: 'Крестовая ул., 74',
    kind: 'one_room', areaSqm: 36, condition: 'good', rentPerWeek: 8200, rentPeriodDays: 7, deposit: 8200,
    movingCost: 1800, dailyUtilities: 210, comfort: 72, sleepRecoveryBonus: 13, moodRecoveryBonus: 5,
    boxingFatigueRecoveryBonus: 5, description: 'Удобная квартира в центре Рыбинска.', imageSrc: housingStudioImage
  },
  {
    id: housingId('housing_ryb_severny_room'), name: 'Комната в Северном',
    locationId: locationId('ryb_severny_home_room'), districtId: districtId('ryb_severny'), address: 'просп. Серова, 14',
    kind: 'room', areaSqm: 13, condition: 'standard', rentPerWeek: 2700, rentPeriodDays: 7, deposit: 2700,
    movingCost: 700, dailyUtilities: 90, comfort: 32, sleepRecoveryBonus: 4, moodRecoveryBonus: 1,
    boxingFatigueRecoveryBonus: 2, description: 'Доступное жильё рядом с работой и спортом.', imageSrc: housingBudgetRoomImage
  },
  {
    id: housingId('housing_ryb_severny_flat'), name: 'Однокомнатная на Приборостроителей',
    locationId: locationId('ryb_severny_home_flat'), districtId: districtId('ryb_severny'), address: 'ул. Приборостроителей, 9',
    kind: 'one_room', areaSqm: 34, condition: 'standard', rentPerWeek: 5600, rentPeriodDays: 7, deposit: 5600,
    movingCost: 1300, dailyUtilities: 170, comfort: 58, sleepRecoveryBonus: 9, moodRecoveryBonus: 3,
    boxingFatigueRecoveryBonus: 4, description: 'Отдельная квартира в жилом районе.', imageSrc: housingStandardRoomImage
  },
  {
    id: housingId('housing_ryb_perebory_room'), name: 'Комната в Переборах',
    locationId: locationId('ryb_perebory_home_room'), districtId: districtId('ryb_perebory'), address: 'просп. 50 лет Октября, 31',
    kind: 'room', areaSqm: 12, condition: 'poor', rentPerWeek: 2100, rentPeriodDays: 7, deposit: 2100,
    movingCost: 600, dailyUtilities: 80, comfort: 24, sleepRecoveryBonus: 3, moodRecoveryBonus: 0,
    boxingFatigueRecoveryBonus: 1, description: 'Самое дешёвое жильё города, далеко от центра.', imageSrc: housingBudgetRoomImage
  },
  {
    id: housingId('housing_ryb_perebory_flat'), name: 'Однокомнатная у водохранилища',
    locationId: locationId('ryb_perebory_home_flat'), districtId: districtId('ryb_perebory'), address: 'Инженерная ул., 12',
    kind: 'one_room', areaSqm: 33, condition: 'standard', rentPerWeek: 4700, rentPeriodDays: 7, deposit: 4700,
    movingCost: 1100, dailyUtilities: 150, comfort: 52, sleepRecoveryBonus: 8, moodRecoveryBonus: 2,
    boxingFatigueRecoveryBonus: 3, description: 'Простая отдельная квартира рядом с природой.', imageSrc: housingStandardRoomImage
  }
];
