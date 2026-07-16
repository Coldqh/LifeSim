import type { ActionResult } from '../types/actions';
import type { CityId, DistrictId, LocationId, NpcId, PlayerId, ProductId, SkillId } from '../types/ids';
import type { Player } from '../types/player';
import type { PlayerSkills } from '../types/skill';
import type { HousingId, HousingMarketState, RentalContract } from '../types/housing';
import type { BusinessWorldState, OwnedBusiness } from '../types/business';
import type { CalendarDate, GameTime } from '../types/time';
import type { PhoneState } from '../types/phone';
import type { PersonalFinanceState } from '../types/finance';
import type { VehicleWorldState } from '../types/vehicle';
import type { MedicalState } from '../types/healthcare';
import type { IntercityTravelState } from '../types/intercity';
import type { UniversityState } from '../types/university';
import type { WorldAtlasState } from '../types/worldAtlas';
import { calculateAge, createInitialTime, formatGameTime, getTotalMinutes, normalizeGameTime } from '../core/time';
import { createInitialBoxingProfile } from '../core/sport';
import { createInitialCareerState, issueDegreeQualification, normalizePlayerCareerState, normalizePlayerQualifications } from '../core/career';
import type { BoxingProfile } from '../types/boxing';
import type { PopulationState } from '../types/population';
import { createPopulationSeed, generatePopulation, simulatePopulation } from '../core/population';
import { createInitialSocialState, createNpcPersonality } from '../core/relationships';
import type { SocialState } from '../types/socialEvent';
import { populationDataSource } from '../data/population/config';
import { createHousingMarket } from '../core/housing';
import { createEmptyBusinessReport, createInitialBusinessWorldState } from '../core/business';
import { createInitialPhoneState } from '../core/phone';
import { createInitialFinanceState } from '../core/finance';
import { createInitialVehicleWorld } from '../core/vehicles';
import { createInitialMedicalState } from '../core/healthcare';
import { createInitialIntercityState } from '../core/intercity';
import { createInitialUniversityState } from '../core/university';
import { createInitialWorldAtlasState, getRegionalCityIds, normalizeWorldAtlasState } from '../core/world-atlas';
import { usedVehicleListingTemplates } from '../data/vehicles/usedListingTemplates';
import { cityRegistry } from '../data/cities';
import { getAllBusinessPremises, getAllHousing, getDegreeProgramById, getUniversityById } from '../data/cities/contentSelectors';
import { intercityNetwork } from '../data/intercity/routes';
import {
  CURRENT_SAVE_VERSION,
  GAME_STATE_BACKUP_STORAGE_KEY,
  GAME_STATE_STORAGE_KEY,
  canDecodeSavePayload,
  decodeSavePayload,
  encodeSavePayload,
  getAllSaveStorageKeys,
  getSaveStorageCandidates
} from './saveMigrations';

export { CURRENT_SAVE_VERSION, GAME_STATE_BACKUP_STORAGE_KEY, GAME_STATE_STORAGE_KEY } from './saveMigrations';
const REMOVED_PRODUCT_IDS = new Set(['hygiene_kit', 'toothpaste', 'laundry_powder']);
const housingCatalogue = getAllHousing();
const businessPremisesCatalogue = getAllBusinessPremises();

export type LifeLogEntry = {
  id: string;
  day: number;
  timeLabel: string;
  title: string;
  text: string;
};

export type WorldState = {
  population: PopulationState;
  social: SocialState;
  housingMarket: HousingMarketState;
  business: BusinessWorldState;
  phone: PhoneState;
  finance: PersonalFinanceState;
  vehicles: VehicleWorldState;
  medical: MedicalState;
  intercity: IntercityTravelState;
  university: UniversityState;
  atlas: WorldAtlasState;
};

export type GameState = {
  player: Player;
  time: GameTime;
  world: WorldState;
  lifeLog: LifeLogEntry[];
  lastResult?: ActionResult;
};

function playerId(value: string): PlayerId {
  return value as PlayerId;
}

function cityId(value: string): CityId {
  return value as CityId;
}

function districtId(value: string): DistrictId {
  return value as DistrictId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}

function housingId(value: string): HousingId {
  return value as HousingId;
}

function productId(value: string): ProductId {
  return value as ProductId;
}



function createStarterInventory() {
  return [
    { productId: productId('water_15l'), quantity: 2 },
    { productId: productId('ready_meal'), quantity: 2 },
    { productId: productId('snack_bar'), quantity: 1 },
    { productId: productId('energy_drink'), quantity: 1 }
  ];
}


