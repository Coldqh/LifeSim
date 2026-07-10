import housingRoomDanilovskyImage from '../../assets/housing/housing_room_danilovsky.png';
import type { DistrictId, LocationId } from '../../types/ids';
import type { Housing, HousingId } from '../../types/housing';

function housingId(value: string): HousingId {
  return value as HousingId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}

function districtId(value: string): DistrictId {
  return value as DistrictId;
}

export const basicHousing: Housing[] = [
  {
    id: housingId('housing_room_danilovsky'),
    name: 'Комната в старом доме',
    locationId: locationId('msk_danilovsky_home'),
    districtId: districtId('msk_danilovsky'),
    rentPerWeek: 7000,
    rentPeriodDays: 7,
    dailyUtilities: 250,
    comfort: 35,
    sleepRecoveryBonus: 10,
    description: 'Простая съёмная комната с базовой мебелью в старом жилом доме.',
    imageSrc: housingRoomDanilovskyImage
  }
];

export function getHousingById(housingId: HousingId | undefined): Housing | undefined {
  if (!housingId) return undefined;
  return basicHousing.find((housing) => housing.id === housingId);
}
