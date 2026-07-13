import type { ActionResult } from '../types/actions';
import type { CityId, DistrictId, LocationId, NpcId, PlayerId, ProductId, SkillId } from '../types/ids';
import type { Player } from '../types/player';
import type { PlayerSkills } from '../types/skill';
import type { HousingId, HousingMarketState, RentalContract } from '../types/housing';
import type { BusinessWorldState, OwnedBusiness } from '../types/business';
import type { GameTime } from '../types/time';
import type { PhoneState } from '../types/phone';
import type { PersonalFinanceState } from '../types/finance';
import type { VehicleWorldState } from '../types/vehicle';
import type { MedicalState } from '../types/healthcare';
import type { IntercityTravelState } from '../types/intercity';
import { createInitialTime, formatGameTime, getTotalMinutes } from '../core/time';
import { createInitialBoxingProfile } from '../core/sport';
import type { BoxingProfile } from '../types/boxing';
import type { PopulationState } from '../types/population';
import { createPopulationSeed, generatePopulation, simulatePopulation } from '../core/population';
import { createInitialSocialState, createNpcPersonality } from '../core/relationships';
import type { SocialState } from '../types/socialEvent';
import { allLocations } from '../data/locations';
import { populationDataSource } from '../data/population/config';
import { basicHousing } from '../data/housing/basicHousing';
import { createHousingMarket } from '../core/housing';
import { createEmptyBusinessReport, createInitialBusinessWorldState } from '../core/business';
import { createInitialPhoneState } from '../core/phone';
import { createInitialFinanceState } from '../core/finance';
import { createInitialVehicleWorld } from '../core/vehicles';
import { createInitialMedicalState } from '../core/healthcare';
import { createInitialIntercityState } from '../core/intercity';
import { businessPremises } from '../data/business/premises';
import { usedVehicleListingTemplates } from '../data/vehicles/usedListingTemplates';

export const GAME_STATE_STORAGE_KEY = 'lifesim.gameState.v21';
const LEGACY_GAME_STATE_STORAGE_KEYS = ['lifesim.gameState.v20', 'lifesim.gameState.v19', 'lifesim.gameState.v18', 'lifesim.gameState.v17', 'lifesim.gameState.v16', 'lifesim.gameState.v15', 'lifesim.gameState.v14', 'lifesim.gameState.v13', 'lifesim.gameState.v12', 'lifesim.gameState.v11', 'lifesim.gameState.v10', 'lifesim.gameState.v9', 'lifesim.gameState.v8', 'lifesim.gameState.v7'];
const STARTER_INVENTORY_BACKFILL_KEYS = new Set(['lifesim.gameState.v9', 'lifesim.gameState.v8', 'lifesim.gameState.v7']);
const REMOVED_PRODUCT_IDS = new Set(['hygiene_kit', 'toothpaste', 'laundry_powder']);

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
  const generatedPopulation = generatePopulation({
    seed: createPopulationSeed(),
    locations: allLocations,
    time,
    dataSource: populationDataSource
  });
  const population = simulatePopulation({
    population: generatedPopulation,
    fromTime: time,
    toTime: time,
    locations: allLocations,
    getLocationProfile: populationDataSource.getLocationProfile
  });

  return {
    player: createInitialPlayer(),
    time,
    world: {
      population,
      social: createInitialSocialState(),
      housingMarket: createHousingMarket({
        seed: population.seed ^ 0x48a3f2,
        day: time.day,
        currentHousingId: housingId('housing_room_danilovsky'),
        catalogue: basicHousing
      }),
      business: createInitialBusinessWorldState(population.seed, businessPremises.map((premises) => premises.id)),
      phone: createInitialPhoneState(getTotalMinutes(time)),
      finance: createInitialFinanceState(11000, time.day),
      vehicles: createInitialVehicleWorld(population.seed, time.day, usedVehicleListingTemplates),
      medical: createInitialMedicalState(getTotalMinutes(time)),
      intercity: createInitialIntercityState(getTotalMinutes(time))
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

function createPopulationForTime(time: GameTime): PopulationState {
  const generated = generatePopulation({
    seed: createPopulationSeed(),
    locations: allLocations,
    time,
    dataSource: populationDataSource
  });
  return simulatePopulation({
    population: generated,
    fromTime: time,
    toTime: time,
    locations: allLocations,
    getLocationProfile: populationDataSource.getLocationProfile
  });
}

function normalizePopulation(value: unknown, time: GameTime): PopulationState {
  if (!value || typeof value !== 'object') return createPopulationForTime(time);
  const candidate = value as Partial<PopulationState>;
  if (!Array.isArray(candidate.npcs) || typeof candidate.seed !== 'number') return createPopulationForTime(time);

  const normalizedNpcs = candidate.npcs.map((npc) => ({
    ...npc,
    personality: npc.personality ?? createNpcPersonality(String(npc.id), npc.activityProfile)
  }));
  const hasYaroslavlResidents = normalizedNpcs.some((npc) => (
    String(npc.homeDistrictId).startsWith('yar_')
    || String(npc.employment?.locationId ?? '').startsWith('yar_')
  ));

  if (!hasYaroslavlResidents) {
    const generated = generatePopulation({
      seed: candidate.seed,
      locations: allLocations,
      time,
      dataSource: populationDataSource
    });
    const yaroslavlNpcs = generated.npcs
      .filter((npc) => (
        String(npc.homeDistrictId).startsWith('yar_')
        || String(npc.employment?.locationId ?? '').startsWith('yar_')
      ))
      .map((npc, index) => ({
        ...npc,
        id: (`npc_yar_${String(index + 1).padStart(4, '0')}`) as NpcId,
        personality: createNpcPersonality(`npc_yar_${String(index + 1).padStart(4, '0')}`, npc.activityProfile)
      }));
    normalizedNpcs.push(...yaroslavlNpcs);
  }

  return {
    seed: candidate.seed,
    generatedAtDay: typeof candidate.generatedAtDay === 'number' ? candidate.generatedAtDay : time.day,
    lastSimulatedTotalMinutes: typeof candidate.lastSimulatedTotalMinutes === 'number'
      ? candidate.lastSimulatedTotalMinutes
      : 0,
    npcs: normalizedNpcs
  };
}


function normalizeSocialState(value: unknown): SocialState {
  const initial = createInitialSocialState();
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<SocialState>;
  return {
    relationships: candidate.relationships && typeof candidate.relationships === 'object' ? candidate.relationships : {},
    scheduledEvents: Array.isArray(candidate.scheduledEvents) ? candidate.scheduledEvents : [],
    activeEvent: candidate.activeEvent && typeof candidate.activeEvent === 'object' ? candidate.activeEvent : undefined,
    eventCooldowns: candidate.eventCooldowns && typeof candidate.eventCooldowns === 'object' ? candidate.eventCooldowns : {},
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 40) : []
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
      catalogue: basicHousing
    });
  }
  const candidate = value as Partial<HousingMarketState>;
  if (typeof candidate.seed !== 'number' || !Array.isArray(candidate.activeHousingIds)) {
    return createHousingMarket({
      seed: populationSeed ^ 0x48a3f2,
      day: time.day,
      currentHousingId,
      catalogue: basicHousing
    });
  }
  const knownIds = new Set(basicHousing.map((housing) => housing.id));
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
  const initial = createInitialBusinessWorldState(populationSeed, businessPremises.map((premises) => premises.id));
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<BusinessWorldState>;
  const knownPremisesIds = new Set(businessPremises.map((premises) => premises.id));
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
      : businessPremises.map((premises) => premises.id).filter((id) => id !== normalizedOwned?.premisesId),
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