function normalizeBoxingProfile(value: unknown): BoxingProfile {
  const initial = createInitialBoxingProfile();
  if (!value || typeof value !== 'object') return initial;
  const profile = value as Partial<BoxingProfile>;
  const stats = profile.stats && typeof profile.stats === 'object' ? profile.stats : initial.stats;
  const normalizeRecord = (record: unknown) => {
    if (!record || typeof record !== 'object') return { wins: 0, losses: 0, draws: 0 };
    const raw = record as { wins?: unknown; losses?: unknown; draws?: unknown };
    return {
      wins: typeof raw.wins === 'number' ? Math.max(0, Math.floor(raw.wins)) : 0,
      losses: typeof raw.losses === 'number' ? Math.max(0, Math.floor(raw.losses)) : 0,
      draws: typeof raw.draws === 'number' ? Math.max(0, Math.floor(raw.draws)) : 0
    };
  };
  const numberOr = (raw: unknown, fallback: number) => typeof raw === 'number' ? raw : fallback;

  return {
    ...initial,
    ...profile,
    level: Math.max(1, Math.floor(numberOr(profile.level, initial.level))),
    experience: Math.max(0, Math.floor(numberOr(profile.experience, initial.experience))),
    stats: {
      technique: numberOr(stats.technique, initial.stats.technique),
      speed: numberOr(stats.speed, initial.stats.speed),
      power: numberOr(stats.power, initial.stats.power),
      defense: numberOr(stats.defense, initial.stats.defense),
      stamina: numberOr(stats.stamina, initial.stats.stamina)
    },
    form: Math.min(100, Math.max(0, numberOr(profile.form, initial.form))),
    fatigue: Math.min(100, Math.max(0, numberOr(profile.fatigue, initial.fatigue))),
    rating: Math.max(0, Math.floor(numberOr(profile.rating, initial.rating))),
    officialRecord: normalizeRecord(profile.officialRecord),
    sparringRecord: normalizeRecord(profile.sparringRecord),
    sparringCount: Math.max(0, Math.floor(numberOr(profile.sparringCount, 0))),
    fightHistory: Array.isArray(profile.fightHistory) ? profile.fightHistory.slice(0, 20) : [],
    tournamentWins: Math.max(0, Math.floor(numberOr(profile.tournamentWins, 0)))
  };
}

function normalizePlayerSkills(value: unknown): PlayerSkills {
  if (!value || typeof value !== 'object') return {};

  return Object.entries(value as Record<string, unknown>).reduce<PlayerSkills>((skills, [key, rawProgress]) => {
    const skillId = key as SkillId;

    if (typeof rawProgress === 'number') {
      skills[skillId] = { level: Math.max(0, Math.floor(rawProgress)), experience: 0 };
      return skills;
    }

    if (rawProgress && typeof rawProgress === 'object') {
      const progress = rawProgress as { level?: unknown; experience?: unknown };
      skills[skillId] = {
        level: typeof progress.level === 'number' ? Math.max(0, Math.floor(progress.level)) : 0,
        experience: typeof progress.experience === 'number' ? Math.max(0, Math.floor(progress.experience)) : 0
      };
    }

    return skills;
  }, {});
}

export function createInitialPlayer(): Player {
  return {
    id: playerId('player_001'),
    name: 'Игрок',
    age: 18,
    birthDate: { year: 2008, month: 8, dayOfMonth: 20 },
    money: 11000,
    cityId: cityId('moscow'),
    districtId: districtId('msk_danilovsky'),
    locationId: locationId('msk_danilovsky_home'),
    needs: {
      hunger: 75,
      thirst: 75,
      energy: 80,
      health: 85,
      mood: 60
    },
    skills: {},
    inventory: createStarterInventory(),
    completedShifts: {},
    jobExperience: {},
    jobLevels: {},
    qualifications: [],
    career: createInitialCareerState(),
    housingId: housingId('housing_room_danilovsky'),
    rentDebt: 0,
    daysUntilRent: 7,
    rentalContract: {
      housingId: housingId('housing_room_danilovsky'),
      startedDay: 1,
      nextPaymentDay: 8,
      depositPaid: 0
    },
    boxing: createInitialBoxingProfile()
  };
}

