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
  applyForJob as applyJob,
  applyJobPromotion,
  applyJobShift,
  getJobApplicationFailure,
  getJobProgress,
  getJobPromotionFailure,
  getJobShiftFailure
} from '../core/jobs';
import { addInventoryItem, hasInventoryItem, removeInventoryItem } from '../core/inventory';
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
  calculateDistrictTravel,
  calculateLocationTravel,
  createDistrictTravelOption,
  createLocationTravelOptions
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
import { basicSkills, getSkillById } from '../data/skills/basicSkills';
import { boxingGyms, getBoxingGymById } from '../data/sports/boxingGyms';
import { boxingTrainers, getBoxingTrainerById } from '../data/sports/boxingTrainers';
import { boxingTrainings, getBoxingTrainingById } from '../data/sports/boxingTrainings';
import { boxingOpponents, getBoxingOpponentById } from '../data/sports/boxingOpponents';
import { boxingTournaments, getBoxingTournamentById } from '../data/sports/boxingTournaments';
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
  PhoneMessageId,
  PhoneNotificationId,
  LocationId,
  ProductId,
  NpcId,
  NpcInteractionId,
  SocialEventChoiceId
} from '../types/ids';
import type { HousingId, HousingMarketState } from '../types/housing';
import type { BusinessEmployeeRole, BusinessWorldState } from '../types/business';
import type { TravelModeId } from '../types/transport';
import type { NeedsState } from '../types/needs';
import type { Player } from '../types/player';
import type { GameTime } from '../types/time';
import type { Npc } from '../types/npc';
import type { SocialContext, SocialNpcView } from '../types/relationship';
import type { SocialState } from '../types/socialEvent';
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
  businessOverride: BusinessWorldState = currentState.world.business
): { player: Player; population: GameState['world']['population']; social: SocialState; housingMarket: HousingMarketState; business: BusinessWorldState; lifeLogEntries: LifeLogEntry[]; needsDelta?: Partial<NeedsState>; messages: string[] } {
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

  return {
    player: nextPlayer,
    population,
    social,
    housingMarket,
    business: businessApplied.world,
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
  const messages = [...applied.result.messages, ...elapsedApplied.messages];
  const logEntry = createLifeLogEntry({ time: applied.time }, logTitle, messages.join(' '));
  return {
    ...currentState,
    player: elapsedApplied.player,
    world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business },
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
      locationScheduleStatus,
      locationScheduleStatuses,
      actionScheduleFailure,
      shopScheduleFailure,
      locationTravelOptions,
      districtTravelOptions
    };
  }, [gameState.player.cityId, gameState.player.districtId, gameState.player.locationId, gameState.player.money, gameState.player.needs, gameState.time]);

  const jobState = useMemo(() => {
    const currentJob = getJobById(gameState.player.currentJobId);

    function buildJobView(job: import('../types/job').Job) {
      const location = getLocationById(job.locationId);
      const district = location ? getDistrictById(location.districtId) : undefined;
      const applicationFailure = getJobApplicationFailure(gameState.player, job);
      const shiftFailure = getJobShiftFailure(gameState.player, job, gameState.time);
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
  }, [gameState.player, gameState.time]);

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
      ? createLocationTravelOptions(currentLocation, [mapTarget], travelContext)[0]
      : undefined;

    return {
      phone,
      jobs,
      unreadCount: getPhoneUnreadCount(phone),
      unreadMessages: phone.messages.filter((entry) => !entry.read).length,
      unreadNotifications: phone.notifications.filter((entry) => !entry.read).length,
      mapTarget,
      mapRoute
    };
  }, [gameState.player, gameState.time, gameState.world.phone]);

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
      const failure = gym ? getBoxingTrainingFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        training,
        trainer: selectedTrainer,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.';
      return {
        training,
        canTrain: !failure,
        failure,
        sessionPrice: selectedTrainer?.sessionPrice ?? 0,
        effectiveNeedsDelta: adjustActivityNeedsDelta(gameState.player.needs, training.needsDelta, { scaleEnergyCost: true })
      };
    });
    const opponents = boxingOpponents.map((opponent) => {
      const failure = gym ? getBoxingSparringFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        opponent,
        trainer: selectedTrainer,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.';
      return { opponent, canSpar: !failure, failure };
    });
    const tournaments = boxingTournaments.map((tournament) => {
      const failure = gym ? getBoxingTournamentFailure({
        player: gameState.player,
        time: gameState.time,
        gym,
        tournament,
        schedule: gymLocation?.openingHours
      }) : 'Зал не найден.';
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
  }, [gameState.player, gameState.time]);

  const conditionState = useMemo(() => ({
    conditions: getNeedConditions(gameState.player.needs),
    consequences: getNeedsConsequences(gameState.player.needs)
  }), [gameState.player.needs]);

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
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business },
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
      const travel = calculateDistrictTravel({
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
      const resultMessages = [...messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', resultMessages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business },
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
      const travel = calculateLocationTravel({
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
      const resultMessages = [...messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Перемещение', resultMessages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business },
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
      const consumedPlayer = {
        ...currentState.player,
        needs: applyNeedsDelta(currentState.player.needs, product.effects),
        inventory: removeInventoryItem(currentState.player.inventory, productId)
      };
      const elapsedApplied = applyElapsedTimeConsequences(currentState, consumedPlayer, nextTime, 'active');
      const warning = getNeedWarning(elapsedApplied.player.needs);
      const message = `Использовано: ${product.name}. Потрачено ${product.useDurationMinutes} мин.`;
      const messages = [message, warning, ...elapsedApplied.messages]
        .filter((entry): entry is string => Boolean(entry));
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Инвентарь', messages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business },
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
      const applied = applyJobShift({
        player: currentState.player,
        time: currentState.time,
        job
      });
      const elapsedApplied = applyElapsedTimeConsequences(currentState, applied.player, applied.time, 'active');
      const skillLevelMessages = (applied.result.skillProgressUpdates ?? [])
        .filter((update) => update.leveledUp)
        .map((update) => `Навык «${getSkillById(update.skillId)?.name ?? 'Навык'}» повышен до уровня ${update.nextLevel}.`);
      const resultMessages = [...applied.result.messages, ...skillLevelMessages, ...elapsedApplied.messages];
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
        player: elapsedApplied.player,
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business },
        time: applied.time,
        lastResult: {
          ok: applied.result.ok,
          actionName: applied.result.jobTitle,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
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
        world: { ...currentState.world, population: elapsedApplied.population, social: elapsedApplied.social, housingMarket: elapsedApplied.housingMarket, business: elapsedApplied.business },
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
          business: elapsedApplied.business
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
          business: elapsedApplied.business
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
          business: elapsedApplied.business
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
          business: elapsedApplied.business
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
      const failure = currentState.player.locationId !== premises.locationId
        ? 'Нужно быть в своей кофейне.'
        : getScheduleActivityFailure(business.schedule, currentState.time, 240, 'Смена владельца')
          ?? getNeedsRequirementFailure(currentState.player.needs, { minEnergy: 20, minHealth: 25, minHunger: 6, minThirst: 6 });
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
      const balanceAfter = elapsedApplied.business.ownedBusiness?.balance ?? balanceBefore;
      const businessMessages = simulated.events.map((event) => event.text);
      const levelMessage = skillApplied.update.leveledUp ? `Навык «Сервис» повышен до уровня ${skillApplied.update.nextLevel}.` : undefined;
      const shiftMessage = `Ты отработал четыре часа в своей кофейне. Изменение счёта бизнеса: ${balanceAfter - balanceBefore >= 0 ? '+' : ''}${balanceAfter - balanceBefore} ₽.`;
      const messages = [shiftMessage, levelMessage, ...businessMessages, ...elapsedApplied.messages].filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Смена владельца', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: {
          ...currentState.world,
          population: elapsedApplied.population,
          social: elapsedApplied.social,
          housingMarket: elapsedApplied.housingMarket,
          business: elapsedApplied.business
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
    resetGame
  };
}
