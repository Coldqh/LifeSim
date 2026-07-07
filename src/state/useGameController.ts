import { useEffect, useMemo, useState } from 'react';
import { applyLifeAction } from '../core/actions';
import { applyMoneyDelta, canAfford } from '../core/economy';
import { applyForJob as applyJob, applyJobShift, getJobApplicationFailure, getJobShiftFailure } from '../core/jobs';
import { addInventoryItem, hasInventoryItem, removeInventoryItem } from '../core/inventory';
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
import { applyNeedsDelta, getNeedWarning } from '../core/needs';
import { getShopForLocation, getShopProducts, isProductSoldByShop } from '../core/shop';
import { addMinutes } from '../core/time';
import {
  calculateDistrictTravel,
  calculateLocationTravel,
  createDistrictTravelOption,
  createLocationTravelOptions
} from '../core/travel';
import { getLifeAction } from '../data';
import { basicJobs, getJobById } from '../data/jobs/basicJobs';
import { getProductById } from '../data/products/basicProducts';
import type { ActionId, DistrictId, JobId, LocationId, ProductId } from '../types/ids';
import type { TravelModeId } from '../types/transport';
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
    const shop = getShopForLocation(location);
    const shopProducts = getShopProducts(shop?.id);
    const travelContext = {
      playerMoney: gameState.player.money,
      playerEnergy: gameState.player.needs.energy
    };
    const locationTravelOptions = createLocationTravelOptions(location, locations, travelContext);
    const districtTravelOptions = districts.map((candidateDistrict) =>
      createDistrictTravelOption({
        currentLocation: location,
        district: candidateDistrict,
        defaultLocation: getDefaultLocationForDistrict(candidateDistrict.id),
        context: travelContext
      })
    );

    return {
      city,
      district,
      location,
      districts,
      locations,
      actions,
      shop,
      shopProducts,
      locationTravelOptions,
      districtTravelOptions
    };
  }, [gameState.player.cityId, gameState.player.districtId, gameState.player.locationId, gameState.player.money, gameState.player.needs.energy]);

  const jobState = useMemo(() => {
    const currentJob = getJobById(gameState.player.currentJobId);
    const jobs = basicJobs.map((job) => {
      const location = getLocationById(job.locationId);
      const applicationFailure = getJobApplicationFailure(gameState.player, job);
      const shiftFailure = getJobShiftFailure(gameState.player, job);

      return {
        job,
        location,
        isCurrentJob: gameState.player.currentJobId === job.id,
        completedShifts: gameState.player.completedShifts[job.id] ?? 0,
        canApply: !applicationFailure,
        applicationFailure,
        canWorkShift: !shiftFailure,
        shiftFailure
      };
    });

    return {
      jobs,
      currentJob
    };
  }, [gameState.player]);

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

  function moveToDistrict(districtId: DistrictId, modeId: TravelModeId): void {
    const district = getDistrictById(districtId);
    const defaultLocation = getDefaultLocationForDistrict(districtId);
    if (!district || !defaultLocation) return;

    setGameState((currentState) => {
      const currentLocation = getLocationById(currentState.player.locationId);
      const travel = calculateDistrictTravel({
        fromLocation: currentLocation,
        toDistrict: district,
        toLocation: defaultLocation,
        modeId,
        context: {
          playerMoney: currentState.player.money,
          playerEnergy: currentState.player.needs.energy
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
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', messages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: {
          ...currentState.player,
          money: nextMoney,
          needs: nextNeeds,
          cityId: district.cityId,
          districtId: district.id,
          locationId: defaultLocation.id
        },
        lastResult: {
          ok: true,
          timeDeltaMinutes: travel.durationMinutes,
          moneyDelta: -(travel.moneyCost ?? 0),
          needsDelta: travel.needsDelta,
          locationDelta: defaultLocation.id,
          messages
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function moveToLocation(locationId: LocationId, modeId: TravelModeId): void {
    const location = getLocationById(locationId);
    if (!location) return;

    setGameState((currentState) => {
      const currentLocation = getLocationById(currentState.player.locationId);
      const travel = calculateLocationTravel({
        fromLocation: currentLocation,
        toLocation: location,
        modeId,
        context: {
          playerMoney: currentState.player.money,
          playerEnergy: currentState.player.needs.energy
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
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', messages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: {
          ...currentState.player,
          money: nextMoney,
          needs: nextNeeds,
          cityId: location.cityId,
          districtId: location.districtId,
          locationId: location.id
        },
        lastResult: {
          ok: true,
          timeDeltaMinutes: travel.durationMinutes,
          moneyDelta: -(travel.moneyCost ?? 0),
          needsDelta: travel.needsDelta,
          locationDelta: location.id,
          messages
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function buyProduct(productId: ProductId): void {
    setGameState((currentState) => {
      const location = getLocationById(currentState.player.locationId);
      const shop = getShopForLocation(location);
      const product = getProductById(productId);

      if (!shop || !product || !isProductSoldByShop(shop.id, productId)) {
        const message = 'Этот товар здесь не продаётся.';
        const logEntry = createLifeLogEntry(currentState, 'Покупка не прошла', message);

        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            messages: [message]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      if (!canAfford(currentState.player.money, product.price)) {
        const message = 'Не хватает денег.';
        const logEntry = createLifeLogEntry(currentState, 'Покупка не прошла', message);

        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            messages: [message]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const nextPlayer = {
        ...currentState.player,
        money: applyMoneyDelta(currentState.player.money, -product.price),
        inventory: addInventoryItem(currentState.player.inventory, product.id)
      };
      const message = `Куплено: ${product.name}. Товар добавлен в инвентарь.`;
      const logEntry = createLifeLogEntry(currentState, 'Покупка', message);

      return {
        ...currentState,
        player: nextPlayer,
        lastResult: {
          ok: true,
          timeDeltaMinutes: 0,
          moneyDelta: -product.price,
          messages: [message]
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function useInventoryItem(productId: ProductId): void {
    setGameState((currentState) => {
      const product = getProductById(productId);

      if (!product || !hasInventoryItem(currentState.player.inventory, productId)) {
        const message = 'Предмет не найден в инвентаре.';
        const logEntry = createLifeLogEntry(currentState, 'Инвентарь', message);

        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            messages: [message]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const nextNeeds = applyNeedsDelta(currentState.player.needs, product.effects);
      const warning = getNeedWarning(nextNeeds);
      const message = `Использовано: ${product.name}.`;
      const messages = warning ? [message, warning] : [message];
      const logEntry = createLifeLogEntry(currentState, 'Инвентарь', messages.join(' '));

      return {
        ...currentState,
        player: {
          ...currentState.player,
          needs: nextNeeds,
          inventory: removeInventoryItem(currentState.player.inventory, productId)
        },
        lastResult: {
          ok: true,
          timeDeltaMinutes: 0,
          needsDelta: product.effects,
          messages
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function applyForJob(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;

    setGameState((currentState) => {
      const applied = applyJob({
        player: currentState.player,
        job
      });
      const logEntry = createLifeLogEntry(
        currentState,
        applied.result.ok ? 'Работа' : 'Работа недоступна',
        applied.result.messages.join(' ')
      );

      return {
        ...currentState,
        player: applied.player,
        lastResult: {
          ok: applied.result.ok,
          actionName: job.title,
          timeDeltaMinutes: 0,
          messages: applied.result.messages
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function workShift(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;

    setGameState((currentState) => {
      const applied = applyJobShift({
        player: currentState.player,
        time: currentState.time,
        job
      });
      const logEntry = createLifeLogEntry(
        { time: applied.time },
        applied.result.ok ? 'Смена' : 'Смена недоступна',
        applied.result.messages.join(' ')
      );

      return {
        ...currentState,
        player: applied.player,
        time: applied.time,
        lastResult: {
          ok: applied.result.ok,
          actionName: job.title,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: applied.result.needsDelta,
          messages: applied.result.messages
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
    jobState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    applyForJob,
    workShift,
    resetGame
  };
}