export function createInitialGameState(): GameState {
  const time = createInitialTime();
  const player = createInitialPlayer();
  const regionalCityIds = getRegionalCityIds({
    activeCityId: player.cityId,
    routes: intercityNetwork.routes,
    roadConnections: intercityNetwork.roadConnections
  });
  const detailedCityIds = [player.cityId, ...regionalCityIds];
  const detailedLocations = cityRegistry.locations.filter((location) => detailedCityIds.includes(location.cityId));
  const generatedPopulation = generatePopulation({
    seed: createPopulationSeed(),
    locations: detailedLocations,
    time,
    dataSource: populationDataSource
  });
  const population = simulatePopulation({
    population: generatedPopulation,
    fromTime: time,
    toTime: time,
    locations: detailedLocations,
    getLocationProfile: populationDataSource.getLocationProfile
  });

  const atlas = createInitialWorldAtlasState({
    cities: cityRegistry.cities,
    districts: cityRegistry.districts,
    locations: cityRegistry.locations,
    population,
    activeCityId: player.cityId,
    regionalCityIds,
    time
  });

  return {
    player,
    time,
    world: {
      population,
      social: createInitialSocialState(getTotalMinutes(time)),
      housingMarket: createHousingMarket({
        seed: population.seed ^ 0x48a3f2,
        day: time.day,
        currentHousingId: housingId('housing_room_danilovsky'),
        catalogue: housingCatalogue
      }),
      business: createInitialBusinessWorldState(population.seed, businessPremisesCatalogue.map((premises) => premises.id)),
      phone: createInitialPhoneState(getTotalMinutes(time)),
      finance: createInitialFinanceState(11000, time.day),
      vehicles: createInitialVehicleWorld(population.seed, time.day, usedVehicleListingTemplates),
      medical: createInitialMedicalState(getTotalMinutes(time)),
      intercity: createInitialIntercityState(getTotalMinutes(time)),
      university: createInitialUniversityState(getTotalMinutes(time)),
      atlas
    },
    lifeLog: [
      {
        id: 'log_start',
        day: time.day,
        timeLabel: formatGameTime(time),
        title: 'Старт',
        text: 'Москва. Даниловский район. В инвентаре есть стартовый запас еды, воды и Burn.'
      }
    ]
  };
}

export function createLifeLogEntry(state: Pick<GameState, 'time'>, title: string, text: string): LifeLogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    day: state.time.day,
    timeLabel: formatGameTime(state.time),
    title,
    text
  };
}

function getDetailedPopulationLocations(cityIds: readonly CityId[]) {
  const included = new Set(cityIds.map(String));
  return cityRegistry.locations.filter((location) => included.has(String(location.cityId)));
}

function getNpcCityId(npc: PopulationState['npcs'][number]): CityId | undefined {
  return cityRegistry.getDistrict(npc.homeDistrictId)?.cityId
    ?? cityRegistry.getLocation(npc.employment?.locationId)?.cityId;
}

function createPopulationForTime(time: GameTime, detailedCityIds: readonly CityId[]): PopulationState {
  const locations = getDetailedPopulationLocations(detailedCityIds);
  const generated = generatePopulation({
    seed: createPopulationSeed(),
    locations,
    time,
    dataSource: populationDataSource
  });
  return simulatePopulation({
    population: generated,
    fromTime: time,
    toTime: time,
    locations,
    getLocationProfile: populationDataSource.getLocationProfile
  });
}

function normalizePopulation(
  value: unknown,
  time: GameTime,
  detailedCityIds: readonly CityId[]
): PopulationState {
  if (!value || typeof value !== 'object') return createPopulationForTime(time, detailedCityIds);
  const candidate = value as Partial<PopulationState>;
  if (!Array.isArray(candidate.npcs) || typeof candidate.seed !== 'number') {
    return createPopulationForTime(time, detailedCityIds);
  }

  const normalizedNpcs = candidate.npcs.map((npc) => ({
    ...npc,
    personality: npc.personality ?? createNpcPersonality(String(npc.id), npc.activityProfile)
  }));
  const presentCityIds = new Set(normalizedNpcs.map(getNpcCityId).filter((cityId): cityId is CityId => Boolean(cityId)).map(String));
  const missingCityIds = detailedCityIds.filter((cityId) => !presentCityIds.has(String(cityId)));

  if (missingCityIds.length > 0) {
    const generated = generatePopulation({
      seed: candidate.seed,
      locations: getDetailedPopulationLocations(detailedCityIds),
      time,
      dataSource: populationDataSource
    });
    const usedIds = new Set(normalizedNpcs.map((npc) => String(npc.id)));

    for (const missingCityId of missingCityIds) {
      const generatedCityNpcs = generated.npcs.filter((npc) => getNpcCityId(npc) === missingCityId);
      generatedCityNpcs.forEach((npc, index) => {
        const prefix = String(missingCityId).replace(/[^a-z0-9]+/gi, '_');
        let rawId = `npc_${prefix}_${String(index + 1).padStart(4, '0')}`;
        let suffix = 1;
        while (usedIds.has(rawId)) {
          rawId = `npc_${prefix}_${String(index + 1).padStart(4, '0')}_${suffix}`;
          suffix += 1;
        }
        usedIds.add(rawId);
        normalizedNpcs.push({
          ...npc,
          id: rawId as NpcId,
          personality: createNpcPersonality(rawId, npc.activityProfile)
        });
      });
    }
  }

  return {
    seed: candidate.seed,
    generatedAtDay: typeof candidate.generatedAtDay === 'number' ? candidate.generatedAtDay : time.day,
    lastSimulatedTotalMinutes: typeof candidate.lastSimulatedTotalMinutes === 'number'
      ? Math.min(getTotalMinutes(time), Math.max(0, candidate.lastSimulatedTotalMinutes))
      : getTotalMinutes(time),
    npcs: normalizedNpcs
  };
}


