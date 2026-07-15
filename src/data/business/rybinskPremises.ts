import type { BusinessPremises } from '../../types/business';
import type { BusinessPremisesId, DistrictId, LocationId } from '../../types/ids';
import { BUSINESS_TYPE_IDS } from './businessTypes';

const premisesId = (value: string) => value as BusinessPremisesId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;

export const rybinskBusinessPremises: BusinessPremises[] = [
  {
    id: premisesId('premises_ryb_center_station_coffee'), name: 'Кофейная стойка у вокзала', address: 'Вокзальная пл., 1',
    districtId: districtId('ryb_center'), locationId: locationId('ryb_center_station'), areaSqm: 11,
    rentPerWeek: 4800, deposit: 4800, dailyUtilities: 180, footTraffic: 3,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: premisesId('premises_ryb_center_embankment'), name: 'Павильон на набережной', address: 'Волжская наб., 37',
    districtId: districtId('ryb_center'), locationId: locationId('ryb_center_embankment'), areaSqm: 14,
    rentPerWeek: 6200, deposit: 6200, dailyUtilities: 220, footTraffic: 4,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: premisesId('premises_ryb_severny_mall'), name: 'Островок в ТЦ «Север»', address: 'просп. Серова, 41',
    districtId: districtId('ryb_severny'), locationId: locationId('ryb_severny_mall'), areaSqm: 13,
    rentPerWeek: 5700, deposit: 5700, dailyUtilities: 210, footTraffic: 3,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  },
  {
    id: premisesId('premises_ryb_perebory_service'), name: 'Павильон в Переборах', address: 'Инженерная ул., 20',
    districtId: districtId('ryb_perebory'), locationId: locationId('ryb_perebory_business_point'), areaSqm: 16,
    rentPerWeek: 3500, deposit: 3500, dailyUtilities: 150, footTraffic: 2,
    allowedBusinessTypeIds: [BUSINESS_TYPE_IDS.takeawayCoffee]
  }
];
