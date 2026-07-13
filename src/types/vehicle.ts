import type { DistrictId, LocationId, VehicleListingId, VehicleModelId } from './ids';

export type VehicleTier = 'budget' | 'mass' | 'business' | 'premium' | 'luxury';
export type VehicleBodyType = 'sedan' | 'hatchback' | 'liftback' | 'crossover' | 'suv';
export type VehicleFuelType = 'petrol_92' | 'petrol_95' | 'diesel';
export type VehicleMarketSource = 'used_market' | 'dealer';
export type VehicleCondition = 'poor' | 'fair' | 'good' | 'excellent' | 'new';
export type VehicleDefectId =
  | 'brakes_worn'
  | 'battery_weak'
  | 'suspension_worn'
  | 'oil_service_due'
  | 'body_repainted'
  | 'tires_worn';

export type VehicleModel = {
  id: VehicleModelId;
  brand: string;
  model: string;
  generation: string;
  tier: VehicleTier;
  bodyType: VehicleBodyType;
  fuelType: VehicleFuelType;
  powerHp: number;
  fuelTankLiters: number;
  consumptionLitersPer100Km: number;
  reliability: number;
  serviceIntervalKm: number;
  baseServiceCost: number;
  newPrice: number;
  dealerAvailable: boolean;
  description: string;
};

export type UsedVehicleListing = {
  id: VehicleListingId;
  modelId: VehicleModelId;
  year: number;
  price: number;
  mileageKm: number;
  condition: VehicleCondition;
  conditionPercent: number;
  districtId: DistrictId;
  sellerLocationId: LocationId;
  sellerName: string;
  hiddenDefectIds: VehicleDefectId[];
  publishedDay: number;
  expiresDay: number;
};

export type OwnedVehicle = {
  modelId: VehicleModelId;
  source: VehicleMarketSource;
  purchasePrice: number;
  purchaseDay: number;
  year: number;
  odometerKm: number;
  fuelLiters: number;
  conditionPercent: number;
  reliabilityPercent: number;
  parkedLocationId: LocationId;
  nextServiceOdometerKm: number;
  knownDefectIds: VehicleDefectId[];
};

export type VehicleWorldState = {
  seed: number;
  lastMarketRefreshDay: number;
  usedListings: UsedVehicleListing[];
  inspectedListingIds: VehicleListingId[];
  scheduledInspectionListingId?: VehicleListingId;
  ownedVehicle?: OwnedVehicle;
};

export type VehicleTravelQuote = {
  durationMinutes: number;
  distanceKm: number;
  fuelLiters: number;
  parkingCost: number;
  available: boolean;
  unavailableReason?: string;
};

export type VehicleOperationResult = {
  ok: boolean;
  title: string;
  message: string;
  timeDeltaMinutes: number;
  moneyDelta?: number;
};

export type VehicleListingView = {
  listing: UsedVehicleListing;
  model: VehicleModel;
  inspected: boolean;
  scheduled: boolean;
  isAtSeller: boolean;
  revealedDefects: VehicleDefectId[];
};
