import type { VehicleListingId, VehicleModelId } from '../../types/ids';
import { buyNewVehicleCommand, buyUsedVehicleCommand, inspectVehicleCommand, refuelVehicleCommand, scheduleVehicleInspectionCommand, sellVehicleCommand, serviceVehicleCommand } from '../commands/vehicleCommands';
import type { GameStateSetter } from './commandSupport';

export function createVehicleUiCommands(setGameState: GameStateSetter) {
  function scheduleVehicleInspectionAction(listingId: VehicleListingId): void {
    setGameState((currentState) => scheduleVehicleInspectionCommand(currentState, listingId));
  }

  function inspectVehicleAction(listingId: VehicleListingId): void {
    setGameState((currentState) => inspectVehicleCommand(currentState, listingId));
  }

  function buyUsedVehicleAction(listingId: VehicleListingId): void {
    setGameState((currentState) => buyUsedVehicleCommand(currentState, listingId));
  }

  function buyNewVehicleAction(modelId: VehicleModelId): void {
    setGameState((currentState) => buyNewVehicleCommand(currentState, modelId));
  }

  function refuelOwnedVehicle(liters: number): void {
    setGameState((currentState) => refuelVehicleCommand(currentState, liters));
  }

  function serviceOwnedVehicle(): void {
    setGameState((currentState) => serviceVehicleCommand(currentState));
  }

  function sellOwnedVehicleAction(): void {
    setGameState((currentState) => sellVehicleCommand(currentState));
  }

  return {
    scheduleVehicleInspectionAction,
    inspectVehicleAction,
    buyUsedVehicleAction,
    buyNewVehicleAction,
    refuelOwnedVehicle,
    serviceOwnedVehicle,
    sellOwnedVehicleAction
  };
}