function normalizeSocialState(value: unknown, time: GameTime): SocialState {
  const initial = createInitialSocialState(getTotalMinutes(time));
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<SocialState>;
  const relationships: SocialState['relationships'] = candidate.relationships && typeof candidate.relationships === 'object'
    ? Object.fromEntries(Object.entries(candidate.relationships).map(([key, raw]) => {
        const relationship = raw as import('../types/relationship').NpcRelationship;
        const romance = typeof relationship.romance === 'number' ? Math.min(100, Math.max(0, relationship.romance)) : 0;
        const romanceStatus: import('../types/relationship').RomanceStatus = relationship.romanceStatus === 'interest' || relationship.romanceStatus === 'dating' || relationship.romanceStatus === 'partner'
          ? relationship.romanceStatus
          : 'none';
        return [key, {
          ...relationship,
          familiarity: typeof relationship.familiarity === 'number' ? relationship.familiarity : 0,
          affinity: typeof relationship.affinity === 'number' ? relationship.affinity : 0,
          trust: typeof relationship.trust === 'number' ? relationship.trust : 0,
          tension: typeof relationship.tension === 'number' ? relationship.tension : 0,
          romance,
          romanceStatus,
          interactionCount: typeof relationship.interactionCount === 'number' ? relationship.interactionCount : 0,
          memories: Array.isArray(relationship.memories) ? relationship.memories.slice(0, 12) : []
        }];
      }))
    : {};
  return {
    relationships,
    scheduledEvents: Array.isArray(candidate.scheduledEvents) ? candidate.scheduledEvents : [],
    activeEvent: candidate.activeEvent && typeof candidate.activeEvent === 'object' ? candidate.activeEvent : undefined,
    eventCooldowns: candidate.eventCooldowns && typeof candidate.eventCooldowns === 'object' ? candidate.eventCooldowns : {},
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 40) : [],
    contacts: candidate.contacts && typeof candidate.contacts === 'object' ? candidate.contacts : {},
    invitations: Array.isArray(candidate.invitations) ? candidate.invitations.slice(0, 60) : [],
    meetings: Array.isArray(candidate.meetings) ? candidate.meetings.slice(0, 60) : [],
    initiativeCooldowns: candidate.initiativeCooldowns && typeof candidate.initiativeCooldowns === 'object' ? candidate.initiativeCooldowns : {},
    lastProcessedTotalMinutes: typeof candidate.lastProcessedTotalMinutes === 'number'
      ? Math.min(getTotalMinutes(time), Math.max(0, candidate.lastProcessedTotalMinutes))
      : getTotalMinutes(time)
  };
}


function normalizeRentalContract(value: unknown, playerHousingId: HousingId, time: GameTime, daysUntilRent: number): RentalContract {
  if (!value || typeof value !== 'object') {
    return {
      housingId: playerHousingId,
      startedDay: Math.max(1, time.day - 1),
      nextPaymentDay: time.day + Math.max(1, daysUntilRent || 7),
      depositPaid: 0
    };
  }
  const candidate = value as Partial<RentalContract>;
  return {
    housingId: candidate.housingId ?? playerHousingId,
    startedDay: typeof candidate.startedDay === 'number' ? Math.max(1, Math.floor(candidate.startedDay)) : Math.max(1, time.day - 1),
    nextPaymentDay: typeof candidate.nextPaymentDay === 'number' ? Math.max(time.day, Math.floor(candidate.nextPaymentDay)) : time.day + Math.max(1, daysUntilRent || 7),
    depositPaid: typeof candidate.depositPaid === 'number' ? Math.max(0, Math.floor(candidate.depositPaid)) : 0
  };
}

