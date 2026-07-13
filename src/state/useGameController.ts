import { useEffect, useMemo, useState } from 'react';
import { applyLifeAction } from '../core/actions';
import {
  buyBusinessEquipment,
  buyBusinessSupply,
  buyBusinessUpgrade,
  fireBusinessEmployee,
  getBusinessHireCandidates,
  getBusinessLaunchFailure,
  getBusinessStartupCost,
  hireBusinessEmployee,
  investInBusiness,
  isBusinessEmployeeOnShift,
  launchBusiness,
  setBusinessMenuPrice,
  simulateBusinessTime
} from '../core/business';
import {
  applyHousingDayChanges,
  applyHousingSleepRecovery,
  getHousingAffordability,
  HOUSING_MOVING_DURATION_MINUTES,
  HOUSING_VIEWING_DURATION_MINUTES,
  isHousingListingActive,
  isHousingViewed,
  markHousingViewed,
  moveIntoHousing,
  refreshHousingMarket,
  scheduleHousingViewing
} from '../core/housing';
import { applyMoneyDelta, canAfford } from '../core/economy';
import { applyEducationProgram, getEducationProgramFailure } from '../core/education';
import {
  accrueSalary,
  createSavingsGoal,
  fundSavingsGoal,
  processFinanceDay,
  reconcileExternalBankBalance,
  setFinanceAutoSave,
  transferFinanceFunds
} from '../core/finance';
import {
  applyForJob as applyJob,
  applyJobPromotion,
  applyJobShift,
  getJobApplicationFailure,
  getJobProgress,
  getJobPromotionFailure,
  getJobShiftFailure
} from '../core/jobs';
import { addInventoryItem, hasInventoryItem, removeInventoryItem } from '../core/inventory';
import {
  applyBoxingMedicalRisk,
  applyMedicalProduct,
  applyProductMedicalRisk,
  applyWorkWhileSick,
  attendMedicalAppointment,
  getMedicalActivityFailure,
  getMedicalAppointmentFailure,
  issueSickLeave,
  processMedicalTime,
  scheduleMedicalAppointment
} from '../core/healthcare';
import { applySkillExperience, getMissingSkillRequirements, getSkillProgress } from '../core/progression';
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
import {
  adjustActivityNeedsDelta,
  applyActivityNeedsDelta,
  applyNeedsDecay,
  applyNeedsDelta,
  describeNeedsDecay,
  getConditionTransitionMessages,
  getNeedConditions,
  getNeedsConsequences,
  getNeedsRequirementFailure,
  getNeedWarning,
  type NeedsDecayProfile
} from '../core/needs';
import { getShopForLocation, getShopProducts, isProductSoldByShop } from '../core/shop';
import { getScheduleActivityFailure, getScheduleStatus } from '../core/schedule';
import {
  completeJobInterview,
  getInterviewFailure,
  getJobApplicationForJob,
  getPhoneUnreadCount,
  markPhoneMessageRead,
  markPhoneNotificationRead,
  processPhoneTime,
  setPhoneMapTarget,
  submitPhoneJobApplication,
  toggleSavedPhoneJob
} from '../core/phone';
import { getLocationPopulationPresence, getPopulationSummary, simulatePopulation } from '../core/population';
import {
  applyNpcInteraction,
  getInteractionFailure,
  getNpcRelationship,
  getRelationshipStatus
} from '../core/relationships';
import {
  applySocialEventChoice,
  maybeActivateSocialEvent,
  processScheduledSocialEvents
} from '../core/events';
import {
  applyBoxingMembership,
  applyBoxingRecovery,
  applyBoxingSparring,
  applyBoxingTournament,
  applyBoxingTraining,
  getBoxingFatigueLabel,
  getBoxingLevelProgress,
  getBoxingMembershipFailure,
  getBoxingSparringFailure,
  getBoxingTournamentFailure,
  getBoxingTrainerSelectionFailure,
  getBoxingTrainingFailure,
  hasActiveBoxingMembership,
  selectBoxingTrainer,
  type BoxingOperationOutput
} from '../core/sport';
import { addMinutes, getElapsedMinutes, getTotalMinutes } from '../core/time';
import {
  applyVehicleTravel,
  buyNewVehicle,
  buyUsedVehicle,
  calculateVehicleTravelQuote,
  inspectUsedVehicle,
  refuelVehicle,
  refreshVehicleMarket,
  scheduleUsedVehicleInspection,
  sellOwnedVehicle,
  serviceVehicle
} from '../core/vehicles';
import {
  calculateDistrictTravel,
  calculateLocationTravel,
  createDistrictTravelOption,
  createLocationTravelOptions,
  getTravelDurationMinutes
} from '../core/travel';
import { getLifeAction } from '../data';
import { moscowLocations } from '../data/locations/moscowLocations';
import { populationDataSource } from '../data/population/config';
import { getNpcRoleById, NPC_ROLE_IDS } from '../data/population/npcRoles';
import { getNpcInteractionById, npcInteractionTemplates } from '../data/social/interactionTemplates';
import { socialEventTemplates } from '../data/social/socialEventTemplates';
import { basicHousing, getHousingById } from '../data/housing/basicHousing';
import { businessTypes, getBusinessTypeById } from '../data/business/businessTypes';
import { businessPremises, getBusinessPremisesById } from '../data/business/premises';
import { businessEquipment, getBusinessEquipmentById, BUSINESS_EQUIPMENT_IDS } from '../data/business/equipment';
import { businessSupplies, getBusinessSupplyById } from '../data/business/supplies';
import { businessMenuItems, getBusinessMenuItemById } from '../data/business/menu';
import { businessUpgrades, getBusinessUpgradeById } from '../data/business/upgrades';
import { basicEducationPrograms, getEducationProgramById } from '../data/education/basicPrograms';
import { basicJobs, getJobById, getJobsForLocation } from '../data/jobs/basicJobs';
import { getProductById } from '../data/products/basicProducts';
import { getMedicalServiceById, medicalServices } from '../data/healthcare/services';
import { getMedicalConditionDefinition } from '../data/healthcare/conditions';
import { basicSkills, getSkillById } from '../data/skills/basicSkills';
import { boxingGyms, getBoxingGymById } from '../data/sports/boxingGyms';
import { boxingTrainers, getBoxingTrainerById } from '../data/sports/boxingTrainers';
import { boxingTrainings, getBoxingTrainingById } from '../data/sports/boxingTrainings';
import { boxingOpponents, getBoxingOpponentById } from '../data/sports/boxingOpponents';
import { boxingTournaments, getBoxingTournamentById } from '../data/sports/boxingTournaments';
import { getVehicleModelById, newDealerVehicleModels } from '../data/vehicles/vehicleModels';
import { usedVehicleListingTemplates } from '../data/vehicles/usedListingTemplates';
import type {
  ActionId,
  BusinessEquipmentId,
  BusinessMenuItemId,
  BusinessPremisesId,
  BusinessSupplyId,
  BusinessUpgradeId,
  BoxingGymId,
  BoxingOpponentId,
  BoxingTournamentId,
  BoxingTrainerId,
  BoxingTrainingId,
  DistrictId,
  EducationProgramId,
  JobId,
  MedicalServiceId,
  PhoneMessageId,
  PhoneNotificationId,
  PhoneCalendarEventId,
  LocationId,
  ProductId,
  NpcId,
  NpcInteractionId,
  SocialEventChoiceId,
  VehicleListingId,
  VehicleModelId
} from '../types/ids';
import type { HousingId, HousingMarketState } from '../types/housing';
import type { BusinessEmployeeRole, BusinessWorldState } from '../types/business';
import type { UpcomingPayment } from '../types/finance';
import type { TravelModeId } from '../types/transport';
import type { NeedsState } from '../types/needs';
import type { Player } from '../types/player';
import type { GameTime } from '../types/time';
import type { Npc } from '../types/npc';
import type { SocialContext, SocialNpcView } from '../types/relationship';
import type { SocialState } from '../types/socialEvent';
import type { VehicleModel, VehicleOperationResult, VehicleWorldState } from '../types/vehicle';
import type { MedicalState } from '../types/healthcare';
import type { DistrictTravelOption, LocationTravelOption, TransportOption, TravelResult } from '../types/travel';
import {
  clearSavedGameState,
  createInitialGameState,
  createLifeLogEntry,
  loadGameState,
  saveGameState,
  type GameState,
  type LifeLogEntry
} from './gameState';


function mergeNeedsDelta(first: Partial<NeedsState> = {}, second: Partial<NeedsState> = {}): Partial<NeedsState> | undefined {
  const merged: Partial<NeedsState> = {
    hunger: (first.hunger ?? 0) + (second.hunger ?? 0),
    thirst: (first.thirst ?? 0) + (second.thirst ?? 0),
    energy: (first.energy ?? 0) + (second.energy ?? 0),
    health: (first.health ?? 0) + (second.health ?? 0),
    mood: (first.mood ?? 0) + (second.mood ?? 0)
  };

  const visibleEntries = Object.entries(merged).filter(([, value]) => value !== 0);
  if (visibleEntries.length === 0) return undefined;

  return Object.fromEntries(visibleEntries) as Partial<NeedsState>;
}

function getNeedsDecayProfileForActionCategory(category?: string): NeedsDecayProfile {
  if (category === 'sleep') return 'sleeping';
  if (category === 'rest') return 'resting';

  return 'active';
}

