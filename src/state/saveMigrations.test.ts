import { describe, expect, it } from 'vitest';
import {
  CURRENT_SAVE_VERSION,
  GAME_STATE_BACKUP_STORAGE_KEY,
  GAME_STATE_STORAGE_KEY,
  LEGACY_GAME_STATE_STORAGE_KEYS,
  SAVE_ENVELOPE_FORMAT,
  decodeSavePayload,
  encodeSavePayload,
  getRegisteredMigrationVersions,
  migrateSaveState
} from './saveMigrations';

describe('save migrations', () => {
  it('registers one migration for every supported version step', () => {
    expect(getRegisteredMigrationVersions()).toEqual(
      Array.from({ length: CURRENT_SAVE_VERSION - 7 }, (_, index) => index + 7)
    );
  });

  it('backfills the historical starter inventory only for saves crossing v9 -> v10', () => {
    const oldState = { player: { inventory: [] } };
    const migrated = migrateSaveState(oldState, 9).state as typeof oldState;
    const alreadyModern = migrateSaveState(oldState, 10).state as typeof oldState;

    expect(migrated.player.inventory).toEqual([
      { productId: 'water_15l', quantity: 2 },
      { productId: 'ready_meal', quantity: 2 },
      { productId: 'snack_bar', quantity: 1 },
      { productId: 'energy_drink', quantity: 1 }
    ]);
    expect(alreadyModern.player.inventory).toEqual([]);

    const removedOnly = migrateSaveState({
      player: { inventory: [{ productId: 'hygiene_kit', quantity: 1 }] }
    }, 9).state as { player: { inventory: unknown[] } };
    expect(removedOnly.player.inventory).toEqual([
      { productId: 'water_15l', quantity: 2 },
      { productId: 'ready_meal', quantity: 2 },
      { productId: 'snack_bar', quantity: 1 },
      { productId: 'energy_drink', quantity: 1 }
    ]);
  });

  it('adds a normalized atlas placeholder when migrating v24 to v25', () => {
    const migrated = migrateSaveState({
      player: { cityId: 'yaroslavl' },
      time: { day: 8, hour: 13, minute: 15 },
      world: { population: { seed: 42 } }
    }, 24).state as {
      world: { atlas: { activeCityId: string; seed: number; cityStates: Record<string, unknown>; lastProcessedTotalMinutes: number } };
    };

    expect(migrated.world.atlas.activeCityId).toBe('yaroslavl');
    expect(migrated.world.atlas.seed).toBe(42);
    expect(migrated.world.atlas.cityStates).toEqual({});
    expect(migrated.world.atlas.lastProcessedTotalMinutes).toBe((8 - 1) * 24 * 60 + 13 * 60 + 15);
  });


  it('adds calendar and birth date when migrating v25 to v26', () => {
    const migrated = migrateSaveState({
      player: { age: 18 },
      time: { day: 347, hour: 9, minute: 30 },
      world: {}
    }, 25).state as {
      player: { birthDate: { year: number; month: number; dayOfMonth: number } };
      time: { calendar: { year: number; month: number; dayOfMonth: number; season: string } };
    };

    expect(migrated.time.calendar).toEqual({ year: 2027, month: 8, dayOfMonth: 19, season: 'summer' });
    expect(migrated.player.birthDate).toEqual({ year: 2008, month: 8, dayOfMonth: 20 });
  });


  it('adds qualifications and career history when migrating v26 to v27', () => {
    const migrated = migrateSaveState({
      player: { currentJobId: 'job_barista_trainee' },
      time: { day: 12 },
      world: {}
    }, 26).state as {
      player: { qualifications: unknown[]; career: { activeEmployment?: { jobId: string; status: string }; employmentHistory: unknown[] } };
    };

    expect(migrated.player.qualifications).toEqual([]);
    expect(migrated.player.career.activeEmployment).toMatchObject({ jobId: 'job_barista_trainee', status: 'active' });
    expect(migrated.player.career.employmentHistory).toHaveLength(1);
  });


  it('adds life goal state when migrating v27 to v28', () => {
    const migrated = migrateSaveState({ player: {}, time: { day: 1 }, world: {} }, 27).state as {
      lifeGoals: { completedMilestoneIds: unknown[]; completedGoalIds: unknown[] };
    };

    expect(migrated.lifeGoals).toEqual({ completedMilestoneIds: [], completedGoalIds: [] });
  });


  it('adds autonomous world dynamics when migrating v28 to v29', () => {
    const migrated = migrateSaveState({
      player: { cityId: 'moscow' },
      time: { day: 9 },
      world: { atlas: { seed: 77 } },
      lifeGoals: { completedMilestoneIds: [], completedGoalIds: [] }
    }, 28).state as {
      world: { dynamics: { version: number; seed: number; lastProcessedDay: number; activeConditions: unknown[]; history: unknown[] } };
    };

    expect(migrated.world.dynamics).toEqual({
      version: 1,
      seed: 77,
      lastProcessedDay: 9,
      activeConditions: [],
      history: []
    });
  });

  it('adds life progression and persistent consequences state when migrating v29 to v30', () => {
    const migrated = migrateSaveState({
      player: {},
      time: { day: 11 },
      world: {}
    }, 29).state as {
      progression: { version: number; tracks: Record<string, { xp: number; level: number; reputation: number; lastUpdatedDay: number }>; consequences: unknown[]; handledSignalIds: unknown[] };
    };

    expect(migrated.progression.version).toBe(1);
    expect(migrated.progression.tracks.career).toEqual({ xp: 0, level: 0, reputation: 50, lastUpdatedDay: 11 });
    expect(migrated.progression.tracks.business.reputation).toBe(0);
    expect(migrated.progression.consequences).toEqual([]);
    expect(migrated.progression.handledSignalIds).toEqual([]);
  });

  it('adds autonomous opportunity lifecycle state when migrating v30 to v31', () => {
    const migrated = migrateSaveState({
      player: {},
      time: { day: 14 },
      world: { atlas: { seed: 93 } },
      progression: { version: 1 }
    }, 30).state as {
      world: { opportunities: { version: number; seed: number; lastProcessedDay: number; jobListings: Record<string, unknown>; history: unknown[] } };
    };

    expect(migrated.world.opportunities.version).toBe(1);
    expect(migrated.world.opportunities.seed).toBe(93 ^ 0x5f3759df);
    expect(migrated.world.opportunities.lastProcessedDay).toBe(14);
    expect(migrated.world.opportunities.jobListings).toEqual({});
    expect(migrated.world.opportunities.history).toEqual([]);
  });

  it('adds autonomous daily life state to NPCs when migrating v31 to v32', () => {
    const migrated = migrateSaveState({
      time: { day: 18 },
      world: {
        population: {
          seed: 1,
          npcs: [{
            id: 'npc_student',
            activityProfile: 'student',
            personality: { reliability: 73 }
          }]
        }
      }
    }, 31).state as {
      world: { population: { npcs: Array<{ life: { reliability: number; studyProgress: number; lastProcessedDay: number } }> } };
    };

    expect(migrated.world.population.npcs[0].life).toMatchObject({
      reliability: 73,
      studyProgress: 5,
      lastProcessedDay: 18
    });
  });

  it('adds autonomous organization state when migrating v32 to v33', () => {
    const migrated = migrateSaveState({ time: { day: 21 }, world: { atlas: { seed: 101 } } }, 32).state as { world: { organizations: { version: number; seed: number; lastProcessedDay: number; organizations: Record<string, unknown>; history: unknown[] } } };
    expect(migrated.world.organizations).toEqual({ version: 1, seed: 101 ^ 0x61c88647, lastProcessedDay: 21, organizations: {}, history: [] });
  });

  it('adds household economy state when migrating v33 to v34', () => {
    const migrated = migrateSaveState({
      player: { housingId: 'housing_room_danilovsky' },
      time: { day: 24 },
      world: {}
    }, 33).state as {
      world: { household: { version: number; housingId: string; cleanliness: number; pantry: unknown[]; bills: Array<{ kind: string; dueDay: number }> } };
    };

    expect(migrated.world.household.version).toBe(1);
    expect(migrated.world.household.housingId).toBe('housing_room_danilovsky');
    expect(migrated.world.household.cleanliness).toBe(72);
    expect(migrated.world.household.pantry).toHaveLength(1);
    expect(migrated.world.household.bills.map((bill) => bill.kind)).toEqual(['electricity', 'water', 'internet']);
    expect(migrated.world.household.bills[0].dueDay).toBe(31);
  });

  it('decodes both legacy raw states and the current versioned envelope', () => {
    const legacy = decodeSavePayload(JSON.stringify({ player: { inventory: [] } }), 23);
    const encoded = encodeSavePayload({ marker: 'current' });
    const current = decodeSavePayload(encoded, CURRENT_SAVE_VERSION);

    expect(legacy.sourceVersion).toBe(23);
    expect(legacy.version).toBe(CURRENT_SAVE_VERSION);
    expect(current.state).toEqual({ marker: 'current' });
    expect(JSON.parse(encoded)).toEqual({
      format: SAVE_ENVELOPE_FORMAT,
      version: CURRENT_SAVE_VERSION,
      state: { marker: 'current' }
    });
  });

  it('uses a new current key, a dedicated backup key and descending legacy keys', () => {
    expect(GAME_STATE_STORAGE_KEY).toBe(`lifesim.gameState.v${CURRENT_SAVE_VERSION}`);
    expect(GAME_STATE_BACKUP_STORAGE_KEY).toBe(`${GAME_STATE_STORAGE_KEY}.backup`);
    expect(LEGACY_GAME_STATE_STORAGE_KEYS[0]).toBe(`lifesim.gameState.v${CURRENT_SAVE_VERSION - 1}`);
    expect(LEGACY_GAME_STATE_STORAGE_KEYS[LEGACY_GAME_STATE_STORAGE_KEYS.length - 1]).toBe('lifesim.gameState.v7');
  });
});
