import type { DistrictId, LocationId, VehicleListingId, VehicleModelId } from '../../types/ids';
import type { GameTime } from '../../types/time';
import type {
  OwnedVehicle,
  UsedVehicleListing,
  VehicleDefectId,
  VehicleModel,
  VehicleOperationResult,
  VehicleTravelQuote,
  VehicleWorldState
} from '../../types/vehicle';
import { getTotalMinutes } from '../time';

const FUEL_PRICE_PER_LITER: Record<VehicleModel['fuelType'], number> = {
  petrol_92: 62,
  petrol_95: 68,
  diesel: 74
};

export const VEHICLE_INSPECTION_DURATION_MINUTES = 45;
export const NEW_VEHICLE_TEST_DRIVE_MINUTES = 30;
export const VEHICLE_SERVICE_DURATION_MINUTES = 120;

export const VEHICLE_DEFECT_LABELS: Record<VehicleDefectId, string> = {
  brakes_worn: 'Изношены тормоза',
  battery_weak: 'Слабый аккумулятор',
  suspension_worn: 'Есть вопросы к подвеске',
  oil_service_due: 'Нужно заменить масло',
  body_repainted: 'Есть окрашенные элементы кузова',
  tires_worn: 'Изношены шины'
};

export function createInitialVehicleWorld(seed: number, day: number, templates: Omit<UsedVehicleListing, 'publishedDay' | 'expiresDay'>[]): VehicleWorldState {
  return {
    seed: seed ^ 0x7135ac,
    lastMarketRefreshDay: day,
    usedListings: templates.map((listing, index) => ({
      ...listing,
      publishedDay: day,
      expiresDay: day + 5 + (index % 3)
    })),
    inspectedListingIds: []
  };
}

export function refreshVehicleMarket(input: {
  world: VehicleWorldState;
  day: number;
  templates: Omit<UsedVehicleListing, 'publishedDay' | 'expiresDay'>[];
}): VehicleWorldState {
  if (input.day - input.world.lastMarketRefreshDay < 5) return input.world;
  const cycle = Math.floor(input.day / 5);
  const rotated = input.templates.map((_, index, source) => source[(index + cycle) % source.length]);
  return {
    ...input.world,
    lastMarketRefreshDay: input.day,
    usedListings: rotated.map((listing, index) => ({
      ...listing,
      price: Math.round(listing.price * (0.97 + ((cycle + index) % 5) * 0.012) / 10000) * 10000,
      publishedDay: input.day,
      expiresDay: input.day + 5 + (index % 3)
    })),
    inspectedListingIds: input.world.inspectedListingIds.filter((id) => rotated.some((listing) => listing.id === id)),
    scheduledInspectionListingId: undefined
  };
}

export function scheduleUsedVehicleInspection(world: VehicleWorldState, listingId: VehicleListingId): { world: VehicleWorldState; result: VehicleOperationResult } {
  const listing = world.usedListings.find((item) => item.id === listingId);
  if (!listing) return { world, result: { ok: false, title: 'Осмотр автомобиля', message: 'Объявление больше недоступно.', timeDeltaMinutes: 0 } };
  return {
    world: { ...world, scheduledInspectionListingId: listingId },
    result: { ok: true, title: 'Осмотр назначен', message: 'Приезжай к продавцу и проведи диагностику автомобиля.', timeDeltaMinutes: 0 }
  };
}

export function inspectUsedVehicle(input: {
  world: VehicleWorldState;
  listingId: VehicleListingId;
  currentLocationId?: LocationId;
}): { world: VehicleWorldState; result: VehicleOperationResult } {
  const listing = input.world.usedListings.find((item) => item.id === input.listingId);
  if (!listing) return { world: input.world, result: { ok: false, title: 'Осмотр автомобиля', message: 'Объявление больше недоступно.', timeDeltaMinutes: 0 } };
  if (input.currentLocationId !== listing.sellerLocationId) {
    return { world: input.world, result: { ok: false, title: 'Осмотр автомобиля', message: 'Нужно приехать к продавцу.', timeDeltaMinutes: 0 } };
  }
  return {
    world: {
      ...input.world,
      inspectedListingIds: Array.from(new Set([...input.world.inspectedListingIds, listing.id])),
      scheduledInspectionListingId: undefined
    },
    result: {
      ok: true,
      title: 'Автомобиль осмотрен',
      message: listing.hiddenDefectIds.length > 0
        ? `Диагностика завершена. Найдено проблем: ${listing.hiddenDefectIds.length}.`
        : 'Диагностика завершена. Серьёзных проблем не найдено.',
      timeDeltaMinutes: VEHICLE_INSPECTION_DURATION_MINUTES
    }
  };
}

