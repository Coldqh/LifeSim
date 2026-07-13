import type { DistrictId, LocationId, VehicleListingId, VehicleModelId } from '../../types/ids';
import type { UsedVehicleListing } from '../../types/vehicle';

function id<T>(value: string): T { return value as T; }

export const usedVehicleListingTemplates: Omit<UsedVehicleListing, 'publishedDay' | 'expiresDay'>[] = [
  {
    id: id<VehicleListingId>('used_granta_2018'), modelId: id<VehicleModelId>('lada_granta_2018'), year: 2018,
    price: 690000, mileageKm: 94000, condition: 'fair', conditionPercent: 63,
    districtId: id<DistrictId>('msk_danilovsky'), sellerLocationId: id<LocationId>('msk_danilovsky_auto_market'),
    sellerName: 'Частный продавец', hiddenDefectIds: ['brakes_worn', 'body_repainted']
  },
  {
    id: id<VehicleListingId>('used_solaris_2017'), modelId: id<VehicleModelId>('hyundai_solaris_2017'), year: 2017,
    price: 1120000, mileageKm: 128000, condition: 'good', conditionPercent: 72,
    districtId: id<DistrictId>('msk_danilovsky'), sellerLocationId: id<LocationId>('msk_danilovsky_auto_market'),
    sellerName: 'Авто.ру Проверенные', hiddenDefectIds: ['battery_weak']
  },
  {
    id: id<VehicleListingId>('used_rio_2020'), modelId: id<VehicleModelId>('kia_rio_2020'), year: 2020,
    price: 1580000, mileageKm: 76000, condition: 'good', conditionPercent: 79,
    districtId: id<DistrictId>('msk_presnya'), sellerLocationId: id<LocationId>('msk_presnya_auto_market'),
    sellerName: 'Авто.ру Проверенные', hiddenDefectIds: ['tires_worn']
  },
  {
    id: id<VehicleListingId>('used_rapid_2020'), modelId: id<VehicleModelId>('skoda_rapid_2020'), year: 2020,
    price: 1690000, mileageKm: 81000, condition: 'good', conditionPercent: 77,
    districtId: id<DistrictId>('msk_presnya'), sellerLocationId: id<LocationId>('msk_presnya_auto_market'),
    sellerName: 'Мультибренд с пробегом', hiddenDefectIds: ['oil_service_due']
  },
  {
    id: id<VehicleListingId>('used_camry_2019'), modelId: id<VehicleModelId>('toyota_camry_2019'), year: 2019,
    price: 3290000, mileageKm: 119000, condition: 'good', conditionPercent: 75,
    districtId: id<DistrictId>('msk_tverskoy'), sellerLocationId: id<LocationId>('msk_tverskoy_auto_showroom'),
    sellerName: 'Премиум авто с пробегом', hiddenDefectIds: ['suspension_worn', 'body_repainted']
  },
  {
    id: id<VehicleListingId>('used_bmw_530d_2018'), modelId: id<VehicleModelId>('bmw_530d_2018'), year: 2018,
    price: 4650000, mileageKm: 142000, condition: 'fair', conditionPercent: 68,
    districtId: id<DistrictId>('msk_tverskoy'), sellerLocationId: id<LocationId>('msk_tverskoy_auto_showroom'),
    sellerName: 'Премиум авто с пробегом', hiddenDefectIds: ['suspension_worn', 'oil_service_due']
  },
  {
    id: id<VehicleListingId>('used_cayenne_2019'), modelId: id<VehicleModelId>('porsche_cayenne_2019'), year: 2019,
    price: 8950000, mileageKm: 97000, condition: 'good', conditionPercent: 74,
    districtId: id<DistrictId>('msk_khamovniki'), sellerLocationId: id<LocationId>('msk_khamovniki_import_dealer'),
    sellerName: 'Импорт Премиум', hiddenDefectIds: ['brakes_worn', 'tires_worn', 'oil_service_due']
  }
];
