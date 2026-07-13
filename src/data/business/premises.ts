import type { BusinessPremises } from '../../types/business';
import type { BusinessPremisesId, DistrictId, LocationId } from '../../types/ids';
import { BUSINESS_TYPE_IDS } from './businessTypes';

export function businessPremisesId(value: string): BusinessPremisesId {
  return value as BusinessPremisesId;
}

function districtId(value: string): DistrictId {
  return value as DistrictId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}

export const businessPremises: BusinessPremises[] = [
  {
    id: businessPremisesId('premises_danilovsky_market_kiosk'),
    name: 'Киоск на Даниловском рынке',
    address: 'Мытная улица, 74',
    districtId: districtId('msk_danilovsky'),
    locationId: locationId('msk_danilovsky_grocery'),
    areaSqm: 10,
    rentPerWeek: 6500,
    deposit: 6500,
    dailyUtilities: 220,
    footTraffic: 3,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: businessPremisesId('premises_riviera_food_point'),
    name: 'Островок в ТРЦ «Ривьера»',
    address: 'Автозаводская улица, 18',
    districtId: districtId('msk_danilovsky'),
    locationId: locationId('msk_danilovsky_small_mall'),
    areaSqm: 14,
    rentPerWeek: 9800,
    deposit: 9800,
    dailyUtilities: 320,
    footTraffic: 4,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: businessPremisesId('premises_afimall_foodcourt'),
    name: 'Точка на фудкорте «Афимолл»',
    address: 'Пресненская набережная, 2',
    districtId: districtId('msk_presnya'),
    locationId: locationId('msk_presnya_food_court'),
    areaSqm: 18,
    rentPerWeek: 14500,
    deposit: 14500,
    dailyUtilities: 460,
    footTraffic: 5,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: businessPremisesId('premises_city_office_lobby'),
    name: 'Стойка в деловом квартале',
    address: 'Пресненская набережная, 8с1',
    districtId: districtId('msk_presnya'),
    locationId: locationId('msk_presnya_business_center'),
    areaSqm: 12,
    rentPerWeek: 11800,
    deposit: 11800,
    dailyUtilities: 350,
    footTraffic: 4,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: businessPremisesId('premises_tverskoy_central'),
    name: 'Небольшая точка у Тверской',
    address: 'Тверская улица, 17',
    districtId: districtId('msk_tverskoy'),
    locationId: locationId('msk_tverskoy_gallery'),
    areaSqm: 16,
    rentPerWeek: 15500,
    deposit: 15500,
    dailyUtilities: 420,
    footTraffic: 5,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: businessPremisesId('premises_luzhniki_sport'),
    name: 'Кофейная стойка у «Лужников»',
    address: 'улица Лужники, 24',
    districtId: districtId('msk_khamovniki'),
    locationId: locationId('msk_khamovniki_sports_ground'),
    areaSqm: 13,
    rentPerWeek: 9000,
    deposit: 9000,
    dailyUtilities: 280,
    footTraffic: 3,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  }
];

export function getBusinessPremisesById(id: BusinessPremisesId | undefined): BusinessPremises | undefined {
  return businessPremises.find((premises) => premises.id === id);
}