function normalizeHousingMarket(value: unknown, time: GameTime, populationSeed: number, currentHousingId: HousingId): HousingMarketState {
  if (!value || typeof value !== 'object') {
    return createHousingMarket({
      seed: populationSeed ^ 0x48a3f2,
      day: time.day,
      currentHousingId,
      catalogue: housingCatalogue
    });
  }
  const candidate = value as Partial<HousingMarketState>;
  if (typeof candidate.seed !== 'number' || !Array.isArray(candidate.activeHousingIds)) {
    return createHousingMarket({
      seed: populationSeed ^ 0x48a3f2,
      day: time.day,
      currentHousingId,
      catalogue: housingCatalogue
    });
  }
  const knownIds = new Set(housingCatalogue.map((housing) => housing.id));
  return {
    seed: candidate.seed,
    lastRefreshDay: typeof candidate.lastRefreshDay === 'number' ? candidate.lastRefreshDay : time.day,
    activeHousingIds: candidate.activeHousingIds.filter((id): id is HousingId => knownIds.has(id) && id !== currentHousingId),
    viewedHousingIds: Array.isArray(candidate.viewedHousingIds)
      ? candidate.viewedHousingIds.filter((id): id is HousingId => knownIds.has(id))
      : [],
    scheduledViewingHousingId: candidate.scheduledViewingHousingId && knownIds.has(candidate.scheduledViewingHousingId)
      ? candidate.scheduledViewingHousingId
      : undefined
  };
}


function normalizeBusinessWorld(value: unknown, time: GameTime, populationSeed: number): BusinessWorldState {
  const initial = createInitialBusinessWorldState(populationSeed, businessPremisesCatalogue.map((premises) => premises.id));
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<BusinessWorldState>;
  const knownPremisesIds = new Set(businessPremisesCatalogue.map((premises) => premises.id));
  const owned = candidate.ownedBusiness && typeof candidate.ownedBusiness === 'object'
    ? candidate.ownedBusiness as Partial<OwnedBusiness>
    : undefined;
  const normalizedOwned = owned?.id && owned.typeId && owned.premisesId && knownPremisesIds.has(owned.premisesId)
    ? {
        ...owned,
        id: owned.id,
        name: typeof owned.name === 'string' ? owned.name : 'Городской кофе',
        typeId: owned.typeId,
        premisesId: owned.premisesId,
        createdDay: typeof owned.createdDay === 'number' ? owned.createdDay : time.day,
        balance: typeof owned.balance === 'number' ? Math.max(0, Math.floor(owned.balance)) : 0,
        debt: typeof owned.debt === 'number' ? Math.max(0, Math.floor(owned.debt)) : 0,
        reputation: typeof owned.reputation === 'number' ? Math.min(100, Math.max(0, owned.reputation)) : 45,
        schedule: owned.schedule ?? { kind: 'always' as const },
        equipmentIds: Array.isArray(owned.equipmentIds) ? owned.equipmentIds : [],
        inventory: owned.inventory && typeof owned.inventory === 'object' ? owned.inventory : {},
        menuPrices: owned.menuPrices && typeof owned.menuPrices === 'object' ? owned.menuPrices : {},
        employees: Array.isArray(owned.employees) ? owned.employees : [],
        upgradeIds: Array.isArray(owned.upgradeIds) ? owned.upgradeIds : [],
        currentReport: owned.currentReport && typeof owned.currentReport === 'object'
          ? { ...createEmptyBusinessReport(time.day), ...owned.currentReport }
          : createEmptyBusinessReport(time.day),
        reports: Array.isArray(owned.reports) ? owned.reports.slice(0, 30) : [],
        nextRentDay: typeof owned.nextRentDay === 'number' ? owned.nextRentDay : time.day + 7,
        lastProcessedTotalMinutes: typeof owned.lastProcessedTotalMinutes === 'number' ? owned.lastProcessedTotalMinutes : 0,
        lastCustomerNpcIds: Array.isArray(owned.lastCustomerNpcIds) ? owned.lastCustomerNpcIds.slice(0, 12) : []
      } as OwnedBusiness
    : undefined;

  return {
    seed: typeof candidate.seed === 'number' ? candidate.seed : initial.seed,
    activePremisesIds: Array.isArray(candidate.activePremisesIds)
      ? candidate.activePremisesIds.filter((id) => knownPremisesIds.has(id) && id !== normalizedOwned?.premisesId)
      : businessPremisesCatalogue.map((premises) => premises.id).filter((id) => id !== normalizedOwned?.premisesId),
    ownedBusiness: normalizedOwned
  };
}