export function buyUsedVehicle(input: {
  world: VehicleWorldState;
  listingId: VehicleListingId;
  currentLocationId?: LocationId;
  bankBalance: number;
  model: VehicleModel;
  day: number;
}): { world: VehicleWorldState; result: VehicleOperationResult } {
  const listing = input.world.usedListings.find((item) => item.id === input.listingId);
  if (!listing) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: 'Объявление больше недоступно.', timeDeltaMinutes: 0 } };
  if (input.world.ownedVehicle) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: 'Сначала продай текущую машину.', timeDeltaMinutes: 0 } };
  if (!input.world.inspectedListingIds.includes(listing.id)) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: 'Сначала проведи осмотр.', timeDeltaMinutes: 0 } };
  if (input.currentLocationId !== listing.sellerLocationId) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: 'Нужно находиться у продавца.', timeDeltaMinutes: 0 } };
  if (input.bankBalance < listing.price) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: `Не хватает ${listing.price - input.bankBalance} ₽.`, timeDeltaMinutes: 0 } };
  const vehicle: OwnedVehicle = {
    modelId: input.model.id,
    source: 'used_market',
    purchasePrice: listing.price,
    purchaseDay: input.day,
    year: listing.year,
    odometerKm: listing.mileageKm,
    fuelLiters: Math.round(input.model.fuelTankLiters * 0.35),
    conditionPercent: listing.conditionPercent,
    reliabilityPercent: Math.max(25, Math.round((input.model.reliability + listing.conditionPercent) / 2)),
    parkedLocationId: listing.sellerLocationId,
    nextServiceOdometerKm: listing.mileageKm + Math.min(5000, input.model.serviceIntervalKm),
    knownDefectIds: listing.hiddenDefectIds
  };
  return {
    world: {
      ...input.world,
      ownedVehicle: vehicle,
      usedListings: input.world.usedListings.filter((item) => item.id !== listing.id),
      inspectedListingIds: input.world.inspectedListingIds.filter((id) => id !== listing.id),
      scheduledInspectionListingId: undefined
    },
    result: { ok: true, title: 'Автомобиль куплен', message: `${input.model.brand} ${input.model.model} теперь твой.`, timeDeltaMinutes: 30, moneyDelta: -listing.price }
  };
}

export function buyNewVehicle(input: {
  world: VehicleWorldState;
  model: VehicleModel;
  currentLocationId?: LocationId;
  dealerLocationId: LocationId;
  bankBalance: number;
  day: number;
}): { world: VehicleWorldState; result: VehicleOperationResult } {
  if (input.world.ownedVehicle) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: 'Сначала продай текущую машину.', timeDeltaMinutes: 0 } };
  if (!input.model.dealerAvailable || input.model.newPrice <= 0) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: 'Эта модель недоступна новой.', timeDeltaMinutes: 0 } };
  if (input.currentLocationId !== input.dealerLocationId) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: 'Нужно приехать в автосалон.', timeDeltaMinutes: 0 } };
  if (input.bankBalance < input.model.newPrice) return { world: input.world, result: { ok: false, title: 'Покупка автомобиля', message: `Не хватает ${input.model.newPrice - input.bankBalance} ₽.`, timeDeltaMinutes: 0 } };
  return {
    world: {
      ...input.world,
      ownedVehicle: {
        modelId: input.model.id,
        source: 'dealer',
        purchasePrice: input.model.newPrice,
        purchaseDay: input.day,
        year: 2026,
        odometerKm: 12,
        fuelLiters: Math.round(input.model.fuelTankLiters * 0.6),
        conditionPercent: 100,
        reliabilityPercent: input.model.reliability,
        parkedLocationId: input.dealerLocationId,
        nextServiceOdometerKm: input.model.serviceIntervalKm,
        knownDefectIds: []
      }
    },
    result: { ok: true, title: 'Новый автомобиль куплен', message: `${input.model.brand} ${input.model.model} выдан в автосалоне.`, timeDeltaMinutes: 60, moneyDelta: -input.model.newPrice }
  };
}

