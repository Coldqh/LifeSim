import { getCalendarDateForDay } from '../core/time';
export const MIN_SUPPORTED_SAVE_VERSION = 7;
export const CURRENT_SAVE_VERSION = 36;
export const SAVE_ENVELOPE_FORMAT = 'lifesim-save';

export const getGameStateStorageKey = (version: number): string => `lifesim.gameState.v${version}`;

export const GAME_STATE_STORAGE_KEY = getGameStateStorageKey(CURRENT_SAVE_VERSION);
export const GAME_STATE_BACKUP_STORAGE_KEY = `${GAME_STATE_STORAGE_KEY}.backup`;
export const LEGACY_GAME_STATE_STORAGE_KEYS = Array.from(
  { length: CURRENT_SAVE_VERSION - MIN_SUPPORTED_SAVE_VERSION },
  (_, index) => getGameStateStorageKey(CURRENT_SAVE_VERSION - index - 1)
);

export type SaveStorageCandidate = {
  key: string;
  assumedVersion: number;
  kind: 'current' | 'backup' | 'legacy';
};

export type SaveEnvelope = {
  format: typeof SAVE_ENVELOPE_FORMAT;
  version: number;
  state: unknown;
};

export type DecodedSavePayload = {
  sourceVersion: number;
  version: typeof CURRENT_SAVE_VERSION;
  state: unknown;
};

type SaveMigration = (state: unknown) => unknown;

type UnknownRecord = Record<string, unknown>;

const LEGACY_REMOVED_PRODUCT_IDS = new Set(['hygiene_kit', 'toothpaste', 'laundry_powder']);

const LEGACY_STARTER_INVENTORY = [
  { productId: 'water_15l', quantity: 2 },
  { productId: 'ready_meal', quantity: 2 },
  { productId: 'snack_bar', quantity: 1 },
  { productId: 'energy_drink', quantity: 1 }
];

function asRecord(value: unknown): UnknownRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : undefined;
}

function identityMigration(state: unknown): unknown {
  return state;
}

function migrateV9ToV10(state: unknown): unknown {
  const root = asRecord(state);
  const player = asRecord(root?.player);
  if (!root || !player) return state;

  const inventory = Array.isArray(player.inventory)
    ? player.inventory.filter((item) => {
        const candidate = asRecord(item);
        return !LEGACY_REMOVED_PRODUCT_IDS.has(String(candidate?.productId ?? ''));
      })
    : [];
  if (inventory.length > 0) return state;

  return {
    ...root,
    player: {
      ...player,
      inventory: LEGACY_STARTER_INVENTORY.map((item) => ({ ...item }))
    }
  };
}


function migrateV24ToV25(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  if (!root || !world || asRecord(world.atlas)) return state;

  const player = asRecord(root.player);
  const time = asRecord(root.time);
  const population = asRecord(world.population);
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const hour = typeof time?.hour === 'number' ? Math.max(0, Math.floor(time.hour)) : 0;
  const minute = typeof time?.minute === 'number' ? Math.max(0, Math.floor(time.minute)) : 0;
  const totalMinutes = (day - 1) * 24 * 60 + hour * 60 + minute;
  const activeCityId = typeof player?.cityId === 'string' ? player.cityId : 'moscow';
  const seed = typeof population?.seed === 'number' ? Math.max(1, Math.floor(population.seed)) : 1;

  return {
    ...root,
    world: {
      ...world,
      atlas: {
        version: 1,
        seed,
        activeCityId,
        regionalCityIds: [],
        cityStates: {},
        lastRebalancedDay: day,
        lastProcessedTotalMinutes: totalMinutes
      }
    }
  };
}


function migrateV25ToV26(state: unknown): unknown {
  const root = asRecord(state);
  const time = asRecord(root?.time);
  const player = asRecord(root?.player);
  if (!root || !time || !player) return state;

  const day = typeof time.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const calendar = getCalendarDateForDay(day);
  const age = typeof player.age === 'number' ? Math.max(0, Math.floor(player.age)) : 18;
  const birthMonth = 8;
  const birthDayOfMonth = 20;
  const birthdayPassed = calendar.month > birthMonth
    || (calendar.month === birthMonth && calendar.dayOfMonth >= birthDayOfMonth);
  const existingBirthDate = asRecord(player.birthDate);

  return {
    ...root,
    time: {
      ...time,
      weekday: time.weekday,
      calendar
    },
    player: {
      ...player,
      birthDate: existingBirthDate ?? {
        year: calendar.year - age - (birthdayPassed ? 0 : 1),
        month: birthMonth,
        dayOfMonth: birthDayOfMonth
      }
    }
  };
}



