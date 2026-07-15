export const MIN_SUPPORTED_SAVE_VERSION = 7;
export const CURRENT_SAVE_VERSION = 24;
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
  [23, identityMigration]
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