function applyElapsedTimeConsequences(
  currentState: GameState,
  player: Player,
  nextTime: GameTime,
  decayProfile: NeedsDecayProfile = 'active',
  socialOverride: SocialState = currentState.world.social,
  housingMarketOverride: HousingMarketState = currentState.world.housingMarket,
  businessOverride: BusinessWorldState = currentState.world.business,
  medicalOverride: MedicalState = currentState.world.medical
): { player: Player; population: GameState['world']['population']; social: SocialState; housingMarket: HousingMarketState; business: BusinessWorldState; medical: MedicalState; lifeLogEntries: LifeLogEntry[]; needsDelta?: Partial<NeedsState>; messages: string[] } {
  const elapsedMinutes = getElapsedMinutes(currentState.time, nextTime);
  const lifeLogEntries: LifeLogEntry[] = [];
  const messages: string[] = [];
  const decayApplied = applyNeedsDecay(player.needs, elapsedMinutes, decayProfile);
  const decayMessage = describeNeedsDecay(decayApplied.delta);
  let nextPlayer: Player = {
    ...player,
    needs: decayApplied.needs
  };
  let housingMarket = housingMarketOverride;
  let comfortNeedsDelta: Partial<NeedsState> = {};

  if (decayMessage) {
    messages.push(decayMessage);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, 'Время', decayMessage));
  }


  const conditionMessages = getConditionTransitionMessages(currentState.player.needs, decayApplied.needs);
  if (conditionMessages.length > 0) {
    messages.push(...conditionMessages);
    lifeLogEntries.push(
      ...conditionMessages.map((message) => createLifeLogEntry({ time: nextTime }, 'Состояние', message))
    );
  }

  const elapsedDays = Math.max(0, nextTime.day - currentState.time.day);
  if (elapsedDays > 0) {
    const housing = getHousingById(nextPlayer.housingId);

    if (housing) {
      const applied = applyHousingDayChanges({
        player: nextPlayer,
        housing,
        elapsedDays
      });

      nextPlayer = applied.player;
      lifeLogEntries.push(...applied.events.map((event) => createLifeLogEntry({ time: nextTime }, event.title, event.text)));
    }
    housingMarket = refreshHousingMarket({
      market: housingMarket,
      day: nextTime.day,
      currentHousingId: nextPlayer.housingId,
      catalogue: basicHousing
    });
  }

  nextPlayer = {
    ...nextPlayer,
    boxing: applyBoxingRecovery(nextPlayer.boxing, elapsedMinutes, decayProfile)
  };
  if (decayProfile === 'sleeping') {
    const comfortApplied = applyHousingSleepRecovery({
      player: nextPlayer,
      housing: getHousingById(nextPlayer.housingId),
      elapsedMinutes
    });
    nextPlayer = comfortApplied.player;
    comfortNeedsDelta = comfortApplied.needsDelta;
    if (Object.keys(comfortNeedsDelta).length > 0 || comfortApplied.fatigueDelta < 0) {
      const parts = [
        comfortNeedsDelta.energy ? `энергия +${comfortNeedsDelta.energy}` : undefined,
        comfortNeedsDelta.mood ? `настроение +${comfortNeedsDelta.mood}` : undefined,
        comfortApplied.fatigueDelta < 0 ? `спортивная усталость ${comfortApplied.fatigueDelta}` : undefined
      ].filter((entry): entry is string => Boolean(entry));
      if (parts.length > 0) messages.push(`Комфорт жилья: ${parts.join(', ')}.`);
    }
  }
  const population = simulatePopulation({
    population: currentState.world.population,
    fromTime: currentState.time,
    toTime: nextTime,
    locations: moscowLocations,
    getLocationProfile: populationDataSource.getLocationProfile
  });
  const ownedBusiness = businessOverride.ownedBusiness;
  const businessPremisesEntry = getBusinessPremisesById(ownedBusiness?.premisesId);
  const businessTypeEntry = getBusinessTypeById(ownedBusiness?.typeId);
  const businessApplied = simulateBusinessTime({
    world: businessOverride,
    fromTime: currentState.time,
    toTime: nextTime,
    population,
    premises: businessPremisesEntry,
    businessType: businessTypeEntry,
    equipment: businessEquipment,
    menuItems: businessMenuItems,
    supplies: businessSupplies,
    upgrades: businessUpgrades
  });
  if (businessApplied.events.length > 0) {
    businessApplied.events.forEach((event) => {
      messages.push(event.text);
      lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, event.title, event.text));
    });
  }

  let social = processScheduledSocialEvents({
    social: socialOverride,
    currentDay: nextTime.day,
    npcs: population.npcs,
    templates: socialEventTemplates
  });
  const currentLocation = getLocationById(currentState.player.locationId);
  if (!social.activeEvent && elapsedMinutes >= 60 && currentLocation?.type === 'home') {
    const neighbors = population.npcs.filter((npc) =>
      npc.homeDistrictId === currentState.player.districtId && npc.activationDay <= nextTime.day
    );
    const neighbor = neighbors[(nextTime.day + population.seed) % Math.max(1, neighbors.length)];
    if (neighbor) {
      social = maybeActivateSocialEvent({
        social,
        npc: neighbor,
        context: 'home',
        day: nextTime.day,
        eventWeight: 1,
        templates: socialEventTemplates
      });
    }
  }

  const medicalApplied = processMedicalTime({
    state: medicalOverride,
    player: nextPlayer,
    fromTime: currentState.time,
    toTime: nextTime,
    profile: decayProfile
  });
  nextPlayer = medicalApplied.player;
  if (medicalApplied.messages.length > 0) {
    messages.push(...medicalApplied.messages);
    lifeLogEntries.push(...medicalApplied.messages.map((message) => createLifeLogEntry({ time: nextTime }, 'Здоровье', message)));
  }

  return {
    player: nextPlayer,
    population,
    social,
    housingMarket,
    business: businessApplied.world,
    medical: medicalApplied.state,
    lifeLogEntries,
    needsDelta: mergeNeedsDelta(decayApplied.delta, comfortNeedsDelta),
    messages
  };
}

function applyBoxingOperationState(
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

  const elapsedApplied = applyElapsedTimeConsequences(currentState, applied.player, applied.time, 'active');
  const combatKind = logTitle === 'Спарринг' ? 'sparring' : logTitle === 'Турнир' ? 'tournament' : undefined;
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
    world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business, medical: riskApplied.state },
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

function mergeLifeLog(newEntries: LifeLogEntry[], oldEntries: LifeLogEntry[]): LifeLogEntry[] {
  return [...newEntries, ...oldEntries].slice(0, 16);
}

function resolveInitialState(): GameState {
  return loadGameState() ?? createInitialGameState();
}