function normalizePhoneState(value: unknown, time: GameTime): PhoneState {
  const initial = createInitialPhoneState(getTotalMinutes(time));
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<PhoneState>;
  return {
    applications: Array.isArray(candidate.applications) ? candidate.applications.slice(0, 40) : [],
    notifications: Array.isArray(candidate.notifications) ? candidate.notifications.slice(0, 80) : [],
    messages: Array.isArray(candidate.messages) ? candidate.messages.slice(0, 80) : [],
    calendarEvents: Array.isArray(candidate.calendarEvents) ? candidate.calendarEvents.slice(0, 60) : [],
    savedJobIds: Array.isArray(candidate.savedJobIds) ? candidate.savedJobIds : [],
    dailyOpportunityResolutions: Array.isArray(candidate.dailyOpportunityResolutions)
      ? candidate.dailyOpportunityResolutions.slice(0, 60)
      : [],
    mapTargetLocationId: candidate.mapTargetLocationId,
    lastProcessedTotalMinutes: typeof candidate.lastProcessedTotalMinutes === 'number'
      ? Math.min(getTotalMinutes(time), Math.max(0, candidate.lastProcessedTotalMinutes))
      : getTotalMinutes(time)
  };
}


function normalizeVehicleWorld(value: unknown, populationSeed: number, time: GameTime): VehicleWorldState {
  const initial = createInitialVehicleWorld(populationSeed, time.day, usedVehicleListingTemplates);
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<VehicleWorldState>;
  const knownListingIds = new Set(usedVehicleListingTemplates.map((listing) => String(listing.id)));
  return {
    seed: typeof candidate.seed === 'number' ? candidate.seed : initial.seed,
    lastMarketRefreshDay: typeof candidate.lastMarketRefreshDay === 'number' ? candidate.lastMarketRefreshDay : time.day,
    usedListings: Array.isArray(candidate.usedListings)
      ? candidate.usedListings.filter((listing) => knownListingIds.has(String(listing.id)))
      : initial.usedListings,
    inspectedListingIds: Array.isArray(candidate.inspectedListingIds)
      ? candidate.inspectedListingIds.filter((id) => knownListingIds.has(String(id)))
      : [],
    scheduledInspectionListingId: candidate.scheduledInspectionListingId && knownListingIds.has(String(candidate.scheduledInspectionListingId))
      ? candidate.scheduledInspectionListingId
      : undefined,
    ownedVehicle: candidate.ownedVehicle && typeof candidate.ownedVehicle === 'object'
      ? {
          ...candidate.ownedVehicle,
          odometerKm: Math.max(0, Number(candidate.ownedVehicle.odometerKm ?? 0)),
          fuelLiters: Math.max(0, Number(candidate.ownedVehicle.fuelLiters ?? 0)),
          conditionPercent: Math.min(100, Math.max(0, Number(candidate.ownedVehicle.conditionPercent ?? 60))),
          reliabilityPercent: Math.min(100, Math.max(0, Number(candidate.ownedVehicle.reliabilityPercent ?? 60))),
          knownDefectIds: Array.isArray(candidate.ownedVehicle.knownDefectIds) ? candidate.ownedVehicle.knownDefectIds : []
        }
      : undefined
  };
}


function normalizeMedicalState(value: unknown, time: GameTime): MedicalState {
  const initial = createInitialMedicalState(getTotalMinutes(time));
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<MedicalState>;
  return {
    conditions: Array.isArray(candidate.conditions) ? candidate.conditions.slice(0, 20) : [],
    appointments: Array.isArray(candidate.appointments) ? candidate.appointments.slice(0, 24) : [],
    prescriptions: Array.isArray(candidate.prescriptions) ? candidate.prescriptions.slice(0, 30) : [],
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 60) : [],
    sickLeave: candidate.sickLeave && typeof candidate.sickLeave === 'object' ? candidate.sickLeave : undefined,
    lastProcessedTotalMinutes: typeof candidate.lastProcessedTotalMinutes === 'number'
      ? Math.min(getTotalMinutes(time), Math.max(0, candidate.lastProcessedTotalMinutes))
      : getTotalMinutes(time),
    triggerCooldowns: candidate.triggerCooldowns && typeof candidate.triggerCooldowns === 'object'
      ? candidate.triggerCooldowns
      : {}
  };
}

function normalizeIntercityState(value: unknown, time: GameTime): IntercityTravelState {
  const initial = createInitialIntercityState(getTotalMinutes(time));
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<IntercityTravelState>;
  return {
    tickets: Array.isArray(candidate.tickets) ? candidate.tickets.slice(0, 30) : [],
    activeStay: candidate.activeStay && typeof candidate.activeStay === 'object' ? candidate.activeStay : undefined,
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 30) : [],
    lastProcessedTotalMinutes: typeof candidate.lastProcessedTotalMinutes === 'number'
      ? Math.min(getTotalMinutes(time), Math.max(0, candidate.lastProcessedTotalMinutes))
      : getTotalMinutes(time)
  };
}