export function calculateVehicleTravelQuote(input: {
  vehicle: OwnedVehicle | undefined;
  model: VehicleModel | undefined;
  fromLocationId?: LocationId;
  toLocationId?: LocationId;
  fromDistrictId?: DistrictId;
  toDistrictId?: DistrictId;
  baseDurationMinutes: number;
}): VehicleTravelQuote {
  const { vehicle, model } = input;
  if (!vehicle || !model) return { durationMinutes: 0, distanceKm: 0, fuelLiters: 0, parkingCost: 0, available: false, unavailableReason: 'Нет личного автомобиля.' };
  if (vehicle.parkedLocationId !== input.fromLocationId) return { durationMinutes: 0, distanceKm: 0, fuelLiters: 0, parkingCost: 0, available: false, unavailableReason: 'Автомобиль оставлен в другом месте.' };
  if (vehicle.conditionPercent < 20) return { durationMinutes: 0, distanceKm: 0, fuelLiters: 0, parkingCost: 0, available: false, unavailableReason: 'Автомобиль требует ремонта.' };
  const crossDistrict = input.fromDistrictId !== input.toDistrictId;
  const distanceKm = Math.max(crossDistrict ? 9 : 2.5, Number((input.baseDurationMinutes * (crossDistrict ? 0.34 : 0.22)).toFixed(1)));
  const fuelLiters = Number((distanceKm * model.consumptionLitersPer100Km / 100).toFixed(2));
  const parkingCostByDistrict: Record<string, number> = {
    msk_danilovsky: 120,
    msk_presnya: 320,
    msk_tverskoy: 450,
    msk_khamovniki: 280
  };
  const parkingCost = parkingCostByDistrict[String(input.toDistrictId)] ?? 180;
  if (vehicle.fuelLiters < fuelLiters) return { durationMinutes: 0, distanceKm, fuelLiters, parkingCost, available: false, unavailableReason: 'Недостаточно топлива.' };
  return {
    durationMinutes: Math.max(crossDistrict ? 12 : 5, Math.round(input.baseDurationMinutes * 0.42)),
    distanceKm,
    fuelLiters,
    parkingCost,
    available: true
  };
}

export function applyVehicleTravel(world: VehicleWorldState, quote: VehicleTravelQuote, destinationId: LocationId): VehicleWorldState {
  if (!world.ownedVehicle || !quote.available) return world;
  const serviceOverdue = world.ownedVehicle.odometerKm >= world.ownedVehicle.nextServiceOdometerKm;
  return {
    ...world,
    ownedVehicle: {
      ...world.ownedVehicle,
      fuelLiters: Math.max(0, Number((world.ownedVehicle.fuelLiters - quote.fuelLiters).toFixed(2))),
      odometerKm: Number((world.ownedVehicle.odometerKm + quote.distanceKm).toFixed(1)),
      conditionPercent: Math.max(10, world.ownedVehicle.conditionPercent - (serviceOverdue ? 1 : 0)),
      parkedLocationId: destinationId
    }
  };
}

export function refuelVehicle(input: {
  world: VehicleWorldState;
  model: VehicleModel;
  currentLocationId?: LocationId;
  gasStationLocationIds: LocationId[];
  liters: number;
  bankBalance: number;
}): { world: VehicleWorldState; result: VehicleOperationResult } {
  const vehicle = input.world.ownedVehicle;
  if (!vehicle) return { world: input.world, result: { ok: false, title: 'Заправка', message: 'Нет автомобиля.', timeDeltaMinutes: 0 } };
  if (!input.currentLocationId || !input.gasStationLocationIds.includes(input.currentLocationId)) return { world: input.world, result: { ok: false, title: 'Заправка', message: 'Нужно приехать на АЗС.', timeDeltaMinutes: 0 } };
  if (vehicle.parkedLocationId !== input.currentLocationId) return { world: input.world, result: { ok: false, title: 'Заправка', message: 'Автомобиль находится в другом месте.', timeDeltaMinutes: 0 } };
  const capacity = Math.max(0, input.model.fuelTankLiters - vehicle.fuelLiters);
  const liters = Math.min(capacity, Math.max(1, Math.floor(input.liters)));
  const cost = Math.round(liters * FUEL_PRICE_PER_LITER[input.model.fuelType]);
  if (input.bankBalance < cost) return { world: input.world, result: { ok: false, title: 'Заправка', message: `Не хватает ${cost - input.bankBalance} ₽.`, timeDeltaMinutes: 0 } };
  return {
    world: { ...input.world, ownedVehicle: { ...vehicle, fuelLiters: Number((vehicle.fuelLiters + liters).toFixed(1)) } },
    result: { ok: true, title: 'Заправка', message: `Заправлено ${liters} л. Списано ${cost} ₽.`, timeDeltaMinutes: 10, moneyDelta: -cost }
  };
}