export function loadGameState(): GameState | undefined {
  try {
    const storageKeys = [GAME_STATE_STORAGE_KEY, ...LEGACY_GAME_STATE_STORAGE_KEYS];

    for (const storageKey of storageKeys) {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as GameState;
      if (!parsed.player || !parsed.time || !Array.isArray(parsed.lifeLog)) continue;

      const inventory = Array.isArray(parsed.player.inventory) ? parsed.player.inventory : [];
      const sanitizedInventory = inventory.filter((item) => !REMOVED_PRODUCT_IDS.has(String(item.productId)));
      const shouldBackfillStarterInventory = STARTER_INVENTORY_BACKFILL_KEYS.has(storageKey) && sanitizedInventory.length === 0;

      const population = normalizePopulation(parsed.world?.population, parsed.time);
      const playerHousingId = parsed.player.housingId ?? housingId('housing_room_danilovsky');
      const daysUntilRent = parsed.player.daysUntilRent ?? 7;
      return {
        ...parsed,
        world: {
          population,
          social: normalizeSocialState(parsed.world?.social),
          housingMarket: normalizeHousingMarket(parsed.world?.housingMarket, parsed.time, population.seed, playerHousingId),
          business: normalizeBusinessWorld(parsed.world?.business, parsed.time, population.seed),
          phone: normalizePhoneState(parsed.world?.phone, parsed.time),
          finance: normalizeFinanceState(parsed.world?.finance, parsed.player.money ?? 0, parsed.time),
          vehicles: normalizeVehicleWorld(parsed.world?.vehicles, population.seed, parsed.time),
          medical: normalizeMedicalState(parsed.world?.medical, parsed.time),
          intercity: normalizeIntercityState(parsed.world?.intercity, parsed.time)
        },
        player: {
          ...parsed.player,
          housingId: playerHousingId,
          inventory: shouldBackfillStarterInventory ? createStarterInventory() : sanitizedInventory,
          completedShifts: parsed.player.completedShifts ?? {},
          jobExperience: parsed.player.jobExperience ?? {},
          jobLevels: parsed.player.jobLevels ?? {},
          skills: normalizePlayerSkills(parsed.player.skills),
          daysUntilRent,
          rentalContract: normalizeRentalContract(parsed.player.rentalContract, playerHousingId, parsed.time, daysUntilRent),
          boxing: normalizeBoxingProfile(parsed.player.boxing)
        }
      };
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage can fail in private mode or restricted browsers. Gameplay should continue in memory.
  }
}

export function clearSavedGameState(): void {
  try {
    localStorage.removeItem(GAME_STATE_STORAGE_KEY);
    LEGACY_GAME_STATE_STORAGE_KEYS.forEach((storageKey) => localStorage.removeItem(storageKey));
  } catch {
    // Ignore storage failures during reset.
  }
}