function normalizeUniversityState(value: unknown, time: GameTime): UniversityState {
  const initial = createInitialUniversityState(getTotalMinutes(time));
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<UniversityState>;
  const enrollment = candidate.enrollment && typeof candidate.enrollment === 'object'
    ? {
        ...candidate.enrollment,
        semester: Math.max(1, Math.floor(candidate.enrollment.semester ?? 1)),
        tuitionPaidThroughSemester: Math.max(1, Math.floor(candidate.enrollment.tuitionPaidThroughSemester ?? 1)),
        studyLoad: Math.min(100, Math.max(0, Number(candidate.enrollment.studyLoad ?? 0))),
        subjectProgress: candidate.enrollment.subjectProgress && typeof candidate.enrollment.subjectProgress === 'object' ? candidate.enrollment.subjectProgress : {},
        assignments: Array.isArray(candidate.enrollment.assignments) ? candidate.enrollment.assignments.slice(0, 40) : [],
        attendedSessionKeys: Array.isArray(candidate.enrollment.attendedSessionKeys) ? candidate.enrollment.attendedSessionKeys.slice(-200) : [],
        missedSessionKeys: Array.isArray(candidate.enrollment.missedSessionKeys) ? candidate.enrollment.missedSessionKeys.slice(-200) : [],
        examsPassed: Math.max(0, Math.floor(candidate.enrollment.examsPassed ?? 0)),
        completed: Boolean(candidate.enrollment.completed)
      }
    : undefined;
  return {
    applications: Array.isArray(candidate.applications) ? candidate.applications.slice(-30) : [],
    enrollment,
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 40) : [],
    lastProcessedTotalMinutes: typeof candidate.lastProcessedTotalMinutes === 'number'
      ? Math.min(getTotalMinutes(time), Math.max(0, candidate.lastProcessedTotalMinutes))
      : getTotalMinutes(time)
  };
}

function normalizeFinanceState(value: unknown, bankBalance: number, time: GameTime): PersonalFinanceState {
  const initial = createInitialFinanceState(bankBalance, time.day);
  if (!value || typeof value !== 'object') return { ...initial, cash: 0, lastObservedBankBalance: bankBalance };
  const candidate = value as Partial<PersonalFinanceState>;
  return {
    cash: typeof candidate.cash === 'number' ? Math.max(0, Math.floor(candidate.cash)) : 0,
    savings: typeof candidate.savings === 'number' ? Math.max(0, Math.floor(candidate.savings)) : 0,
    pendingSalary: typeof candidate.pendingSalary === 'number' ? Math.max(0, Math.floor(candidate.pendingSalary)) : 0,
    nextSalaryPayoutDay: typeof candidate.nextSalaryPayoutDay === 'number'
      ? Math.max(time.day, Math.floor(candidate.nextSalaryPayoutDay))
      : Math.max(time.day + 6, 7),
    autoSavePercent: typeof candidate.autoSavePercent === 'number' ? Math.max(0, Math.min(30, Math.floor(candidate.autoSavePercent))) : 0,
    transactions: Array.isArray(candidate.transactions) ? candidate.transactions.slice(0, 120) : [],
    goals: Array.isArray(candidate.goals) ? candidate.goals.slice(0, 5) : [],
    lastObservedBankBalance: typeof candidate.lastObservedBankBalance === 'number'
      ? Math.max(0, Math.floor(candidate.lastObservedBankBalance))
      : bankBalance,
    lastProcessedDay: typeof candidate.lastProcessedDay === 'number' ? Math.max(1, Math.floor(candidate.lastProcessedDay)) : time.day
  };
}


function normalizeBirthDate(value: unknown, time: GameTime, fallbackAge: number): CalendarDate {
  if (value && typeof value === 'object') {
    const candidate = value as Partial<CalendarDate>;
    const year = typeof candidate.year === 'number' ? Math.floor(candidate.year) : undefined;
    const month = typeof candidate.month === 'number' ? Math.floor(candidate.month) : undefined;
    const dayOfMonth = typeof candidate.dayOfMonth === 'number' ? Math.floor(candidate.dayOfMonth) : undefined;
    if (year && month && dayOfMonth && month >= 1 && month <= 12 && dayOfMonth >= 1 && dayOfMonth <= 31) {
      return { year, month, dayOfMonth };
    }
  }

  const age = Math.max(0, Math.floor(Number.isFinite(fallbackAge) ? fallbackAge : 18));
  const month = 8;
  const dayOfMonth = 20;
  const birthdayPassed = time.calendar.month > month
    || (time.calendar.month === month && time.calendar.dayOfMonth >= dayOfMonth);
  return { year: time.calendar.year - age - (birthdayPassed ? 0 : 1), month, dayOfMonth };
}

