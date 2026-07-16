import { applyMoneyDelta } from '../../core/economy';
import { getDefaultLocationForDistrict, getDistrictById, getLocationById } from '../../core/location';
import { applyNeedsDelta, getNeedWarning } from '../../core/needs';
import { addMinutes } from '../../core/time';
import { applyVehicleTravel, calculateVehicleTravelQuote } from '../../core/vehicles';
import { calculateDistrictTravel, calculateLocationTravel, getTravelDurationMinutes } from '../../core/travel';
import { getWorldDynamicsModifiers } from '../../core/world-dynamics';
import { getVehicleModelById } from '../../data/vehicles/vehicleModels';
import type { DistrictId, LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog, calculatePersonalCarTravel } from './commandSupport';

export function createTravelCommands(setGameState: GameStateSetter) {
  function moveToDistrict(districtId: DistrictId, modeId: TravelModeId): void {
    const district = getDistrictById(districtId);
    const defaultLocation = getDefaultLocationForDistrict(districtId);
    if (!district || !defaultLocation) return;

    setGameState((currentState) => {
      if (district.cityId !== currentState.player.cityId) {
        return {
          ...currentState,
          lastResult: { ok: false, timeDeltaMinutes: 0, messages: ['Между городами нужно ехать через приложение «Поездки».'] }
        };
      }
      const currentLocation = getLocationById(currentState.player.locationId);
      const worldModifiers = getWorldDynamicsModifiers(currentState.world.dynamics, currentState.player.cityId, currentState.time.day);
      const travel = modeId === 'car'
        ? calculatePersonalCarTravel({
            world: currentState.world.vehicles,
            fromLocation: currentLocation,
            toLocation: defaultLocation,
            kind: 'district'
          })
        : calculateDistrictTravel({
            fromLocation: currentLocation,
            toDistrict: district,
            toLocation: defaultLocation,
            modeId,
            context: {
              playerMoney: currentState.player.money,
              playerNeeds: currentState.player.needs,
              publicTransportDurationMultiplier: worldModifiers.publicTransportDurationMultiplier
            }
          });

      if (!travel.ok) {
        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            needsDelta: travel.needsDelta,
            messages: [travel.message]
          }
        };
      }

      const nextTime = addMinutes(currentState.time, travel.durationMinutes);
      const nextNeeds = applyNeedsDelta(currentState.player.needs, travel.needsDelta);
      const nextMoney = applyMoneyDelta(currentState.player.money, -(travel.moneyCost ?? 0));
      const warning = getNeedWarning(nextNeeds);
      const messages = warning ? [travel.message, warning] : [travel.message];
      const movedPlayer = {
        ...currentState.player,
        money: nextMoney,
        needs: nextNeeds,
        cityId: district.cityId,
        districtId: district.id,
        locationId: defaultLocation.id
      };
      const vehicleQuote = modeId === 'car'
        ? calculateVehicleTravelQuote({
            vehicle: currentState.world.vehicles.ownedVehicle,
            model: getVehicleModelById(currentState.world.vehicles.ownedVehicle?.modelId),
            fromLocationId: currentLocation?.id,
            toLocationId: defaultLocation.id,
            fromDistrictId: currentLocation?.districtId,
            toDistrictId: defaultLocation.districtId,
            baseDurationMinutes: currentLocation ? getTravelDurationMinutes(currentLocation, defaultLocation) : 0
          })
        : undefined;
      const vehicles = vehicleQuote?.available
        ? applyVehicleTravel(currentState.world.vehicles, vehicleQuote, defaultLocation.id)
        : currentState.world.vehicles;
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        movedPlayer,
        nextTime,
        'active',
        { vehicles, actionTitle: 'Перемещение' }
      );
      const resultMessages = [...messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', resultMessages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          timeDeltaMinutes: travel.durationMinutes,
          moneyDelta: -(travel.moneyCost ?? 0),
          needsDelta: mergeNeedsDelta(travel.needsDelta, elapsedApplied.needsDelta),
          locationDelta: defaultLocation.id,
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function moveToLocation(locationId: LocationId, modeId: TravelModeId): void {
    const location = getLocationById(locationId);
    if (!location) return;

    setGameState((currentState) => {
      if (location.cityId !== currentState.player.cityId) {
        return {
          ...currentState,
          lastResult: { ok: false, timeDeltaMinutes: 0, messages: ['Между городами нужно ехать через приложение «Поездки».'] }
        };
      }
      const currentLocation = getLocationById(currentState.player.locationId);
      const worldModifiers = getWorldDynamicsModifiers(currentState.world.dynamics, currentState.player.cityId, currentState.time.day);
      const travel = modeId === 'car'
        ? calculatePersonalCarTravel({
            world: currentState.world.vehicles,
            fromLocation: currentLocation,
            toLocation: location,
            kind: 'location'
          })
        : calculateLocationTravel({
            fromLocation: currentLocation,
            toLocation: location,
            modeId,
            context: {
              playerMoney: currentState.player.money,
              playerNeeds: currentState.player.needs,
              publicTransportDurationMultiplier: worldModifiers.publicTransportDurationMultiplier
            }
          });

      if (!travel.ok) {
        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            needsDelta: travel.needsDelta,
            messages: [travel.message]
          }
        };
      }

      const nextTime = addMinutes(currentState.time, travel.durationMinutes);
      const nextNeeds = applyNeedsDelta(currentState.player.needs, travel.needsDelta);
      const nextMoney = applyMoneyDelta(currentState.player.money, -(travel.moneyCost ?? 0));
      const warning = getNeedWarning(nextNeeds);
      const messages = warning ? [travel.message, warning] : [travel.message];
      const movedPlayer = {
        ...currentState.player,
        money: nextMoney,
        needs: nextNeeds,
        cityId: location.cityId,
        districtId: location.districtId,
        locationId: location.id
      };
      const vehicleQuote = modeId === 'car'
        ? calculateVehicleTravelQuote({
            vehicle: currentState.world.vehicles.ownedVehicle,
            model: getVehicleModelById(currentState.world.vehicles.ownedVehicle?.modelId),
            fromLocationId: currentLocation?.id,
            toLocationId: location.id,
            fromDistrictId: currentLocation?.districtId,
            toDistrictId: location.districtId,
            baseDurationMinutes: currentLocation ? getTravelDurationMinutes(currentLocation, location) : 0
          })
        : undefined;
      const vehicles = vehicleQuote?.available
        ? applyVehicleTravel(currentState.world.vehicles, vehicleQuote, location.id)
        : currentState.world.vehicles;
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        movedPlayer,
        nextTime,
        'active',
        { vehicles, actionTitle: 'Перемещение' }
      );
      const resultMessages = [...messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', resultMessages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          timeDeltaMinutes: travel.durationMinutes,
          moneyDelta: -(travel.moneyCost ?? 0),
          needsDelta: mergeNeedsDelta(travel.needsDelta, elapsedApplied.needsDelta),
          locationDelta: location.id,
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    moveToDistrict,
    moveToLocation
  };
}
