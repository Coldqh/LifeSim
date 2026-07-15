import type { Dispatch, SetStateAction } from 'react';
import { applyBoxingMedicalRisk } from '../../core/healthcare';
import { getLocationById } from '../../core/location';
import type { NeedsDecayProfile } from '../../core/needs';
import type { BoxingOperationOutput } from '../../core/sport';
import { getTotalMinutes } from '../../core/time';
import { calculateVehicleTravelQuote } from '../../core/vehicles';
import { getTravelDurationMinutes } from '../../core/travel';
import { getVehicleModelById } from '../../data/vehicles/vehicleModels';
import type { LocationId } from '../../types/ids';
import type { Npc } from '../../types/npc';
import type { Player } from '../../types/player';
import type { SocialContext } from '../../types/relationship';
import type { GameTime } from '../../types/time';
import type { TravelResult } from '../../types/travel';
import type { VehicleWorldState } from '../../types/vehicle';
import { createLifeLogEntry, type GameState, type LifeLogEntry } from '../gameState';
import { advanceWorldTime, mergeNeedsDelta } from '../worldTimePipeline';

export type GameStateSetter = Dispatch<SetStateAction<GameState>>;

export function getNeedsDecayProfileForActionCategory(category?: string): NeedsDecayProfile {
  if (category === 'sleep') return 'sleeping';
  if (category === 'rest') return 'resting';
  return 'active';
}

type ElapsedTimeOptions = Partial<GameState['world']> & { actionTitle?: string };

export function applyElapsedTimeConsequences(
  currentState: GameState,
  player: Player,
  nextTime: GameTime,
  decayProfile: NeedsDecayProfile = 'active',
  options: ElapsedTimeOptions = {}
) {
  const { actionTitle, ...worldOverride } = options;
  return advanceWorldTime({
    state: currentState,
    player,
    nextTime,
    decayProfile,
    worldOverride,
    actionTitle
  });
}

export function mergeLifeLog(newEntries: LifeLogEntry[], oldEntries: LifeLogEntry[]): LifeLogEntry[] {
  return [...newEntries, ...oldEntries].slice(0, 16);
}

export function applyBoxingOperationState(
  currentState: GameState,
  applied: BoxingOperationOutput,
  logTitle: string
): GameState {
  if (!applied.result.ok) {
    const logEntry = createLifeLogEntry(currentState, `${logTitle} недоступно`, applied.result.messages.join(' '));
    return {
      ...currentState,
      lastResult: {
        ok: false,
        actionName: applied.result.actionName,
        timeDeltaMinutes: 0,
        messages: applied.result.messages
      },
      lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
    };
  }

  const elapsedApplied = applyElapsedTimeConsequences(
    currentState,
    applied.player,
    applied.time,
    'active',
    { actionTitle: applied.result.actionName }
  );
  const combatKind = logTitle === 'Спарринг'
    ? 'sparring'
    : logTitle === 'Турнир'
      ? 'tournament'
      : undefined;
  const riskApplied = combatKind
    ? applyBoxingMedicalRisk({
        state: elapsedApplied.medical,
        player: elapsedApplied.player,
        totalMinutes: getTotalMinutes(applied.time),
        kind: combatKind,
        seed: getTotalMinutes(applied.time) + currentState.world.population.seed
      })
    : { state: elapsedApplied.medical, player: elapsedApplied.player, message: undefined };
  const messages = [...applied.result.messages, riskApplied.message, ...elapsedApplied.messages]
    .filter((message): message is string => Boolean(message));
  const logEntry = createLifeLogEntry({ time: applied.time }, logTitle, messages.join(' '));

  return {
    ...currentState,
    player: riskApplied.player,
    world: { ...elapsedApplied.world, medical: riskApplied.state },
    time: applied.time,
    lastResult: {
      ok: true,
      actionName: applied.result.actionName,
      timeDeltaMinutes: applied.result.timeDeltaMinutes,
      moneyDelta: applied.result.moneyDelta,
      needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
      messages
    },
    lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
  };
}

export function getNpcSocialContext(
  npc: Npc,
  locationId: LocationId | undefined,
  isColleague: boolean
): SocialContext {
  if (isColleague) return 'work';
  const location = getLocationById(locationId);
  if (!location) return 'general';
  if (location.type === 'boxing_gym') return 'boxing';
  if (location.type === 'education_center') return 'education';
  if (location.type === 'home') return 'home';
  if (['cafe', 'restaurant', 'food_court'].includes(location.type)) return 'cafe';
  if (['shop', 'pharmacy', 'pickup_point', 'mall', 'electronics_store', 'clothing_store', 'sports_store'].includes(location.type)) return 'shop';
  return npc.employment?.locationId === location.id ? 'work' : 'general';
}

export function calculatePersonalCarTravel(input: {
  world: VehicleWorldState;
  fromLocation: ReturnType<typeof getLocationById>;
  toLocation: ReturnType<typeof getLocationById>;
  kind: 'location' | 'district';
}): TravelResult {
  const model = getVehicleModelById(input.world.ownedVehicle?.modelId);
  const baseDurationMinutes = input.fromLocation && input.toLocation
    ? getTravelDurationMinutes(input.fromLocation, input.toLocation)
    : 0;
  const quote = calculateVehicleTravelQuote({
    vehicle: input.world.ownedVehicle,
    model,
    fromLocationId: input.fromLocation?.id,
    toLocationId: input.toLocation?.id,
    fromDistrictId: input.fromLocation?.districtId,
    toDistrictId: input.toLocation?.districtId,
    baseDurationMinutes
  });

  if (!input.fromLocation || !input.toLocation) {
    return { ok: false, kind: input.kind, durationMinutes: 0, message: 'Маршрут не найден.' };
  }
  if (!quote.available) {
    return {
      ok: false,
      kind: input.kind,
      modeId: 'car',
      modeName: 'Личный автомобиль',
      durationMinutes: 0,
      moneyCost: quote.parkingCost,
      fromLocationId: input.fromLocation.id,
      toLocationId: input.toLocation.id,
      fromDistrictId: input.fromLocation.districtId,
      toDistrictId: input.toLocation.districtId,
      message: quote.unavailableReason ?? 'Автомобиль недоступен.'
    };
  }

  return {
    ok: true,
    kind: input.kind,
    modeId: 'car',
    modeName: 'Личный автомобиль',
    durationMinutes: quote.durationMinutes,
    moneyCost: quote.parkingCost,
    fromLocationId: input.fromLocation.id,
    toLocationId: input.toLocation.id,
    fromDistrictId: input.fromLocation.districtId,
    toDistrictId: input.toLocation.districtId,
    message: `Ты приехал на личном автомобиле. ${quote.distanceKm.toFixed(1)} км, топливо ${quote.fuelLiters.toFixed(1)} л, парковка ${quote.parkingCost} ₽.`
  };
}