function migrateV26ToV27(state: unknown): unknown {
  const root = asRecord(state);
  const player = asRecord(root?.player);
  const time = asRecord(root?.time);
  if (!root || !player) return state;

  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const currentJobId = typeof player.currentJobId === 'string' ? player.currentJobId : undefined;
  const existingCareer = asRecord(player.career);
  const qualifications = Array.isArray(player.qualifications) ? player.qualifications : [];

  const career = existingCareer ?? {
    activeEmployment: currentJobId ? {
      id: `employment_legacy_${currentJobId}_${day}`,
      jobId: currentJobId,
      employmentType: 'casual',
      status: 'active',
      startedDay: day
    } : undefined,
    employmentHistory: currentJobId ? [{
      id: `employment_legacy_${currentJobId}_${day}`,
      jobId: currentJobId,
      employmentType: 'casual',
      status: 'active',
      startedDay: day
    }] : []
  };

  return {
    ...root,
    player: {
      ...player,
      qualifications,
      career
    }
  };
}


function migrateV27ToV28(state: unknown): unknown {
  const root = asRecord(state);
  if (!root || asRecord(root.lifeGoals)) return state;
  return {
    ...root,
    lifeGoals: {
      completedMilestoneIds: [],
      completedGoalIds: []
    }
  };
}


