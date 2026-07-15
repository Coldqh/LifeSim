import { describe, expect, it } from 'vitest';
import { getTotalMinutes } from '../../core/time';
import { newDealerVehicleModels } from '../../data/vehicles/vehicleModels';
import type { VehicleModelId } from '../../types/ids';
import { createInitialGameState } from '../gameState';
import {
  GAS_STATION_LOCATION_IDS,
  buyNewVehicleCommand,
  buyUsedVehicleCommand,
  getDealerLocationIdForModel,
  inspectVehicleCommand,
  refuelVehicleCommand,
  scheduleVehicleInspectionCommand,
  sellVehicleCommand,
  serviceVehicleCommand
} from './vehicleCommands';

function createRichState() {
  const state = createInitialGameState();
  return {
    ...state,
    player: {
      ...state.player,
      money: 50_000_000
    }
  };
}

describe('vehicle commands', () => {
  it('schedules an inspection without advancing time', () => {
    const state = createInitialGameState();
    const listing = state.world.vehicles.usedListings[0];
    const result = scheduleVehicleInspectionCommand(state, listing.id);

    expect(result.world.vehicles.scheduledInspectionListingId).toBe(listing.id);
    expect(result.time).toEqual(state.time);
    expect(result.lastResult?.ok).toBe(true);
  });

  it('inspects a listing and applies elapsed world time once', () => {
    const state = createInitialGameState();
    const listing = state.world.vehicles.usedListings[0];
    const atSeller = {
      ...state,
      player: { ...state.player, locationId: listing.sellerLocationId }
    };
    const result = inspectVehicleCommand(atSeller, listing.id);

    expect(result.world.vehicles.inspectedListingIds).toContain(listing.id);
    expect(getTotalMinutes(result.time) - getTotalMinutes(state.time)).toBe(45);
    expect(result.lastResult?.actionName).toBe('Автомобиль осмотрен');
  });

  it('buys an inspected used vehicle through one state command', () => {
    const state = createRichState();
    const listing = state.world.vehicles.usedListings[0];
    const prepared = {
      ...state,
      player: { ...state.player, locationId: listing.sellerLocationId },
      world: {
        ...state.world,
        vehicles: {
          ...state.world.vehicles,
          inspectedListingIds: [listing.id]
        }
      }
    };
    const result = buyUsedVehicleCommand(prepared, listing.id);

    expect(result.world.vehicles.ownedVehicle?.modelId).toBe(listing.modelId);
    expect(result.player.money).toBe(prepared.player.money - listing.price);
    expect(getTotalMinutes(result.time) - getTotalMinutes(prepared.time)).toBe(30);
  });

  it('buys a new vehicle at the configured dealer', () => {
    const state = createRichState();
    const model = newDealerVehicleModels[0];
    const atDealer = {
      ...state,
      player: {
        ...state.player,
        locationId: getDealerLocationIdForModel(model)
      }
    };
    const result = buyNewVehicleCommand(atDealer, model.id);

    expect(result.world.vehicles.ownedVehicle?.modelId).toBe(model.id);
    expect(result.player.money).toBe(atDealer.player.money - model.newPrice);
    expect(getTotalMinutes(result.time) - getTotalMinutes(atDealer.time)).toBe(60);
  });

  it('preserves state when an unknown model is requested', () => {
    const state = createInitialGameState();
    const result = buyNewVehicleCommand(state, 'missing-model' as VehicleModelId);

    expect(result).toBe(state);
  });

  it('refuels, services and sells an owned vehicle through pure commands', () => {
    const state = createRichState();
    const model = newDealerVehicleModels[0];
    const bought = buyNewVehicleCommand({
      ...state,
      player: { ...state.player, locationId: getDealerLocationIdForModel(model) }
    }, model.id);
    const ownedVehicle = bought.world.vehicles.ownedVehicle!;
    const lowFuelState = {
      ...bought,
      player: { ...bought.player, locationId: GAS_STATION_LOCATION_IDS[0] },
      world: {
        ...bought.world,
        vehicles: {
          ...bought.world.vehicles,
          ownedVehicle: { ...ownedVehicle, fuelLiters: 1, parkedLocationId: GAS_STATION_LOCATION_IDS[0] }
        }
      }
    };

    const refueled = refuelVehicleCommand(lowFuelState, 0);
    expect(refueled.world.vehicles.ownedVehicle?.fuelLiters).toBe(model.fuelTankLiters);

    const serviceLocationId = getDealerLocationIdForModel(model);
    const atService = {
      ...refueled,
      player: { ...refueled.player, locationId: serviceLocationId },
      world: {
        ...refueled.world,
        vehicles: {
          ...refueled.world.vehicles,
          ownedVehicle: refueled.world.vehicles.ownedVehicle
            ? { ...refueled.world.vehicles.ownedVehicle, parkedLocationId: serviceLocationId }
            : undefined
        }
      }
    };
    const serviced = serviceVehicleCommand(atService);
    expect(serviced.lastResult?.ok).toBe(true);

    const sold = sellVehicleCommand(serviced);
    expect(sold.world.vehicles.ownedVehicle).toBeUndefined();
    expect(sold.player.money).toBeGreaterThan(serviced.player.money);
  });
});