function normalizeLoadedGameState(value: unknown): GameState | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const parsed = value as GameState;
  if (!parsed.player || !parsed.time || !Array.isArray(parsed.lifeLog)) return undefined;

  const time = normalizeGameTime(parsed.time);
  const birthDate = normalizeBirthDate(parsed.player.birthDate, time, parsed.player.age ?? 18);
  const inventory = Array.isArray(parsed.player.inventory) ? parsed.player.inventory : [];
  const sanitizedInventory = inventory.filter((item) => !REMOVED_PRODUCT_IDS.has(String(item.productId)));
  const activeCityId = parsed.player.cityId ?? cityId('moscow');
  const regionalCityIds = getRegionalCityIds({
    activeCityId,
    routes: intercityNetwork.routes,
    roadConnections: intercityNetwork.roadConnections
  });
  const detailedCityIds = [activeCityId, ...regionalCityIds];
  const population = normalizePopulation(parsed.world?.population, time, detailedCityIds);
  const atlas = normalizeWorldAtlasState(parsed.world?.atlas, {
    cities: cityRegistry.cities,
    districts: cityRegistry.districts,
    locations: cityRegistry.locations,
    population,
    activeCityId,
    regionalCityIds,
    time
  });
  const playerHousingId = parsed.player.housingId ?? housingId('housing_room_danilovsky');
  const daysUntilRent = parsed.player.daysUntilRent ?? 7;
  const university = normalizeUniversityState(parsed.world?.university, time);
  let normalizedPlayer: Player = {
    ...parsed.player,
    cityId: activeCityId,
    birthDate,
    age: calculateAge(birthDate, time.calendar),
    housingId: playerHousingId,
    inventory: sanitizedInventory,
    completedShifts: parsed.player.completedShifts ?? {},
    jobExperience: parsed.player.jobExperience ?? {},
    jobLevels: parsed.player.jobLevels ?? {},
    qualifications: normalizePlayerQualifications(parsed.player.qualifications),
    career: normalizePlayerCareerState(parsed.player.career, parsed.player.currentJobId, time.day),
    skills: normalizePlayerSkills(parsed.player.skills),
    daysUntilRent,
    rentalContract: normalizeRentalContract(parsed.player.rentalContract, playerHousingId, time, daysUntilRent),
    boxing: normalizeBoxingProfile(parsed.player.boxing)
  };
  if (university.enrollment?.completed) {
    const completedProgram = getDegreeProgramById(university.enrollment.programId);
    const completedUniversity = getUniversityById(completedProgram?.universityId);
    if (completedProgram && completedUniversity) {
      normalizedPlayer = issueDegreeQualification({
        player: normalizedPlayer,
        program: completedProgram,
        university: completedUniversity,
        time
      }).player;
    }
  }

  return {
    ...parsed,
    time,
    world: {
      population,
      social: normalizeSocialState(parsed.world?.social, time),
      housingMarket: normalizeHousingMarket(parsed.world?.housingMarket, time, population.seed, playerHousingId),
      business: normalizeBusinessWorld(parsed.world?.business, time, population.seed),
      phone: normalizePhoneState(parsed.world?.phone, time),
      finance: normalizeFinanceState(parsed.world?.finance, parsed.player.money ?? 0, time),
      vehicles: normalizeVehicleWorld(parsed.world?.vehicles, population.seed, time),
      medical: normalizeMedicalState(parsed.world?.medical, time),
      intercity: normalizeIntercityState(parsed.world?.intercity, time),
      university,
      atlas
    },
    player: normalizedPlayer
  };
}

export function loadGameState(): GameState | undefined {
  for (const candidate of getSaveStorageCandidates()) {
    let raw: string | null;
    try {
      raw = localStorage.getItem(candidate.key);
    } catch {
      return undefined;
    }
    if (!raw) continue;

    try {
      const decoded = decodeSavePayload(raw, candidate.assumedVersion);
      const normalized = normalizeLoadedGameState(decoded.state);
      if (normalized) return normalized;
    } catch {
      // A broken or unsupported candidate must not block fallback to the next save.
    }
  }

  return undefined;
}

export function saveGameState(state: GameState): void {
  try {
    const currentRaw = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (currentRaw && canDecodeSavePayload(currentRaw, CURRENT_SAVE_VERSION)) {
      localStorage.setItem(GAME_STATE_BACKUP_STORAGE_KEY, currentRaw);
    }
    localStorage.setItem(GAME_STATE_STORAGE_KEY, encodeSavePayload(state));
  } catch {
    // localStorage can fail in private mode or restricted browsers. Gameplay should continue in memory.
  }
}

export function clearSavedGameState(): void {
  try {
    getAllSaveStorageKeys().forEach((storageKey) => localStorage.removeItem(storageKey));
  } catch {
    // Ignore storage failures during reset.
  }
}