function migrateV28ToV29(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  const time = asRecord(root?.time);
  const atlas = asRecord(world?.atlas);
  if (!root || !world || asRecord(world.dynamics)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const seed = typeof atlas?.seed === 'number' ? Math.max(1, Math.floor(atlas.seed)) : 1;
  return {
    ...root,
    world: {
      ...world,
      dynamics: {
        version: 1,
        seed,
        lastProcessedDay: day,
        activeConditions: [],
        history: []
      }
    }
  };
}

function migrateV29ToV30(state: unknown): unknown {
  const root = asRecord(state);
  const time = asRecord(root?.time);
  if (!root || asRecord(root.progression)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const track = (reputation: number) => ({ xp: 0, level: 0, reputation, lastUpdatedDay: day });
  return {
    ...root,
    progression: {
      version: 1,
      tracks: {
        career: track(50),
        education: track(50),
        independence: track(50),
        social: track(50),
        business: track(0)
      },
      consequences: [],
      handledSignalIds: []
    }
  };
}


function migrateV30ToV31(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  const time = asRecord(root?.time);
  const atlas = asRecord(world?.atlas);
  if (!root || !world || asRecord(world.opportunities)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const seed = typeof atlas?.seed === 'number' ? Math.max(1, Math.floor(atlas.seed)) : 1;
  return {
    ...root,
    world: {
      ...world,
      opportunities: {
        version: 1,
        seed: seed ^ 0x5f3759df,
        lastProcessedDay: day,
        jobListings: {},
        history: []
      }
    }
  };
}


function migrateV31ToV32(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  const population = asRecord(world?.population);
  const time = asRecord(root?.time);
  if (!root || !world || !population || !Array.isArray(population.npcs)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const startingMoney: Record<string, number> = {
    worker: 24_000,
    student: 9_000,
    unemployed: 4_500,
    remote_worker: 18_000,
    retired: 16_000
  };
  const npcs = population.npcs.map((rawNpc) => {
    const npc = asRecord(rawNpc);
    if (!npc || asRecord(npc.life)) return rawNpc;
    const profile = typeof npc.activityProfile === 'string' ? npc.activityProfile : 'unemployed';
    const personality = asRecord(npc.personality);
    const reliability = typeof personality?.reliability === 'number' ? Math.max(0, Math.min(100, Math.round(personality.reliability))) : 50;
    return {
      ...npc,
      life: {
        energy: 80,
        health: 90,
        money: startingMoney[profile] ?? 8_000,
        reliability,
        studyProgress: profile === 'student' ? 5 : 0,
        missedCommitments: 0,
        warningCount: 0,
        jobSearchDays: profile === 'unemployed' ? 1 : 0,
        lastProcessedDay: day
      }
    };
  });
  return {
    ...root,
    world: {
      ...world,
      population: { ...population, npcs }
    }
  };
}


function migrateV32ToV33(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  const time = asRecord(root?.time);
  const atlas = asRecord(world?.atlas);
  if (!root || !world || asRecord(world.organizations)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const seed = typeof atlas?.seed === 'number' ? Math.max(1, Math.floor(atlas.seed)) : 1;
  return { ...root, world: { ...world, organizations: { version: 1, seed: seed ^ 0x61c88647, lastProcessedDay: day, organizations: {}, history: [] } } };
}


function migrateV33ToV34(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  const player = asRecord(root?.player);
  const time = asRecord(root?.time);
  if (!root || !world || asRecord(world.household)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const housingId = typeof player?.housingId === 'string' ? player.housingId : 'housing_room_danilovsky';
  const seed = [...housingId].reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return {
    ...root,
    world: {
      ...world,
      household: {
        version: 1,
        seed: seed ^ day,
        housingId,
        cleanliness: 72,
        condition: 65,
        cleaningSupplies: 1,
        pantry: [{ id: `pantry_starter_${day}`, productId: 'groceries_basic', units: 2, storedDay: day, expiresDay: day + 5 }],
        bills: ['electricity', 'water', 'internet'].map((kind) => ({ kind, accrued: 0, debt: 0, dueDay: day + 7, overdueDays: 0 })),
        lastProcessedDay: day
      }
    }
  };
}



function migrateV34ToV35(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  const player = asRecord(root?.player);
  const time = asRecord(root?.time);
  const lifeGoals = asRecord(root?.lifeGoals);
  if (!root || !world || asRecord(world.lifePhases)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const social = asRecord(world.social);
  const businessWorld = asRecord(world.business);
  const ownedBusiness = asRecord(businessWorld?.ownedBusiness);
  const university = asRecord(world.university);
  const enrollment = asRecord(university?.enrollment);
  const subjectProgress = asRecord(enrollment?.subjectProgress);
  const knowledgeValues = Object.values(subjectProgress ?? {}).map(asRecord).map((entry) => typeof entry?.knowledge === 'number' ? entry.knowledge : 0);
  const assignments = Array.isArray(enrollment?.assignments) ? enrollment.assignments.map(asRecord).filter(Boolean) : [];
  const snapshot = {
    day,
    money: typeof player?.money === 'number' ? player.money : 0,
    currentJobId: typeof player?.currentJobId === 'string' ? player.currentJobId : undefined,
    housingId: typeof player?.housingId === 'string' ? player.housingId : 'housing_room_danilovsky',
    rentDebt: typeof player?.rentDebt === 'number' ? player.rentDebt : 0,
    activeMedicalConditions: Array.isArray(asRecord(world.medical)?.conditions) ? (asRecord(world.medical)?.conditions as unknown[]).length : 0,
    completedGoalMilestones: Array.isArray(lifeGoals?.completedMilestoneIds) ? lifeGoals.completedMilestoneIds.length : 0,
    knownContacts: Object.keys(asRecord(social?.contacts) ?? {}).length,
    businessBalance: typeof ownedBusiness?.balance === 'number' ? ownedBusiness.balance : undefined,
    businessDebt: typeof ownedBusiness?.debt === 'number' ? ownedBusiness.debt : undefined,
    universityKnowledge: knowledgeValues.length ? Math.round(knowledgeValues.reduce((sum, value) => sum + value, 0) / knowledgeValues.length) : 0,
    universityDebtCount: assignments.filter((entry) => !entry?.completed && (entry?.missed || (typeof entry?.dueDay === 'number' && entry.dueDay < day))).length
  };
  return {
    ...root,
    world: {
      ...world,
      lifePhases: {
        version: 1,
        lastProcessedDay: day,
        rentMultiplier: 1,
        rentContractKey: undefined,
        activeEvents: [],
        history: [],
        weeklySummaries: [],
        monthlySummaries: [],
        handledTriggerKeys: [],
        lastWeeklySnapshot: snapshot,
        lastMonthlySnapshot: snapshot
      }
    }
  };
}


function migrateV35ToV36(state: unknown): unknown {
  const root = asRecord(state);
  const world = asRecord(root?.world);
  const time = asRecord(root?.time);
  const atlas = asRecord(world?.atlas);
  if (!root || !world || asRecord(world.districtEcosystem)) return state;
  const day = typeof time?.day === 'number' ? Math.max(1, Math.floor(time.day)) : 1;
  const seed = typeof atlas?.seed === 'number' ? Math.max(1, Math.floor(atlas.seed)) : 1;
  return {
    ...root,
    world: {
      ...world,
      districtEcosystem: {
        version: 1,
        seed: seed ^ 0x27d4eb2d,
        lastProcessedDay: day,
        districts: {},
        history: []
      }
    }
  };
}

const SAVE_MIGRATIONS = new Map<number, SaveMigration>([
  [7, identityMigration],
  [8, identityMigration],
  [9, migrateV9ToV10],
  [10, identityMigration],
  [11, identityMigration],
  [12, identityMigration],
  [13, identityMigration],
  [14, identityMigration],
  [15, identityMigration],
  [16, identityMigration],
  [17, identityMigration],
  [18, identityMigration],
  [19, identityMigration],
  [20, identityMigration],
  [21, identityMigration],
  [22, identityMigration],
  [23, identityMigration],
  [24, migrateV24ToV25],
  [25, migrateV25ToV26],
  [26, migrateV26ToV27],
  [27, migrateV27ToV28],
  [28, migrateV28ToV29],
  [29, migrateV29ToV30],
  [30, migrateV30ToV31],
  [31, migrateV31ToV32],
  [32, migrateV32ToV33],
  [33, migrateV33ToV34],
  [34, migrateV34ToV35],
  [35, migrateV35ToV36]
]);

function assertSupportedVersion(version: number): void {
  if (!Number.isInteger(version)) {
    throw new Error('Save version must be an integer.');
  }
  if (version < MIN_SUPPORTED_SAVE_VERSION) {
    throw new Error(`Save version ${version} is older than supported version ${MIN_SUPPORTED_SAVE_VERSION}.`);
  }
  if (version > CURRENT_SAVE_VERSION) {
    throw new Error(`Save version ${version} is newer than supported version ${CURRENT_SAVE_VERSION}.`);
  }
}

function isSaveEnvelope(value: unknown): value is SaveEnvelope {
  const candidate = asRecord(value);
  return Boolean(
    candidate
    && candidate.format === SAVE_ENVELOPE_FORMAT
    && typeof candidate.version === 'number'
    && Object.prototype.hasOwnProperty.call(candidate, 'state')
  );
}

export function migrateSaveState(state: unknown, sourceVersion: number): DecodedSavePayload {
  assertSupportedVersion(sourceVersion);

  let migratedState = state;
  for (let version = sourceVersion; version < CURRENT_SAVE_VERSION; version += 1) {
    const migration = SAVE_MIGRATIONS.get(version);
    if (!migration) {
      throw new Error(`Missing save migration v${version} -> v${version + 1}.`);
    }
    migratedState = migration(migratedState);
  }

  return {
    sourceVersion,
    version: CURRENT_SAVE_VERSION,
    state: migratedState
  };
}

export function decodeSavePayload(raw: string, assumedVersion: number): DecodedSavePayload {
  const parsed = JSON.parse(raw) as unknown;
  const sourceVersion = isSaveEnvelope(parsed) ? parsed.version : assumedVersion;
  const state = isSaveEnvelope(parsed) ? parsed.state : parsed;
  return migrateSaveState(state, sourceVersion);
}

export function encodeSavePayload(state: unknown): string {
  const envelope: SaveEnvelope = {
    format: SAVE_ENVELOPE_FORMAT,
    version: CURRENT_SAVE_VERSION,
    state
  };
  return JSON.stringify(envelope);
}

export function canDecodeSavePayload(raw: string, assumedVersion: number): boolean {
  try {
    decodeSavePayload(raw, assumedVersion);
    return true;
  } catch {
    return false;
  }
}

export function getSaveStorageCandidates(): SaveStorageCandidate[] {
  return [
    { key: GAME_STATE_STORAGE_KEY, assumedVersion: CURRENT_SAVE_VERSION, kind: 'current' },
    { key: GAME_STATE_BACKUP_STORAGE_KEY, assumedVersion: CURRENT_SAVE_VERSION, kind: 'backup' },
    ...LEGACY_GAME_STATE_STORAGE_KEYS.map((key, index) => ({
      key,
      assumedVersion: CURRENT_SAVE_VERSION - index - 1,
      kind: 'legacy' as const
    }))
  ];
}

export function getAllSaveStorageKeys(): string[] {
  return getSaveStorageCandidates().map((candidate) => candidate.key);
}

export function getRegisteredMigrationVersions(): number[] {
  return [...SAVE_MIGRATIONS.keys()].sort((first, second) => first - second);
}