export function serviceVehicle(input: {
  world: VehicleWorldState;
  model: VehicleModel;
  currentLocationId?: LocationId;
  serviceLocationIds: LocationId[];
  bankBalance: number;
}): { world: VehicleWorldState; result: VehicleOperationResult } {
  const vehicle = input.world.ownedVehicle;
  if (!vehicle) return { world: input.world, result: { ok: false, title: 'Техническое обслуживание', message: 'Нет автомобиля.', timeDeltaMinutes: 0 } };
  if (!input.currentLocationId || !input.serviceLocationIds.includes(input.currentLocationId)) return { world: input.world, result: { ok: false, title: 'Техническое обслуживание', message: 'Нужно приехать в сервис.', timeDeltaMinutes: 0 } };
  if (vehicle.parkedLocationId !== input.currentLocationId) return { world: input.world, result: { ok: false, title: 'Техническое обслуживание', message: 'Автомобиль находится в другом месте.', timeDeltaMinutes: 0 } };
  const defectCost = vehicle.knownDefectIds.length * Math.round(input.model.baseServiceCost * 0.2);
  const cost = input.model.baseServiceCost + defectCost;
  if (input.bankBalance < cost) return { world: input.world, result: { ok: false, title: 'Техническое обслуживание', message: `Не хватает ${cost - input.bankBalance} ₽.`, timeDeltaMinutes: 0 } };
  return {
    world: {
      ...input.world,
      ownedVehicle: {
        ...vehicle,
        conditionPercent: Math.min(100, vehicle.conditionPercent + 15 + vehicle.knownDefectIds.length * 3),
        reliabilityPercent: Math.min(100, vehicle.reliabilityPercent + 6),
        nextServiceOdometerKm: vehicle.odometerKm + input.model.serviceIntervalKm,
        knownDefectIds: []
      }
    },
    result: { ok: true, title: 'ТО выполнено', message: `Автомобиль обслужен. Списано ${cost} ₽.`, timeDeltaMinutes: VEHICLE_SERVICE_DURATION_MINUTES, moneyDelta: -cost }
  };
}

export function sellOwnedVehicle(input: { world: VehicleWorldState; model: VehicleModel; day: number }): { world: VehicleWorldState; result: VehicleOperationResult } {
  const vehicle = input.world.ownedVehicle;
  if (!vehicle) return { world: input.world, result: { ok: false, title: 'Продажа автомобиля', message: 'Нет автомобиля для продажи.', timeDeltaMinutes: 0 } };
  const ageFactor = Math.max(0.36, 1 - Math.max(0, 2026 - vehicle.year) * 0.045);
  const conditionFactor = 0.55 + vehicle.conditionPercent / 220;
  const base = vehicle.source === 'dealer' ? input.model.newPrice : vehicle.purchasePrice;
  const price = Math.max(100000, Math.round(base * ageFactor * conditionFactor / 10000) * 10000);
  return {
    world: { ...input.world, ownedVehicle: undefined },
    result: { ok: true, title: 'Автомобиль продан', message: `${input.model.brand} ${input.model.model} продан за ${price} ₽.`, timeDeltaMinutes: 60, moneyDelta: price }
  };
}

export function getVehicleMarketTime(world: VehicleWorldState, time: GameTime): number {
  return Math.max(0, getTotalMinutes(time) - world.lastMarketRefreshDay * 1440);
}