function getNpcSocialContext(npc: Npc, locationId: LocationId | undefined, isColleague: boolean): SocialContext {
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


const MASS_DEALER_LOCATION_ID = 'msk_tverskoy_auto_showroom' as LocationId;
const PREMIUM_DEALER_LOCATION_ID = 'msk_khamovniki_import_dealer' as LocationId;
const GAS_STATION_LOCATION_IDS = [
  'msk_danilovsky_gas_station' as LocationId,
  'msk_presnya_gas_station' as LocationId
];
const SERVICE_LOCATION_IDS = [
  'msk_tverskoy_service_center' as LocationId,
  MASS_DEALER_LOCATION_ID,
  PREMIUM_DEALER_LOCATION_ID
];

function getDealerLocationIdForModel(model: VehicleModel): LocationId {
  return model.tier === 'premium' || model.tier === 'luxury'
    ? PREMIUM_DEALER_LOCATION_ID
    : MASS_DEALER_LOCATION_ID;
}

function createPersonalCarTransportOption(input: {
  world: VehicleWorldState;
  fromLocation: ReturnType<typeof getLocationById>;
  toLocation: ReturnType<typeof getLocationById>;
  baseDurationMinutes: number;
}): TransportOption {
  const model = getVehicleModelById(input.world.ownedVehicle?.modelId);
  const quote = calculateVehicleTravelQuote({
    vehicle: input.world.ownedVehicle,
    model,
    fromLocationId: input.fromLocation?.id,
    toLocationId: input.toLocation?.id,
    fromDistrictId: input.fromLocation?.districtId,
    toDistrictId: input.toLocation?.districtId,
    baseDurationMinutes: input.baseDurationMinutes
  });
  return {
    modeId: 'car',
    name: 'Личный автомобиль',
    description: quote.available
      ? `${quote.distanceKm.toFixed(1)} км · топливо ${quote.fuelLiters.toFixed(1)} л · парковка ${quote.parkingCost} ₽`
      : quote.unavailableReason ?? 'Автомобиль недоступен.',
    durationMinutes: quote.durationMinutes,
    moneyCost: quote.parkingCost,
    available: quote.available,
    unavailableReason: quote.unavailableReason
  };
}

function addPersonalCarToLocationOptions(
  options: LocationTravelOption[],
  fromLocation: ReturnType<typeof getLocationById>,
  world: VehicleWorldState
): LocationTravelOption[] {
  return options.map((option) => ({
    ...option,
    transportOptions: [
      ...option.transportOptions,
      createPersonalCarTransportOption({
        world,
        fromLocation,
        toLocation: option.location,
        baseDurationMinutes: option.durationMinutes
      })
    ]
  }));
}

function addPersonalCarToDistrictOptions(
  options: DistrictTravelOption[],
  fromLocation: ReturnType<typeof getLocationById>,
  world: VehicleWorldState
): DistrictTravelOption[] {
  return options.map((option) => ({
    ...option,
    transportOptions: option.defaultLocation
      ? [
          ...option.transportOptions,
          createPersonalCarTransportOption({
            world,
            fromLocation,
            toLocation: option.defaultLocation,
            baseDurationMinutes: option.durationMinutes
          })
        ]
      : option.transportOptions
  }));
}

function calculatePersonalCarTravel(input: {
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

function applyVehicleOperationState(
  currentState: GameState,
  vehicles: VehicleWorldState,
  result: VehicleOperationResult
): GameState {
  const logEntry = createLifeLogEntry(currentState, result.title, result.message);
  if (!result.ok) {
    return {
      ...currentState,
      lastResult: { ok: false, actionName: result.title, timeDeltaMinutes: 0, messages: [result.message] },
      lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
    };
  }
  const chargedPlayer = {
    ...currentState.player,
    money: applyMoneyDelta(currentState.player.money, result.moneyDelta ?? 0)
  };
  const nextTime = addMinutes(currentState.time, result.timeDeltaMinutes);
  const elapsedApplied = applyElapsedTimeConsequences(currentState, chargedPlayer, nextTime, 'active');
  const messages = [result.message, ...elapsedApplied.messages];
  return {
    ...currentState,
    time: nextTime,
    player: elapsedApplied.player,
    world: {
      ...currentState.world,
      population: elapsedApplied.population,
      social: elapsedApplied.social,
      housingMarket: elapsedApplied.housingMarket,
      business: elapsedApplied.business,
          medical: elapsedApplied.medical,
      vehicles
    },
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

export function useGameController() {
  const [gameState, setGameState] = useState<GameState>(resolveInitialState);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    setGameState((currentState) => {
      const currentTotalMinutes = getTotalMinutes(currentState.time);
      if (currentState.world.phone.lastProcessedTotalMinutes >= currentTotalMinutes) return currentState;
      const phone = processPhoneTime({
        state: currentState.world.phone,
        currentTotalMinutes,
        jobs: basicJobs,
        getEmployerName: (job) => getLocationById(job.locationId)?.name ?? 'Работодатель'
      });
      if (phone === currentState.world.phone) return currentState;
      return { ...currentState, world: { ...currentState.world, phone } };
    });
  }, [gameState.time.day, gameState.time.hour, gameState.time.minute]);


  useEffect(() => {
    setGameState((currentState) => {
      const now = getTotalMinutes(currentState.time);
      let changed = false;
      let phone = currentState.world.phone;
      const appointmentsById = new Map(currentState.world.medical.appointments.map((entry) => [String(entry.id), entry]));
      const calendarEvents = phone.calendarEvents.map((event) => {
        if (!event.medicalAppointmentId) return event;
        const appointment = appointmentsById.get(String(event.medicalAppointmentId));
        if (!appointment || appointment.status === event.status) return event;
        changed = true;
        return { ...event, status: appointment.status === 'cancelled' ? 'missed' as const : appointment.status };
      });
      if (calendarEvents !== phone.calendarEvents) phone = { ...phone, calendarEvents };

      for (const appointment of currentState.world.medical.appointments) {
        if (appointment.status !== 'scheduled') continue;
        const reminderId = (`notification_medical_reminder_${appointment.id}`) as PhoneNotificationId;
        const dueSoon = now >= appointment.startsAtTotalMinutes - 90 && now <= appointment.startsAtTotalMinutes;
        if (!dueSoon || phone.notifications.some((entry) => entry.id === reminderId)) continue;
        const service = getMedicalServiceById(appointment.serviceId);
        phone = {
          ...phone,
          notifications: [{
            id: reminderId,
            appId: 'health' as const,
            title: 'Скоро приём',
            body: `${service?.name ?? 'Медицинский приём'} начнётся в ближайшие 90 минут.`,
            createdAtTotalMinutes: now,
            read: false,
            locationId: appointment.clinicLocationId,
            medicalServiceId: appointment.serviceId,
            medicalAppointmentId: appointment.id
          }, ...phone.notifications].slice(0, 80)
        };
        changed = true;
      }

      if (!changed) return currentState;
      return { ...currentState, world: { ...currentState.world, phone } };
    });
  }, [gameState.time.day, gameState.time.hour, gameState.time.minute, gameState.world.medical.appointments]);

  useEffect(() => {
    setGameState((currentState) => {
      const totalMinutes = getTotalMinutes(currentState.time);
      const crossedDayWithExpense = currentState.time.day > currentState.world.finance.lastProcessedDay
        && currentState.player.money < currentState.world.finance.lastObservedBankBalance;
      const reconciled = reconcileExternalBankBalance({
        state: currentState.world.finance,
        bankBalance: currentState.player.money,
        totalMinutes,
        actionTitle: crossedDayWithExpense ? 'Жильё и регулярные платежи' : currentState.lastResult?.actionName
      });
      const processed = processFinanceDay({
        state: reconciled,
        player: currentState.player,
        currentDay: currentState.time.day,
        totalMinutes
      });
      const financeChanged = processed.state !== currentState.world.finance;
      const playerChanged = processed.player !== currentState.player;
      if (!financeChanged && !playerChanged && processed.messages.length === 0) return currentState;
      const entries = processed.messages.map((message) => createLifeLogEntry(currentState, 'Банк', message));
      return {
        ...currentState,
        player: processed.player,
        world: { ...currentState.world, finance: processed.state },
        lifeLog: entries.length ? mergeLifeLog(entries, currentState.lifeLog) : currentState.lifeLog
      };
    });
  }, [gameState.player.money, gameState.time.day, gameState.time.hour, gameState.time.minute]);


  useEffect(() => {
    setGameState((currentState) => {
      const vehicles = refreshVehicleMarket({
        world: currentState.world.vehicles,
        day: currentState.time.day,
        templates: usedVehicleListingTemplates
      });
      if (vehicles === currentState.world.vehicles) return currentState;
      return { ...currentState, world: { ...currentState.world, vehicles } };
    });
  }, [gameState.time.day]);

  const locationState = useMemo(() => {
    const city = getCityById(gameState.player.cityId);
    const district = getDistrictById(gameState.player.districtId);
    const location = getLocationById(gameState.player.locationId);
    const districts = city ? getDistrictsForCity(city.id) : [];
    const allDistrictLocations = district ? getLocationsForDistrict(district.id) : [];
    const currentHomeLocationId = getHousingById(gameState.player.housingId)?.locationId;
    const locations = allDistrictLocations.filter((candidate) => (
      !candidate.hiddenFromCityBrowser
      || candidate.id === location?.id
      || candidate.id === currentHomeLocationId
    ));
    const actions = getActionsForLocation(location?.id);
    const shop = getShopForLocation(location);
    const shopProducts = getShopProducts(shop?.id);
    const locationScheduleStatus = getScheduleStatus(location?.openingHours, gameState.time);
    const locationScheduleStatuses = Object.fromEntries(
      locations.map((candidateLocation) => [candidateLocation.id, getScheduleStatus(candidateLocation.openingHours, gameState.time)])
    );
    const actionScheduleFailure = getScheduleActivityFailure(location?.openingHours, gameState.time, 0, 'Действие');
    const shopScheduleFailure = shop
      ? getScheduleActivityFailure(location?.openingHours, gameState.time, 0, 'Магазин')
      : undefined;
    const travelContext = {
      playerMoney: gameState.player.money,
      playerNeeds: gameState.player.needs
    };
    const locationTravelOptions = addPersonalCarToLocationOptions(
      createLocationTravelOptions(location, locations, travelContext),
      location,
      gameState.world.vehicles
    );
    const districtTravelOptions = addPersonalCarToDistrictOptions(
      districts.map((candidateDistrict) =>
        createDistrictTravelOption({
          currentLocation: location,
          district: candidateDistrict,
          defaultLocation: getDefaultLocationForDistrict(candidateDistrict.id),
          context: travelContext
        })
      ),
      location,
      gameState.world.vehicles
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
      locationScheduleStatus,
      locationScheduleStatuses,
      actionScheduleFailure,
      shopScheduleFailure,
      locationTravelOptions,
      districtTravelOptions
    };
  }, [gameState.player.cityId, gameState.player.districtId, gameState.player.locationId, gameState.player.money, gameState.player.needs, gameState.time, gameState.world.vehicles]);

  const jobState = useMemo(() => {
    const currentJob = getJobById(gameState.player.currentJobId);

    function buildJobView(job: import('../types/job').Job) {
      const location = getLocationById(job.locationId);
      const district = location ? getDistrictById(location.districtId) : undefined;
      const applicationFailure = getJobApplicationFailure(gameState.player, job);
      const shiftFailure = getMedicalActivityFailure(gameState.world.medical, 'work')
        ?? getJobShiftFailure(gameState.player, job, gameState.time);
      const promotionFailure = getJobPromotionFailure(gameState.player, job);
      const progress = getJobProgress(gameState.player, job);
      const missingSkillRequirements = getMissingSkillRequirements(gameState.player, job.requirements?.skills).map((requirement) => ({
        ...requirement,
        name: getSkillById(requirement.skillId)?.name ?? requirement.skillId
      }));
      const effectiveShiftNeedsDelta = adjustActivityNeedsDelta(
        gameState.player.needs,
        job.effects.needsDelta,
        { scaleEnergyCost: true }
      );

      return {
        job,
        location,
        district,
        jobLevel: progress.currentLevel,
        nextJobLevel: progress.nextLevel,
        currentLevel: progress.currentLevel.level,
        maxLevel: job.levels.length,
        isCurrentJob: gameState.player.currentJobId === job.id,
        isAtWorkplace: gameState.player.locationId === job.locationId,
        completedShifts: gameState.player.completedShifts[job.id] ?? 0,
        jobExperience: progress.currentExperience,
        levelExperience: progress.levelExperience,
        levelExperienceRequired: progress.levelExperienceRequired,
        promotionThreshold: progress.promotionThreshold,
        experienceRemaining: progress.experienceRemaining,
        progressPercent: progress.progressPercent,
        isMaxLevel: progress.isMaxLevel,
        canApply: !applicationFailure,
        applicationFailure,
        canWorkShift: !shiftFailure,
        shiftFailure,
        canPromote: !promotionFailure,
        promotionFailure,
        missingSkillRequirements,
        effectiveShiftNeedsDelta,
        scheduleStatus: getScheduleStatus(job.shiftSchedule, gameState.time)
      };
    }

    const jobs = basicJobs.map(buildJobView);
    const currentJobView = currentJob ? buildJobView(currentJob) : undefined;
    const currentLocationJobs = getJobsForLocation(gameState.player.locationId).map(buildJobView);

    return {
      jobs,
      currentJob,
      currentJobView,
      currentLocationJobs
    };
  }, [gameState.player, gameState.time, gameState.world.medical]);

  const financeState = useMemo(() => {
    const finance = gameState.world.finance;
    const housing = getHousingById(gameState.player.housingId);
    const upcomingPayments: UpcomingPayment[] = [];
    if (housing) {
      upcomingPayments.push({
        id: 'housing_rent',
        title: `Аренда: ${housing.name}`,
        amount: housing.rentPerWeek,
        dueDay: gameState.player.rentalContract.nextPaymentDay,
        category: 'housing'
      });
      upcomingPayments.push({
        id: 'housing_upkeep',
        title: 'Бытовые расходы',
        amount: housing.dailyUtilities,
        dueDay: gameState.time.day + 1,
        category: 'housing'
      });
    }
    const business = gameState.world.business.ownedBusiness;
    const premises = getBusinessPremisesById(business?.premisesId);
    if (business && premises) {
      upcomingPayments.push({
        id: 'business_rent',
        title: `Аренда бизнеса: ${business.name}`,
        amount: premises.rentPerWeek,
        dueDay: business.nextRentDay,
        category: 'business'
      });
    }
    return {
      finance,
      bankBalance: gameState.player.money,
      totalAssets: gameState.player.money + finance.cash + finance.savings,
      totalDebt: gameState.player.rentDebt + (business?.debt ?? 0),
      upcomingPayments: upcomingPayments.sort((a, b) => a.dueDay - b.dueDay)
    };
  }, [gameState.player.money, gameState.player.housingId, gameState.player.rentalContract.nextPaymentDay, gameState.player.rentDebt, gameState.time.day, gameState.world.finance, gameState.world.business]);


  const vehicleState = useMemo(() => {
    const world = gameState.world.vehicles;
    const currentLocation = getLocationById(gameState.player.locationId);
    const ownedVehicle = world.ownedVehicle;
    const ownedModel = getVehicleModelById(ownedVehicle?.modelId);
    const listings = world.usedListings.map((listing) => {
      const model = getVehicleModelById(listing.modelId);
      if (!model) return undefined;
      return {
        listing,
        model,
        inspected: world.inspectedListingIds.includes(listing.id),
        scheduled: world.scheduledInspectionListingId === listing.id,
        isAtSeller: gameState.player.locationId === listing.sellerLocationId,
        revealedDefects: world.inspectedListingIds.includes(listing.id) ? listing.hiddenDefectIds : []
      };
    }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    const dealerModels = newDealerVehicleModels.map((model) => ({
      model,
      dealerLocationId: getDealerLocationIdForModel(model),
      dealerLocation: getLocationById(getDealerLocationIdForModel(model)),
      isAtDealer: gameState.player.locationId === getDealerLocationIdForModel(model),
      canAfford: gameState.player.money >= model.newPrice
    }));
    return {
      world,
      listings,
      dealerModels,
      ownedVehicle,
      ownedModel,
      parkedLocation: getLocationById(ownedVehicle?.parkedLocationId),
      currentLocation,
      atGasStation: Boolean(currentLocation && GAS_STATION_LOCATION_IDS.includes(currentLocation.id)),
      atService: Boolean(currentLocation && SERVICE_LOCATION_IDS.includes(currentLocation.id)),
      fuelPriceLabel: ownedModel?.fuelType === 'diesel' ? '74 ₽/л' : ownedModel?.fuelType === 'petrol_92' ? '62 ₽/л' : '68 ₽/л'
    };
  }, [gameState.player.locationId, gameState.player.money, gameState.world.vehicles]);

  const phoneState = useMemo(() => {
    const phone = gameState.world.phone;
    const currentLocation = getLocationById(gameState.player.locationId);
    const travelContext = { playerMoney: gameState.player.money, playerNeeds: gameState.player.needs };
    const jobs = basicJobs.map((job) => {
      const location = getLocationById(job.locationId);
      const district = location ? getDistrictById(location.districtId) : undefined;
      const application = getJobApplicationForJob(phone, job.id);
      const applicationFailure = getJobApplicationFailure(gameState.player, job);
      const missingSkillRequirements = getMissingSkillRequirements(gameState.player, job.requirements?.skills).map((requirement) => ({
        ...requirement,
        name: getSkillById(requirement.skillId)?.name ?? String(requirement.skillId)
      }));
      const interviewFailure = getInterviewFailure({
        state: phone,
        job,
        currentLocationId: gameState.player.locationId,
        currentTotalMinutes: getTotalMinutes(gameState.time)
      });
      return {
        job,
        location,
        district,
        application,
        applicationFailure,
        missingSkillRequirements,
        interviewFailure,
        saved: phone.savedJobIds.includes(job.id),
        estimatedMonthlyIncome: Math.round(job.wagePerShift * 21)
      };
    });
    const mapTarget = getLocationById(phone.mapTargetLocationId);
    const mapRoute = mapTarget
      ? addPersonalCarToLocationOptions(
          createLocationTravelOptions(currentLocation, [mapTarget], travelContext),
          currentLocation,
          gameState.world.vehicles
        )[0]
      : undefined;

    return {
      phone,
      jobs,
      unreadCount: getPhoneUnreadCount(phone),
      unreadMessages: phone.messages.filter((entry) => !entry.read).length,
      unreadNotifications: phone.notifications.filter((entry) => !entry.read).length,
      mapTarget,
      mapRoute,
      finance: financeState,
      vehicles: vehicleState,
      districtTravelOptions: locationState.districtTravelOptions
    };
  }, [gameState.player, gameState.time, gameState.world.phone, gameState.world.vehicles, financeState, vehicleState, locationState.districtTravelOptions]);

  const educationState = useMemo(() => {
    const skills = basicSkills.map((skill) => ({
      skill,
      progress: getSkillProgress(gameState.player.skills, skill.id)
    }));

    const programs = basicEducationPrograms.map((program) => {
      const currentLocation = getLocationById(gameState.player.locationId);
      const failure = getEducationProgramFailure(gameState.player, program, gameState.time, currentLocation?.type);
      return {
        program,
        skill: getSkillById(program.skillId),
        location: program.mode === 'self_study' ? currentLocation : getLocationById(program.locationId),
        canStudy: !failure,
        failure,
        scheduleStatus: getScheduleStatus(program.availabilitySchedule, gameState.time),
        effectiveNeedsDelta: adjustActivityNeedsDelta(
          gameState.player.needs,
          program.needsDelta ?? {},
          { scaleEnergyCost: true }
        )
      };
    });

    return { skills, programs };
  }, [gameState.player, gameState.time]);

  const boxingState = useMemo(() => {
    const gym = boxingGyms[0];
    const gymLocation = getLocationById(gym?.locationId);
    const selectedTrainer = getBoxingTrainerById(gameState.player.boxing.selectedTrainerId);
    const membershipActive = gym ? hasActiveBoxingMembership(gameState.player.boxing, gym, gameState.time.day) : false;
    const membershipFailure = gym
      ? getBoxingMembershipFailure(gameState.player, gameState.time, gym, gymLocation?.openingHours)
      : 'Боксёрский зал не найден.';
    const trainers = boxingTrainers
      .filter((trainer) => gym?.trainerIds.includes(trainer.id))
      .map((trainer) => {
        const failure = gym ? getBoxingTrainerSelectionFailure(gameState.player, gameState.time, gym, trainer) : 'Зал не найден.';
        return { trainer, selected: selectedTrainer?.id === trainer.id, canSelect: !failure, failure };
      });
    const trainings = boxingTrainings.map((training) => {
      const failure = getMedicalActivityFailure(gameState.world.medical, 'boxing_training')
        ?? (gym ? getBoxingTrainingFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        training,
        trainer: selectedTrainer,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.');
      return {
        training,
        canTrain: !failure,
        failure,
        sessionPrice: selectedTrainer?.sessionPrice ?? 0,
        effectiveNeedsDelta: adjustActivityNeedsDelta(gameState.player.needs, training.needsDelta, { scaleEnergyCost: true })
      };
    });
    const opponents = boxingOpponents.map((opponent) => {
      const failure = getMedicalActivityFailure(gameState.world.medical, 'sparring')
        ?? (gym ? getBoxingSparringFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        opponent,
        trainer: selectedTrainer,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.');
      return { opponent, canSpar: !failure, failure };
    });
    const tournaments = boxingTournaments.map((tournament) => {
      const failure = getMedicalActivityFailure(gameState.world.medical, 'tournament')
        ?? (gym ? getBoxingTournamentFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        tournament,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.');
      return { tournament, canEnter: !failure, failure };
    });

    return {
      profile: gameState.player.boxing,
      levelProgress: getBoxingLevelProgress(gameState.player.boxing),
      fatigueLabel: getBoxingFatigueLabel(gameState.player.boxing.fatigue),
      gym,
      gymLocation,
      gymScheduleStatus: getScheduleStatus(gymLocation?.openingHours, gameState.time),
      isAtGym: gameState.player.locationId === gym?.locationId,
      membershipActive,
      membershipFailure,
      selectedTrainer,
      trainers,
      trainings,
      opponents,
      tournaments
    };
  }, [gameState.player, gameState.time, gameState.world.medical]);

  const conditionState = useMemo(() => ({
    conditions: getNeedConditions(gameState.player.needs),
    consequences: getNeedsConsequences(gameState.player.needs)
  }), [gameState.player.needs]);

  const healthState = useMemo(() => {
    const conditions = gameState.world.medical.conditions.map((condition) => ({
      condition,
      definition: getMedicalConditionDefinition(condition.id)
    }));
    const services = medicalServices.map((service) => {
      const clinic = getLocationById(service.clinicLocationId);
      const appointment = gameState.world.medical.appointments.find((entry) => entry.serviceId === service.id && entry.status === 'scheduled');
      const attendFailure = appointment
        ? getMedicalAppointmentFailure({
            state: gameState.world.medical,
            service,
            time: gameState.time,
            currentLocationId: gameState.player.locationId,
            playerMoney: gameState.player.money
          })
        : undefined;
      return {
        service,
        clinic,
        appointment,
        scheduleStatus: getScheduleStatus(service.schedule, gameState.time),
        attendFailure
      };
    });
    const prescriptions = gameState.world.medical.prescriptions.map((prescription) => ({
      prescription,
      product: getProductById(prescription.productId),
      conditionName: getMedicalConditionDefinition(prescription.conditionId)?.name ?? prescription.conditionId
    }));
    const symptoms = conditions.flatMap(({ condition, definition }) =>
      (definition?.symptoms ?? []).map((symptom) => ({ symptom, diagnosed: condition.diagnosed, conditionId: condition.id }))
    );
    return {
      medical: gameState.world.medical,
      conditions,
      services,
      prescriptions,
      symptoms,
      sickLeave: gameState.world.medical.sickLeave,
      upcomingAppointment: gameState.world.medical.appointments
        .filter((entry) => entry.status === 'scheduled')
        .sort((a, b) => a.startsAtTotalMinutes - b.startsAtTotalMinutes)[0]
    };
  }, [gameState.player.locationId, gameState.player.money, gameState.time, gameState.world.medical]);

  const housingState = useMemo(() => {
    const currentHousing = getHousingById(gameState.player.housingId);
    const currentDistrict = currentHousing ? getDistrictById(currentHousing.districtId) : undefined;
    const currentLocation = getLocationById(gameState.player.locationId);
    const travelContext = {
      playerMoney: gameState.player.money,
      playerNeeds: gameState.player.needs
    };
    const listings = gameState.world.housingMarket.activeHousingIds
      .map((id) => getHousingById(id))
      .filter((housing): housing is NonNullable<typeof housing> => Boolean(housing))
      .map((housing) => {
        const location = getLocationById(housing.locationId);
        const district = getDistrictById(housing.districtId);
        const route = location
          ? createLocationTravelOptions(currentLocation, [location], travelContext)[0]
          : undefined;
        return {
          housing,
          location,
          district,
          route,
          affordability: getHousingAffordability(gameState.player, housing),
          isViewed: isHousingViewed(gameState.world.housingMarket, housing.id),
          isScheduled: gameState.world.housingMarket.scheduledViewingHousingId === housing.id,
          isAtLocation: gameState.player.locationId === housing.locationId
        };
      })
      .sort((left, right) => left.housing.rentPerWeek - right.housing.rentPerWeek);

    return {
      currentHousing,
      currentDistrict,
      contract: gameState.player.rentalContract,
      market: gameState.world.housingMarket,
      listings,
      daysUntilRefresh: Math.max(0, gameState.world.housingMarket.lastRefreshDay + 4 - gameState.time.day)
    };
  }, [gameState.player, gameState.time.day, gameState.world.housingMarket]);

  const businessState = useMemo(() => {
    const world = gameState.world.business;
    const selectedType = businessTypes[0];
    const premisesListings = world.activePremisesIds
      .map((id) => getBusinessPremisesById(id))
      .filter((premises): premises is NonNullable<typeof premises> => Boolean(premises))
      .map((premises) => {
        const location = getLocationById(premises.locationId);
        const district = getDistrictById(premises.districtId);
        const startup = selectedType
          ? getBusinessStartupCost({ premises, businessType: selectedType, equipment: businessEquipment, supplies: businessSupplies })
          : { equipmentCost: 0, starterInventoryCost: 0, total: 0 };
        const failure = selectedType
          ? getBusinessLaunchFailure({ player: gameState.player, world, premises, businessType: selectedType, equipment: businessEquipment, supplies: businessSupplies })
          : 'Формат бизнеса не найден.';
        return {
          premises,
          location,
          district,
          startup,
          canLaunch: !failure,
          failure,
          isAtLocation: gameState.player.locationId === premises.locationId
        };
      })
      .sort((left, right) => left.premises.rentPerWeek - right.premises.rentPerWeek);

    const business = world.ownedBusiness;
    const premises = getBusinessPremisesById(business?.premisesId);
    const businessType = getBusinessTypeById(business?.typeId);
    const scheduleStatus = getScheduleStatus(business?.schedule, gameState.time);
    const menu = (businessType?.menuItemIds ?? [])
      .map((id) => getBusinessMenuItemById(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({
        item,
        price: business?.menuPrices[item.id] ?? item.recommendedPrice,
        canProduce: Boolean(business && item.ingredients.every((ingredient) => (business.inventory[ingredient.supplyId] ?? 0) >= ingredient.quantity))
      }));
    const supplies = businessSupplies.map((supply) => ({
      supply,
      quantity: business?.inventory[supply.id] ?? 0,
      batchCost: supply.unitCost * supply.purchaseBatch,
      canBuy: Boolean(business && business.balance >= supply.unitCost * supply.purchaseBatch)
    }));
    const equipment = businessEquipment.map((item) => ({
      equipment: item,
      owned: Boolean(business?.equipmentIds.includes(item.id)),
      canBuy: Boolean(business && !business.equipmentIds.includes(item.id) && business.balance >= item.price)
    }));
    const upgrades = businessUpgrades.map((upgrade) => ({
      upgrade,
      owned: Boolean(business?.upgradeIds.includes(upgrade.id)),
      canBuy: Boolean(business && !business.upgradeIds.includes(upgrade.id) && business.balance >= upgrade.price)
    }));
    const employees = (business?.employees ?? []).map((employee) => ({
      employee,
      npc: gameState.world.population.npcs.find((npc) => npc.id === employee.npcId),
      onShift: isBusinessEmployeeOnShift(employee, gameState.time)
    }));
    const candidates = getBusinessHireCandidates(gameState.world.population, world, gameState.time.day);
    const recentCustomers = (business?.lastCustomerNpcIds ?? [])
      .map((id) => gameState.world.population.npcs.find((npc) => npc.id === id))
      .filter((npc): npc is NonNullable<typeof npc> => Boolean(npc));
    const ownerShiftFailure = !business || !premises
      ? 'Сначала открой бизнес.'
      : gameState.player.locationId !== premises.locationId
        ? 'Нужно быть в своей кофейне.'
        : getScheduleActivityFailure(business.schedule, gameState.time, 240, 'Смена владельца')
          ?? getNeedsRequirementFailure(gameState.player.needs, { minEnergy: 20, minHealth: 25, minHunger: 6, minThirst: 6 });

    return {
      world,
      business,
      businessType,
      premises,
      premisesListings,
      scheduleStatus,
      menu,
      supplies,
      equipment,
      upgrades,
      employees,
      candidates,
      recentCustomers,
      ownerShiftFailure,
      canWorkOwnerShift: Boolean(business && premises && !ownerShiftFailure)
    };
  }, [gameState.player, gameState.time, gameState.world.business, gameState.world.population]);

  const populationState = useMemo(() => ({
    presence: getLocationPopulationPresence(gameState.world.population, gameState.player.locationId),
    summary: getPopulationSummary(gameState.world.population, gameState.time.day)
  }), [gameState.world.population, gameState.player.locationId, gameState.time.day]);

  const socialState = useMemo(() => {
    const presence = getLocationPopulationPresence(gameState.world.population, gameState.player.locationId);
    const presentNpcs = [...(presence?.staff ?? []), ...(presence?.visitors ?? [])];
    const presentIds = new Set(presentNpcs.map((npc) => String(npc.id)));
    const staffIds = new Set((presence?.staff ?? []).map((npc) => String(npc.id)));
    const currentJob = getJobById(gameState.player.currentJobId);

    function buildSocialNpcView(npc: Npc, isPresent: boolean): SocialNpcView {
      const relationship = getNpcRelationship(gameState.world.social, npc.id);
      const isColleague = Boolean(currentJob && npc.employment?.locationId === currentJob.locationId);
      const context = getNpcSocialContext(npc, gameState.player.locationId, isColleague);
      const interactions = npcInteractionTemplates
        .filter((interaction) => interaction.contexts.includes('general') || interaction.contexts.includes(context))
        .map((interaction) => {
          const failure = getInteractionFailure({
            player: gameState.player,
            npc,
            relationship,
            interaction,
            context,
            isPresent
          });
          return { interaction, available: !failure, failure };
        });

      return {
        npc,
        role: getNpcRoleById(npc.employment?.roleId),
        relationship,
        status: getRelationshipStatus(relationship),
        context,
        isPresent,
        isStaff: staffIds.has(String(npc.id)),
        isColleague,
        isKnown: relationship.familiarity >= 5 || relationship.interactionCount > 0,
        interactions
      };
    }

    const currentPeople = presentNpcs.map((npc) => buildSocialNpcView(npc, true));
    const knownPeople = gameState.world.population.npcs
      .filter((npc) => {
        const relationship = gameState.world.social.relationships[String(npc.id)];
        return Boolean(relationship && (relationship.familiarity >= 5 || relationship.interactionCount > 0));
      })
      .map((npc) => buildSocialNpcView(npc, presentIds.has(String(npc.id))))
      .sort((left, right) => (right.relationship.lastInteractionDay ?? 0) - (left.relationship.lastInteractionDay ?? 0));
    const colleagues = currentJob
      ? gameState.world.population.npcs
          .filter((npc) => npc.employment?.locationId === currentJob.locationId)
          .map((npc) => buildSocialNpcView(npc, presentIds.has(String(npc.id))))
          .sort((left, right) => {
            const leftManagement = left.role?.category === 'management' ? 0 : 1;
            const rightManagement = right.role?.category === 'management' ? 0 : 1;
            return leftManagement - rightManagement || left.npc.lastName.localeCompare(right.npc.lastName, 'ru');
          })
      : [];
    const activeEventNpc = gameState.world.social.activeEvent
      ? gameState.world.population.npcs.find((npc) => npc.id === gameState.world.social.activeEvent?.npcId)
      : undefined;

    return {
      currentPeople,
      knownPeople,
      colleagues,
      activeEvent: gameState.world.social.activeEvent,
      activeEventNpc,
      history: gameState.world.social.history,
      scheduledCount: gameState.world.social.scheduledEvents.length
    };
  }, [gameState.player, gameState.world.population, gameState.world.social]);

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

      const currentLocation = getLocationById(currentState.player.locationId);
      const scheduleFailure = getScheduleActivityFailure(
        currentLocation?.openingHours,
        currentState.time,
        action.durationMinutes,
        'Действие'
      );

      if (scheduleFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Действие недоступно', scheduleFailure);
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionId,
            actionName: action.name,
            timeDeltaMinutes: 0,
            messages: [scheduleFailure]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const applied = applyLifeAction({
        player: currentState.player,
        time: currentState.time,
        action
      });

      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        getNeedsDecayProfileForActionCategory(action.category)
      );
      const resultMessages = [...applied.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry(
        { time: applied.time },
        applied.result.ok ? action.name : 'Действие не выполнено',
        resultMessages.join(' ')
      );

      return {
        ...currentState,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business, medical: elapsedApplied.medical },
        time: applied.time,
        lastResult: {
          ...applied.result,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function moveToDistrict(districtId: DistrictId, modeId: TravelModeId): void {
    const district = getDistrictById(districtId);
    const defaultLocation = getDefaultLocationForDistrict(districtId);
    if (!district || !defaultLocation) return;

    setGameState((currentState) => {
      const currentLocation = getLocationById(currentState.player.locationId);
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
              playerNeeds: currentState.player.needs
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
      const elapsedApplied = applyElapsedTimeConsequences(currentState, movedPlayer, nextTime, 'active');
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
      const resultMessages = [...messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', resultMessages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business, medical: elapsedApplied.medical, vehicles },
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
      const currentLocation = getLocationById(currentState.player.locationId);
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
              playerNeeds: currentState.player.needs
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
      const elapsedApplied = applyElapsedTimeConsequences(currentState, movedPlayer, nextTime, 'active');
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
      const resultMessages = [...messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', resultMessages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business, medical: elapsedApplied.medical, vehicles },
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

      const scheduleFailure = getScheduleActivityFailure(location?.openingHours, currentState.time, 0, 'Магазин');
      if (scheduleFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Покупка не прошла', scheduleFailure);
        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            messages: [scheduleFailure]
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
          actionName: product.category === 'medicine' ? `Аптека: ${product.name}` : `Покупка: ${product.name}`,
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

      const nextTime = addMinutes(currentState.time, product.useDurationMinutes);
      const medicalUse = applyMedicalProduct({
        state: currentState.world.medical,
        productId: product.id,
        medicalUse: product.medicalUse,
        totalMinutes: getTotalMinutes(nextTime)
      });
      if (product.medicalUse && medicalUse.appliedConditionIds.length === 0) {
        const message = medicalUse.message ?? 'Средство сейчас не требуется.';
        const logEntry = createLifeLogEntry(currentState, 'Лечение недоступно', message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: product.name, timeDeltaMinutes: 0, messages: [message] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const consumedPlayer = {
        ...currentState.player,
        needs: applyNeedsDelta(currentState.player.needs, product.effects),
        inventory: removeInventoryItem(currentState.player.inventory, productId)
      };
      const productRisk = applyProductMedicalRisk({
        state: medicalUse.state,
        player: consumedPlayer,
        productId: product.id,
        totalMinutes: getTotalMinutes(nextTime)
      });
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        productRisk.player,
        nextTime,
        'active',
        currentState.world.social,
        currentState.world.housingMarket,
        currentState.world.business,
        productRisk.state
      );
      const warning = getNeedWarning(elapsedApplied.player.needs);
      const message = `Использовано: ${product.name}. Потрачено ${product.useDurationMinutes} мин.`;
      const messages = [message, medicalUse.message, productRisk.message, warning, ...elapsedApplied.messages]
        .filter((entry): entry is string => Boolean(entry));
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Инвентарь', messages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business, medical: elapsedApplied.medical },
        lastResult: {
          ok: true,
          timeDeltaMinutes: product.useDurationMinutes,
          needsDelta: mergeNeedsDelta(product.effects, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
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
          actionName: applied.result.jobTitle,
          timeDeltaMinutes: 0,
          messages: applied.result.messages
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function promoteJob(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;

    setGameState((currentState) => {
      const promoted = applyJobPromotion({
        player: currentState.player,
        job
      });
      const logEntry = createLifeLogEntry(
        currentState,
        promoted.result.ok ? 'Повышение' : 'Повышение недоступно',
        promoted.result.messages.join(' ')
      );

      return {
        ...currentState,
        player: promoted.player,
        lastResult: {
          ok: promoted.result.ok,
          actionName: promoted.result.nextTitle,
          timeDeltaMinutes: 0,
          messages: promoted.result.messages
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function workShift(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;

    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'work');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Смена недоступна', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: job.title, timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const applied = applyJobShift({
        player: currentState.player,
        time: currentState.time,
        job
      });
      const earnedSalary = applied.result.ok ? Math.max(0, applied.result.moneyDelta ?? 0) : 0;
      const deferredPlayer = earnedSalary > 0
        ? { ...applied.player, money: Math.max(0, applied.player.money - earnedSalary) }
        : applied.player;
      const finance = earnedSalary > 0
        ? accrueSalary(currentState.world.finance, earnedSalary, getTotalMinutes(applied.time), applied.result.jobTitle)
        : currentState.world.finance;
      const elapsedApplied = applyElapsedTimeConsequences(currentState, deferredPlayer, applied.time, 'active');
      const sicknessApplied = applied.result.ok
        ? applyWorkWhileSick(elapsedApplied.medical, elapsedApplied.player, getTotalMinutes(applied.time))
        : { state: elapsedApplied.medical, player: elapsedApplied.player, message: undefined };
      const skillLevelMessages = (applied.result.skillProgressUpdates ?? [])
        .filter((update) => update.leveledUp)
        .map((update) => `Навык «${getSkillById(update.skillId)?.name ?? 'Навык'}» повышен до уровня ${update.nextLevel}.`);
      const salaryMessage = earnedSalary > 0 ? `Начислено ${earnedSalary} ₽. Выплата в день ${finance.nextSalaryPayoutDay}.` : undefined;
      const resultMessages = [...applied.result.messages, salaryMessage, sicknessApplied.message, ...skillLevelMessages, ...elapsedApplied.messages].filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry(
        { time: applied.time },
        applied.result.ok ? 'Смена' : 'Смена недоступна',
        resultMessages.join(' ')
      );
      const skillLevelEntries = skillLevelMessages.map((message) =>
        createLifeLogEntry({ time: applied.time }, 'Новый уровень навыка', message)
      );

      return {
        ...currentState,
        player: sicknessApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business, medical: sicknessApplied.state, finance },
        time: applied.time,
        lastResult: {
          ok: applied.result.ok,
          actionName: applied.result.jobTitle,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: 0,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...skillLevelEntries, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function studyProgram(programId: EducationProgramId): void {
    const program = getEducationProgramById(programId);
    if (!program) return;

    setGameState((currentState) => {
      const applied = applyEducationProgram({
        player: currentState.player,
        time: currentState.time,
        program,
        currentLocationType: getLocationById(currentState.player.locationId)?.type
      });

      if (!applied.result.ok) {
        const logEntry = createLifeLogEntry(currentState, 'Обучение недоступно', applied.result.messages.join(' '));
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: program.title,
            timeDeltaMinutes: 0,
            messages: applied.result.messages
          },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const elapsedApplied = applyElapsedTimeConsequences(currentState, applied.player, applied.time, 'active');
      const skill = getSkillById(program.skillId);
      const levelMessage = applied.result.skillProgress?.leveledUp
        ? `Навык «${skill?.name ?? 'Навык'}» повышен до уровня ${applied.result.skillProgress.nextLevel}.`
        : undefined;
      const resultMessages = [...applied.result.messages, levelMessage, ...elapsedApplied.messages]
        .filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry({ time: applied.time }, 'Обучение', resultMessages.join(' '));
      const levelEntries = levelMessage
        ? [createLifeLogEntry({ time: applied.time }, 'Новый уровень навыка', levelMessage)]
        : [];

      return {
        ...currentState,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business, medical: elapsedApplied.medical },
        time: applied.time,
        lastResult: {
          ok: true,
          actionName: program.title,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...levelEntries, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function buyBoxingMembership(gymId: BoxingGymId): void {
    const gym = getBoxingGymById(gymId);
    if (!gym) return;
    setGameState((currentState) => {
      const location = getLocationById(gym.locationId);
      return applyBoxingOperationState(currentState, applyBoxingMembership({
        player: currentState.player,
        time: currentState.time,
        gym,
        schedule: location?.openingHours
      }), 'Бокс');
    });
  }

  function chooseBoxingTrainer(trainerId: BoxingTrainerId): void {
    const trainer = getBoxingTrainerById(trainerId);
    if (!trainer) return;
    setGameState((currentState) => {
      const gym = boxingGyms.find((candidate) => candidate.trainerIds.includes(trainer.id));
      if (!gym) return currentState;
      return applyBoxingOperationState(currentState, selectBoxingTrainer({
        player: currentState.player,
        time: currentState.time,
        gym,
        trainer
      }), 'Бокс');
    });
  }

  function performBoxingTraining(trainingId: BoxingTrainingId): void {
    const training = getBoxingTrainingById(trainingId);
    if (!training) return;
    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'boxing_training');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Бокс недоступен', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Бокс', timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const gym = boxingGyms[0];
      const location = getLocationById(gym.locationId);
      const trainer = getBoxingTrainerById(currentState.player.boxing.selectedTrainerId);
      return applyBoxingOperationState(currentState, applyBoxingTraining({
        player: currentState.player,
        time: currentState.time,
        gym,
        training,
        trainer,
        schedule: location?.openingHours
      }), 'Тренировка');
    });
  }

  function startBoxingSparring(opponentId: BoxingOpponentId): void {
    const opponent = getBoxingOpponentById(opponentId);
    if (!opponent) return;
    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'sparring');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Бокс недоступен', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Бокс', timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const gym = boxingGyms[0];
      const location = getLocationById(gym.locationId);
      const trainer = getBoxingTrainerById(currentState.player.boxing.selectedTrainerId);
      return applyBoxingOperationState(currentState, applyBoxingSparring({
        player: currentState.player,
        time: currentState.time,
        gym,
        opponent,
        trainer,
        schedule: location?.openingHours
      }), 'Спарринг');
    });
  }

  function enterBoxingTournament(tournamentId: BoxingTournamentId): void {
    const tournament = getBoxingTournamentById(tournamentId);
    if (!tournament) return;
    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'tournament');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Бокс недоступен', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Бокс', timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const gym = boxingGyms[0];
      const location = getLocationById(gym.locationId);
      const opponents = tournament.opponentIds
        .map((opponentId) => getBoxingOpponentById(opponentId))
        .filter((opponent): opponent is NonNullable<typeof opponent> => Boolean(opponent));
      return applyBoxingOperationState(currentState, applyBoxingTournament({
        player: currentState.player,
        time: currentState.time,
        gym,
        tournament,
        opponents,
        schedule: location?.openingHours
      }), 'Турнир');
    });
  }

  function scheduleHousingViewingAction(housingId: HousingId): void {
    setGameState((currentState) => {
      const housing = getHousingById(housingId);
      if (!housing) return currentState;
      const scheduled = scheduleHousingViewing(currentState.world.housingMarket, housingId);
      const logEntry = createLifeLogEntry(
        currentState,
        scheduled.ok ? 'Просмотр жилья' : 'Объявление недоступно',
        scheduled.ok ? `${housing.name}. ${scheduled.message}` : scheduled.message
      );
      return {
        ...currentState,
        world: { ...currentState.world, housingMarket: scheduled.market },
        lastResult: {
          ok: scheduled.ok,
          actionName: 'Просмотр жилья',
          timeDeltaMinutes: 0,
          messages: [scheduled.message]
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function viewHousing(housingId: HousingId): void {
    setGameState((currentState) => {
      const housing = getHousingById(housingId);
      if (!housing) return currentState;
      let failure: string | undefined;
      if (!isHousingListingActive(currentState.world.housingMarket, housingId)) failure = 'Объявление больше не активно.';
      else if (currentState.world.housingMarket.scheduledViewingHousingId !== housingId) failure = 'Сначала назначь просмотр.';
      else if (currentState.player.locationId !== housing.locationId) failure = 'Нужно приехать по адресу объявления.';

      if (failure) {
        const logEntry = createLifeLogEntry(currentState, 'Просмотр недоступен', failure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Просмотр жилья', timeDeltaMinutes: 0, messages: [failure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const nextTime = addMinutes(currentState.time, HOUSING_VIEWING_DURATION_MINUTES);
      const market = markHousingViewed(currentState.world.housingMarket, housingId);
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        currentState.player,
        nextTime,
        'active',
        currentState.world.social,
        market
      );
      const message = `Жильё осмотрено: ${housing.name}. Характеристики объявления подтверждены.`;
      const messages = [message, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Просмотр жилья', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: elapsedApplied.social,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business,
          medical: elapsedApplied.medical
        },
        lastResult: {
          ok: true,
          actionName: 'Просмотр жилья',
          timeDeltaMinutes: HOUSING_VIEWING_DURATION_MINUTES,
          needsDelta: elapsedApplied.needsDelta,
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function rentHousing(housingId: HousingId): void {
    setGameState((currentState) => {
      const housing = getHousingById(housingId);
      if (!housing) return currentState;
      const moved = moveIntoHousing({
        player: currentState.player,
        market: currentState.world.housingMarket,
        housing,
        currentDay: currentState.time.day
      });
      if (!moved.result.ok) {
        const logEntry = createLifeLogEntry(currentState, 'Переезд недоступен', moved.result.messages.join(' '));
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: moved.result.actionName,
            timeDeltaMinutes: 0,
            messages: moved.result.messages
          },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const nextTime = addMinutes(currentState.time, HOUSING_MOVING_DURATION_MINUTES);
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        moved.player,
        nextTime,
        'active',
        currentState.world.social,
        moved.market
      );
      const messages = [...moved.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Новое жильё', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: elapsedApplied.social,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business,
          medical: elapsedApplied.medical
        },
        lastResult: {
          ok: true,
          actionName: moved.result.actionName,
          timeDeltaMinutes: HOUSING_MOVING_DURATION_MINUTES,
          moneyDelta: moved.result.moneyDelta,
          needsDelta: elapsedApplied.needsDelta,
          locationDelta: housing.locationId,
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function interactWithNpc(npcId: NpcId, interactionId: NpcInteractionId): void {
    const interaction = getNpcInteractionById(interactionId);
    if (!interaction) return;

    setGameState((currentState) => {
      const npc = currentState.world.population.npcs.find((candidate) => candidate.id === npcId);
      if (!npc) return currentState;
      const isPresent = npc.worldState.kind === 'at_location' && npc.worldState.locationId === currentState.player.locationId;
      const currentJob = getJobById(currentState.player.currentJobId);
      const isColleague = Boolean(currentJob && npc.employment?.locationId === currentJob.locationId);
      const context = getNpcSocialContext(npc, currentState.player.locationId, isColleague);
      const applied = applyNpcInteraction({
        player: currentState.player,
        time: currentState.time,
        social: currentState.world.social,
        npc,
        interaction,
        context,
        locationId: currentState.player.locationId,
        isPresent
      });

      if (!applied.result.ok) {
        const logEntry = createLifeLogEntry(currentState, 'Взаимодействие недоступно', applied.result.messages.join(' '));
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: interaction.label,
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
        applied.social
      );
      const nextSocial = maybeActivateSocialEvent({
        social: elapsedApplied.social,
        npc,
        context,
        day: applied.time.day,
        eventWeight: interaction.eventWeight ?? 0,
        templates: socialEventTemplates
      });
      const messages = [...applied.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: applied.time }, 'Люди', messages.join(' '));

      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: nextSocial,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business,
          medical: elapsedApplied.medical
        },
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
    });
  }

  function chooseSocialEvent(choiceId: SocialEventChoiceId): void {
    setGameState((currentState) => {
      const event = currentState.world.social.activeEvent;
      if (!event) return currentState;
      const npc = currentState.world.population.npcs.find((candidate) => candidate.id === event.npcId);
      if (!npc) {
        return {
          ...currentState,
          world: {
            ...currentState.world,
            social: { ...currentState.world.social, activeEvent: undefined }
          }
        };
      }

      const applied = applySocialEventChoice({
        player: currentState.player,
        time: currentState.time,
        social: currentState.world.social,
        npc,
        choiceId: String(choiceId)
      });
      if (!applied.result.ok) {
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: applied.result.actionName,
            timeDeltaMinutes: 0,
            messages: applied.result.messages
          }
        };
      }

      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        'active',
        applied.social
      );
      const messages = [...applied.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: applied.time }, 'Социальное событие', messages.join(' '));

      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: elapsedApplied.social,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business,
          medical: elapsedApplied.medical
        },
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
    });
  }

  function openCoffeeBusiness(premisesId: BusinessPremisesId, name: string): void {
    setGameState((currentState) => {
      const premises = getBusinessPremisesById(premisesId);
      const businessType = businessTypes[0];
      if (!premises || !businessType) return currentState;
      const launched = launchBusiness({
        player: currentState.player,
        world: currentState.world.business,
        premises,
        businessType,
        equipment: businessEquipment,
        supplies: businessSupplies,
        menuItems: businessMenuItems,
        time: currentState.time,
        name
      });
      const logEntry = createLifeLogEntry(
        currentState,
        launched.result.ok ? 'Открытие бизнеса' : 'Бизнес недоступен',
        launched.result.messages.join(' ')
      );
      return {
        ...currentState,
        player: launched.player,
        world: { ...currentState.world, business: launched.world },
        lastResult: {
          ok: launched.result.ok,
          actionName: launched.result.actionName,
          timeDeltaMinutes: 0,
          moneyDelta: launched.result.playerMoneyDelta,
          messages: launched.result.messages
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function purchaseBusinessSupply(supplyId: BusinessSupplyId, batches = 1): void {
    const supply = getBusinessSupplyById(supplyId);
    if (!supply) return;
    setGameState((currentState) => {
      const storageMultiplier = (currentState.world.business.ownedBusiness?.upgradeIds ?? []).reduce((value, id) => {
        const upgrade = getBusinessUpgradeById(id);
        return value * (upgrade?.effect.storageMultiplier ?? 1);
      }, 1);
      const applied = buyBusinessSupply({ world: currentState.world.business, supply, batches, storageMultiplier });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Закупка бизнеса' : 'Закупка недоступна', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.businessMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function changeBusinessMenuPrice(itemId: BusinessMenuItemId, price: number): void {
    const item = getBusinessMenuItemById(itemId);
    if (!item) return;
    setGameState((currentState) => {
      const applied = setBusinessMenuPrice({ world: currentState.world.business, item, price });
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, messages: applied.result.messages }
      };
    });
  }

  function hireBusinessNpc(npcId: NpcId, role: BusinessEmployeeRole): void {
    setGameState((currentState) => {
      const premises = getBusinessPremisesById(currentState.world.business.ownedBusiness?.premisesId);
      if (!premises) return currentState;
      const roleId = role === 'barista'
        ? NPC_ROLE_IDS.barista
        : role === 'administrator'
          ? NPC_ROLE_IDS.administrator
          : NPC_ROLE_IDS.cleaner;
      const applied = hireBusinessEmployee({
        world: currentState.world.business,
        population: currentState.world.population,
        npcId,
        role,
        roleId,
        currentDay: currentState.time.day,
        premisesLocationId: premises.locationId
      });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Новый сотрудник' : 'Найм недоступен', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world, population: applied.population },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function fireBusinessNpc(npcId: NpcId): void {
    setGameState((currentState) => {
      const applied = fireBusinessEmployee({ world: currentState.world.business, population: currentState.world.population, npcId });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Сотрудник уволен' : 'Увольнение недоступно', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world, population: applied.population },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function addBusinessFunds(amount: number): void {
    setGameState((currentState) => {
      const applied = investInBusiness({ player: currentState.player, world: currentState.world.business, amount });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Пополнение бизнеса' : 'Пополнение недоступно', applied.result.messages.join(' '));
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.playerMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function purchaseBusinessEquipment(equipmentId: BusinessEquipmentId): void {
    const equipment = getBusinessEquipmentById(equipmentId);
    if (!equipment) return;
    setGameState((currentState) => {
      const applied = buyBusinessEquipment({ world: currentState.world.business, equipment });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Оборудование бизнеса' : 'Покупка недоступна', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.businessMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function purchaseBusinessUpgrade(upgradeId: BusinessUpgradeId): void {
    const upgrade = getBusinessUpgradeById(upgradeId);
    if (!upgrade) return;
    setGameState((currentState) => {
      const applied = buyBusinessUpgrade({ world: currentState.world.business, upgrade });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Развитие бизнеса' : 'Улучшение недоступно', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.businessMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function workBusinessOwnerShift(): void {
    setGameState((currentState) => {
      const business = currentState.world.business.ownedBusiness;
      const premises = getBusinessPremisesById(business?.premisesId);
      const businessType = getBusinessTypeById(business?.typeId);
      if (!business || !premises || !businessType) return currentState;
      const failure = getMedicalActivityFailure(currentState.world.medical, 'work')
        ?? (currentState.player.locationId !== premises.locationId
        ? 'Нужно быть в своей кофейне.'
        : getScheduleActivityFailure(business.schedule, currentState.time, 240, 'Смена владельца')
          ?? getNeedsRequirementFailure(currentState.player.needs, { minEnergy: 20, minHealth: 25, minHunger: 6, minThirst: 6 }));
      if (failure) {
        const logEntry = createLifeLogEntry(currentState, 'Смена владельца недоступна', failure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Смена владельца', timeDeltaMinutes: 0, messages: [failure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const needsApplied = applyActivityNeedsDelta(currentState.player.needs, { energy: -16, hunger: -6, thirst: -8, mood: -1 }, { scaleEnergyCost: true });
      const skillApplied = applySkillExperience(currentState.player.skills, basicSkills[0].id, 12);
      const ownerPlayer = { ...currentState.player, needs: needsApplied.needs, skills: skillApplied.skills };
      const nextTime = addMinutes(currentState.time, 240);
      const simulated = simulateBusinessTime({
        world: currentState.world.business,
        fromTime: currentState.time,
        toTime: nextTime,
        population: currentState.world.population,
        premises,
        businessType,
        equipment: businessEquipment,
        menuItems: businessMenuItems,
        supplies: businessSupplies,
        upgrades: businessUpgrades,
        ownerWorking: true
      });
      const balanceBefore = business.balance;
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        ownerPlayer,
        nextTime,
        'active',
        currentState.world.social,
        currentState.world.housingMarket,
        simulated.world
      );
      const sicknessApplied = applyWorkWhileSick(elapsedApplied.medical, elapsedApplied.player, getTotalMinutes(nextTime));
      const balanceAfter = elapsedApplied.business.ownedBusiness?.balance ?? balanceBefore;
      const businessMessages = simulated.events.map((event) => event.text);
      const levelMessage = skillApplied.update.leveledUp ? `Навык «Сервис» повышен до уровня ${skillApplied.update.nextLevel}.` : undefined;
      const shiftMessage = `Ты отработал четыре часа в своей кофейне. Изменение счёта бизнеса: ${balanceAfter - balanceBefore >= 0 ? '+' : ''}${balanceAfter - balanceBefore} ₽.`;
      const messages = [shiftMessage, levelMessage, sicknessApplied.message, ...businessMessages, ...elapsedApplied.messages].filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Смена владельца', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: sicknessApplied.player,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: elapsedApplied.social,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business,
          medical: sicknessApplied.state
        },
        lastResult: {
          ok: true,
          actionName: 'Смена владельца',
          timeDeltaMinutes: 240,
          needsDelta: mergeNeedsDelta(needsApplied.delta, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...simulated.events.map((event) => createLifeLogEntry({ time: nextTime }, event.title, event.text)), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function submitJobApplication(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;
    setGameState((currentState) => {
      const location = getLocationById(job.locationId);
      const applied = submitPhoneJobApplication({
        state: currentState.world.phone,
        job,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        applicationFailure: getJobApplicationFailure(currentState.player, job),
        employerName: location?.name ?? 'Работодатель'
      });
      const logEntry = createLifeLogEntry(
        currentState,
        applied.result.ok ? 'Отклик отправлен' : 'Отклик не отправлен',
        applied.result.message
      );
      return {
        ...currentState,
        world: { ...currentState.world, phone: applied.state },
        lastResult: {
          ok: applied.result.ok,
          actionName: applied.result.title,
          timeDeltaMinutes: 0,
          messages: [applied.result.message]
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function togglePhoneSavedJob(jobId: JobId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: toggleSavedPhoneJob(currentState.world.phone, jobId) }
    }));
  }

  function setPhoneMapLocation(locationId?: LocationId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: setPhoneMapTarget(currentState.world.phone, locationId) }
    }));
  }

  function readPhoneNotification(id: PhoneNotificationId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: markPhoneNotificationRead(currentState.world.phone, id) }
    }));
  }

  function readPhoneMessage(id: PhoneMessageId): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, phone: markPhoneMessageRead(currentState.world.phone, id) }
    }));
  }

  function attendJobInterview(jobId: JobId): void {
    const job = getJobById(jobId);
    if (!job) return;
    setGameState((currentState) => {
      const location = getLocationById(job.locationId);
      const interview = completeJobInterview({
        state: currentState.world.phone,
        job,
        currentLocationId: currentState.player.locationId,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        employerName: location?.name ?? 'Работодатель'
      });
      if (!interview.result.ok) {
        const logEntry = createLifeLogEntry(currentState, interview.result.title, interview.result.message);
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: interview.result.title,
            timeDeltaMinutes: 0,
            messages: [interview.result.message]
          },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const hired = applyJob({ player: currentState.player, job });
      if (!hired.result.ok) {
        const message = hired.result.messages.join(' ');
        const logEntry = createLifeLogEntry(currentState, 'Собеседование не завершено', message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Собеседование', timeDeltaMinutes: 0, messages: [message] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const nextTime = addMinutes(currentState.time, 30);
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        hired.player,
        nextTime,
        'active',
        currentState.world.social,
        currentState.world.housingMarket,
        currentState.world.business
      );
      const messages = [interview.result.message, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Собеседование', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: elapsedApplied.social,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business,
          medical: elapsedApplied.medical,
          phone: interview.state
        },
        lastResult: {
          ok: true,
          actionName: 'Собеседование',
          timeDeltaMinutes: 30,
          needsDelta: elapsedApplied.needsDelta,
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }


  function scheduleMedicalVisit(serviceId: MedicalServiceId): void {
    const service = getMedicalServiceById(serviceId);
    if (!service) return;
    setGameState((currentState) => {
      const applied = scheduleMedicalAppointment({ state: currentState.world.medical, service, time: currentState.time });
      if (!applied.result.ok || !applied.appointment) {
        const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
          lifeLog: mergeLifeLog([entry], currentState.lifeLog)
        };
      }
      const appointment = applied.appointment;
      const calendarId = (`calendar_medical_${appointment.id}`) as PhoneCalendarEventId;
      const notificationId = (`notification_medical_${appointment.id}`) as PhoneNotificationId;
      const phone = {
        ...currentState.world.phone,
        calendarEvents: [{
          id: calendarId,
          type: 'medical_appointment' as const,
          title: service.name,
          locationId: service.clinicLocationId,
          startsAtTotalMinutes: appointment.startsAtTotalMinutes,
          durationMinutes: appointment.durationMinutes,
          status: 'scheduled' as const,
          medicalServiceId: service.id,
          medicalAppointmentId: appointment.id
        }, ...currentState.world.phone.calendarEvents].slice(0, 60),
        notifications: [{
          id: notificationId,
          appId: 'health' as const,
          title: 'Запись подтверждена',
          body: `${service.name}. Приём добавлен в календарь.`,
          createdAtTotalMinutes: getTotalMinutes(currentState.time),
          read: false,
          locationId: service.clinicLocationId,
          medicalServiceId: service.id,
          medicalAppointmentId: appointment.id
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      const entry = createLifeLogEntry(currentState, 'Запись к врачу', applied.result.message);
      return {
        ...currentState,
        world: { ...currentState.world, medical: applied.state, phone },
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([entry], currentState.lifeLog)
      };
    });
  }

  function attendMedicalVisit(serviceId: MedicalServiceId): void {
    const service = getMedicalServiceById(serviceId);
    if (!service) return;
    setGameState((currentState) => {
      const applied = attendMedicalAppointment({
        state: currentState.world.medical,
        player: currentState.player,
        service,
        time: currentState.time,
        currentLocationId: currentState.player.locationId
      });
      if (!applied.result.ok) {
        const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
          lifeLog: mergeLifeLog([entry], currentState.lifeLog)
        };
      }
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        'active',
        currentState.world.social,
        currentState.world.housingMarket,
        currentState.world.business,
        applied.state
      );
      const completedAppointment = applied.state.appointments.find((entry) => entry.serviceId === service.id && entry.status === 'completed');
      const phone = {
        ...currentState.world.phone,
        calendarEvents: currentState.world.phone.calendarEvents.map((event) =>
          event.medicalAppointmentId === completedAppointment?.id ? { ...event, status: 'completed' as const } : event
        ),
        notifications: [{
          id: (`notification_medical_result_${getTotalMinutes(applied.time)}`) as PhoneNotificationId,
          appId: 'health' as const,
          title: 'Приём завершён',
          body: applied.result.message,
          createdAtTotalMinutes: getTotalMinutes(applied.time),
          read: false,
          locationId: service.clinicLocationId,
          medicalServiceId: service.id,
          medicalAppointmentId: completedAppointment?.id
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      const messages = [applied.result.message, ...elapsedApplied.messages];
      const entry = createLifeLogEntry({ time: applied.time }, 'Медицина', messages.join(' '));
      return {
        ...currentState,
        time: applied.time,
        player: elapsedApplied.player,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: elapsedApplied.social,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business,
          medical: elapsedApplied.medical,
          phone
        },
        lastResult: {
          ok: true,
          actionName: applied.result.title,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([entry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function requestSickLeave(): void {
    setGameState((currentState) => {
      const applied = issueSickLeave({
        state: currentState.world.medical,
        day: currentState.time.day,
        totalMinutes: getTotalMinutes(currentState.time)
      });
      const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
      return {
        ...currentState,
        world: { ...currentState.world, medical: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([entry], currentState.lifeLog)
      };
    });
  }


  function scheduleVehicleInspectionAction(listingId: VehicleListingId): void {
    setGameState((currentState) => {
      const applied = scheduleUsedVehicleInspection(currentState.world.vehicles, listingId);
      const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
      return {
        ...currentState,
        world: { ...currentState.world, vehicles: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([entry], currentState.lifeLog)
      };
    });
  }

  function inspectVehicleAction(listingId: VehicleListingId): void {
    setGameState((currentState) => {
      const applied = inspectUsedVehicle({
        world: currentState.world.vehicles,
        listingId,
        currentLocationId: currentState.player.locationId
      });
      return applyVehicleOperationState(currentState, applied.world, applied.result);
    });
  }

  function buyUsedVehicleAction(listingId: VehicleListingId): void {
    setGameState((currentState) => {
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
    });
  }

  function buyNewVehicleAction(modelId: VehicleModelId): void {
    const model = getVehicleModelById(modelId);
    if (!model) return;
    setGameState((currentState) => {
      const applied = buyNewVehicle({
        world: currentState.world.vehicles,
        model,
        currentLocationId: currentState.player.locationId,
        dealerLocationId: getDealerLocationIdForModel(model),
        bankBalance: currentState.player.money,
        day: currentState.time.day
      });
      return applyVehicleOperationState(currentState, applied.world, applied.result);
    });
  }

  function refuelOwnedVehicle(liters: number): void {
    setGameState((currentState) => {
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
    });
  }

  function serviceOwnedVehicle(): void {
    setGameState((currentState) => {
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
    });
  }

  function sellOwnedVehicleAction(): void {
    setGameState((currentState) => {
      const model = getVehicleModelById(currentState.world.vehicles.ownedVehicle?.modelId);
      if (!model) return currentState;
      const applied = sellOwnedVehicle({ world: currentState.world.vehicles, model, day: currentState.time.day });
      return applyVehicleOperationState(currentState, applied.world, applied.result);
    });
  }

  function transferPersonalFunds(direction: 'bank_to_cash' | 'cash_to_bank' | 'bank_to_savings' | 'savings_to_bank', amount: number): void {
    setGameState((currentState) => {
      const applied = transferFinanceFunds({
        state: currentState.world.finance,
        player: currentState.player,
        direction,
        amount,
        totalMinutes: getTotalMinutes(currentState.time)
      });
      const logEntry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, finance: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function updateAutoSave(percent: number): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, finance: setFinanceAutoSave(currentState.world.finance, percent) }
    }));
  }

  function addSavingsGoal(title: string, targetAmount: number): void {
    setGameState((currentState) => {
      const applied = createSavingsGoal({ state: currentState.world.finance, title, targetAmount, day: currentState.time.day });
      return {
        ...currentState,
        world: { ...currentState.world, finance: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] }
      };
    });
  }

  function addMoneyToSavingsGoal(goalId: string, amount: number): void {
    setGameState((currentState) => {
      const applied = fundSavingsGoal({
        state: currentState.world.finance,
        player: currentState.player,
        goalId,
        amount,
        totalMinutes: getTotalMinutes(currentState.time)
      });
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, finance: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] }
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
    educationState,
    boxingState,
    conditionState,
    populationState,
    socialState,
    housingState,
    businessState,
    phoneState,
    financeState,
    vehicleState,
    healthState,
    performAction,
    moveToDistrict,
    moveToLocation,
    buyProduct,
    useInventoryItem,
    applyForJob,
    promoteJob,
    workShift,
    studyProgram,
    buyBoxingMembership,
    chooseBoxingTrainer,
    performBoxingTraining,
    startBoxingSparring,
    enterBoxingTournament,
    interactWithNpc,
    chooseSocialEvent,
    scheduleHousingViewing: scheduleHousingViewingAction,
    viewHousing,
    rentHousing,
    openCoffeeBusiness,
    purchaseBusinessSupply,
    changeBusinessMenuPrice,
    hireBusinessNpc,
    fireBusinessNpc,
    addBusinessFunds,
    purchaseBusinessEquipment,
    purchaseBusinessUpgrade,
    workBusinessOwnerShift,
    submitJobApplication,
    togglePhoneSavedJob,
    setPhoneMapLocation,
    readPhoneNotification,
    readPhoneMessage,
    attendJobInterview,
    scheduleMedicalVisit,
    attendMedicalVisit,
    requestSickLeave,
    transferPersonalFunds,
    updateAutoSave,
    addSavingsGoal,
    addMoneyToSavingsGoal,
    scheduleVehicleInspection: scheduleVehicleInspectionAction,
    inspectVehicle: inspectVehicleAction,
    buyUsedVehicle: buyUsedVehicleAction,
    buyNewVehicle: buyNewVehicleAction,
    refuelVehicle: refuelOwnedVehicle,
    serviceVehicle: serviceOwnedVehicle,
    sellVehicle: sellOwnedVehicleAction,
    resetGame
  };
}
