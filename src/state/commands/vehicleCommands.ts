import { applyMoneyDelta } from '../../core/economy';
import { addMinutes } from '../../core/time';
import {
  buyNewVehicle,
  buyUsedVehicle,
  inspectUsedVehicle,
  refuelVehicle,
  scheduleUsedVehicleInspection,
  sellOwnedVehicle,
  serviceVehicle
} from '../../core/vehicles';
import { getVehicleModelById } from '../../data/vehicles/vehicleModels';
import type { LocationId, VehicleListingId, VehicleModelId } from '../../types/ids';
import type { VehicleModel, VehicleOperationResult, VehicleWorldState } from '../../types/vehicle';
import { createLifeLogEntry, type GameState, type LifeLogEntry } from '../gameState';
import { advanceWorldTime } from '../worldTimePipeline';

const MASS_DEALER_LOCATION_ID = 'msk_tverskoy_auto_showroom' as LocationId;
const PREMIUM_DEALER_LOCATION_ID = 'msk_khamovniki_import_dealer' as LocationId;

export const GAS_STATION_LOCATION_IDS = [
  'msk_danilovsky_gas_station' as LocationId,
  'msk_presnya_gas_station' as LocationId
];

export const SERVICE_LOCATION_IDS = [
  'msk_tverskoy_service_center' as LocationId,
  MASS_DEALER_LOCATION_ID,
  PREMIUM_DEALER_LOCATION_ID
];

export function getDealerLocationIdForModel(model: VehicleModel): LocationId {
  return model.tier === 'premium' || model.tier === 'luxury'
    ? PREMIUM_DEALER_LOCATION_ID
    : MASS_DEALER_LOCATION_ID;
}

function mergeLifeLog(newEntries: LifeLogEntry[], oldEntries: LifeLogEntry[]): LifeLogEntry[] {
  return [...newEntries, ...oldEntries].slice(0, 16);
}

function applyVehicleOperationState(
  currentState: GameState,
  vehicles: VehicleWorldState,
  result: VehicleOperationResult
): GameState {
  const logEntry = createLifeLogEntry(currentState, result.title, result.message);
  if (!result.ok) {
    return {
      ...currentState,
      lastResult: {
        ok: false,
        actionName: result.title,
        timeDeltaMinutes: 0,
        messages: [result.message]
      },
      lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
    };
  }

  const chargedPlayer = {
    ...currentState.player,
    money: applyMoneyDelta(currentState.player.money, result.moneyDelta ?? 0)
  };
  const nextTime = addMinutes(currentState.time, result.timeDeltaMinutes);
  const elapsedApplied = advanceWorldTime({
    state: currentState,
    player: chargedPlayer,
    nextTime,
    decayProfile: 'active',
    worldOverride: { vehicles },
    actionTitle: result.title
  });
  const messages = [result.message, ...elapsedApplied.messages];

  return {
    ...currentState,
    time: nextTime,
    player: elapsedApplied.player,
    world: elapsedApplied.world,
    lastResult: {
      ok: true,
      actionName: result.title,
      timeDeltaMinutes: result.timeDeltaMinutes,
      moneyDelta: result.moneyDelta,
      needsDelta: elapsedApplied.needsDelta,
      messages
    },
    lifeLog: mergeLifeLog([
      createLifeLogEntry({ time: nextTime }, result.title, messages.join(' ')),
      ...elapsedApplied.lifeLogEntries
    ], currentState.lifeLog)
  };
}

export function scheduleVehicleInspectionCommand(
  currentState: GameState,
  listingId: VehicleListingId
): GameState {
  const applied = scheduleUsedVehicleInspection(currentState.world.vehicles, listingId);
  const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
  return {
    ...currentState,
    world: { ...currentState.world, vehicles: applied.world },
    lastResult: {
      ok: applied.result.ok,
      actionName: applied.result.title,
      timeDeltaMinutes: 0,
      messages: [applied.result.message]
    },
    lifeLog: mergeLifeLog([entry], currentState.lifeLog)
  };
}

export function inspectVehicleCommand(
  currentState: GameState,
  listingId: VehicleListingId
): GameState {
  const applied = inspectUsedVehicle({
    world: currentState.world.vehicles,
    listingId,
    currentLocationId: currentState.player.locationId
  });
  return applyVehicleOperationState(currentState, applied.world, applied.result);
}

export function buyUsedVehicleCommand(
  currentState: GameState,
  listingId: VehicleListingId
): GameState {
  const listing = currentState.world.vehicles.usedListings.find((entry) => entry.id === listingId);
  const model = getVehicleModelById(listing?.modelId);
  if (!listing || !model) return currentState;

  const applied = buyUsedVehicle({
    world: currentState.world.vehicles,
    listingId,
    currentLocationId: currentState.player.locationId,
    bankBalance: currentState.player.money,
    model,
    day: currentState.time.day
  });
  return applyVehicleOperationState(currentState, applied.world, applied.result);
}

export function buyNewVehicleCommand(
  currentState: GameState,
  modelId: VehicleModelId
): GameState {
  const model = getVehicleModelById(modelId);
  if (!model) return currentState;

  const applied = buyNewVehicle({
    world: currentState.world.vehicles,
    model,
    currentLocationId: currentState.player.locationId,
    dealerLocationId: getDealerLocationIdForModel(model),
    bankBalance: currentState.player.money,
    day: currentState.time.day
  });
  return applyVehicleOperationState(currentState, applied.world, applied.result);
}

export function refuelVehicleCommand(currentState: GameState, liters: number): GameState {
  const model = getVehicleModelById(currentState.world.vehicles.ownedVehicle?.modelId);
  if (!model) return currentState;

  const requestedLiters = liters <= 0
    ? Math.ceil(model.fuelTankLiters - (currentState.world.vehicles.ownedVehicle?.fuelLiters ?? 0))
    : liters;
  const applied = refuelVehicle({
    world: currentState.world.vehicles,
    model,
    currentLocationId: currentState.player.locationId,
    gasStationLocationIds: GAS_STATION_LOCATION_IDS,
    liters: requestedLiters,
    bankBalance: currentState.player.money
  });
  return applyVehicleOperationState(currentState, applied.world, applied.result);
}

export function serviceVehicleCommand(currentState: GameState): GameState {
  const model = getVehicleModelById(currentState.world.vehicles.ownedVehicle?.modelId);
  if (!model) return currentState;

  const applied = serviceVehicle({
    world: currentState.world.vehicles,
    model,
    currentLocationId: currentState.player.locationId,
    serviceLocationIds: SERVICE_LOCATION_IDS,
    bankBalance: currentState.player.money
  });
  return applyVehicleOperationState(currentState, applied.world, applied.result);
}

export function sellVehicleCommand(currentState: GameState): GameState {
  const model = getVehicleModelById(currentState.world.vehicles.ownedVehicle?.modelId);
  if (!model) return currentState;

  const applied = sellOwnedVehicle({
    world: currentState.world.vehicles,
    model,
    day: currentState.time.day
  });
  return applyVehicleOperationState(currentState, applied.world, applied.result);
}
