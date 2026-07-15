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
    expect(LEGACY_GAME_STATE_STORAGE_KEYS[0]).toBe('lifesim.gameState.v23');
    expect(LEGACY_GAME_STATE_STORAGE_KEYS[LEGACY_GAME_STATE_STORAGE_KEYS.length - 1]).toBe('lifesim.gameState.v7');
  });
});
