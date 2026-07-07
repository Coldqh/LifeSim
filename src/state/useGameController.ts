import { useEffect, useMemo, useState } from 'react';
import { applyLifeAction } from '../core/actions';
import {
  getActionsForLocation,
  getCityById,
  getDefaultLocationForDistrict,
  getDistrictById,
  getDistrictsForCity,
  getLocationById,
  getLocationsForDistrict,
  isActionAvailableAtLocation
} from '../core/location';
import { getLifeAction } from '../data';
import type { ActionId, DistrictId, LocationId } from '../types/ids';
import {
  clearSavedGameState,
  createInitialGameState,
  createLifeLogEntry,
  loadGameState,
  saveGameState,
  type GameState
} from './gameState';

function resolveInitialState(): GameState {
  return loadGameState() ?? createInitialGameState();
}

export function useGameController() {
  const [gameState, setGameState] = useState<GameState>(resolveInitialState);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const locationState = useMemo(() => {
    const city = getCityById(gameState.player.cityId);
    const district = getDistrictById(gameState.player.districtId);
    const location = getLocationById(gameState.player.locationId);
    const districts = city ? getDistrictsForCity(city.id) : [];
    const locations = district ? getLocationsForDistrict(district.id) : [];
    const actions = getActionsForLocation(location?.id);

    return {
      city,
      district,
      location,
      districts,
      locations,
      actions
    };
  }, [gameState.player.cityId, gameState.player.districtId, gameState.player.locationId]);

  function performAction(actionId: ActionId): void {
    const action = getLifeAction(actionId);
    if (!action) return;

    setGameState((currentState) => {
      if (!isActionAvailableAtLocation(currentState.player.locationId, actionId)) {
        const logEntry = createLifeLogEntry(currentState, 'Действие недоступно', 'Это действие нельзя выполнить в текущем месте.');

        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionId,
            actionName: action.name,
            timeDeltaMinutes: 0,
            messages: ['Это действие нельзя выполнить в текущем месте.']
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const applied = applyLifeAction({
        player: currentState.player,
        time: currentState.time,
        action
      });

      const logEntry = createLifeLogEntry(
        { time: applied.time },
        applied.result.ok ? action.name : 'Действие не выполнено',
        applied.result.messages.join(' ')
      );

      return {
        ...currentState,
        player: applied.player,
        time: applied.time,
        lastResult: applied.result,
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function moveToDistrict(districtId: DistrictId): void {
    const district = getDistrictById(districtId);
    const defaultLocation = getDefaultLocationForDistrict(districtId);
    if (!district || !defaultLocation) return;

    setGameState((currentState) => {
      const logEntry = createLifeLogEntry(currentState, 'Район', `Ты перешёл в район ${district.name}.`);

      return {
        ...currentState,
        player: {
          ...currentState.player,
          cityId: district.cityId,
          districtId: district.id,
          locationId: defaultLocation.id
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function moveToLocation(locationId: LocationId): void {
    const location = getLocationById(locationId);
    if (!location) return;

    setGameState((currentState) => {
      const logEntry = createLifeLogEntry(currentState, 'Место', `Ты пришёл в место: ${location.name}.`);

      return {
        ...currentState,
        player: {
          ...currentState.player,
          cityId: location.cityId,
          districtId: location.districtId,
          locationId: location.id
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function resetGame(): void {
    clearSavedGameState();
    setGameState(createInitialGameState());
  }

  return {
    gameState,
    actions: locationState.actions,
    locationState,
    performAction,
    moveToDistrict,
    moveToLocation,
    resetGame
  };
}
