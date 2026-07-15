import { describe, expect, it } from 'vitest';
import {
  CURRENT_SAVE_VERSION,
  GAME_STATE_BACKUP_STORAGE_KEY,
  GAME_STATE_STORAGE_KEY,
  LEGACY_GAME_STATE_STORAGE_KEYS,
  decodeSavePayload,
  encodeSavePayload,
  getAllSaveStorageKeys
} from './saveMigrations';
import { clearSavedGameState, createInitialGameState, loadGameState, saveGameState } from './gameState';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }
}

function withMemoryStorage(run: () => void): void {
  const originalLocalStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage()
  });

  try {
    run();
  } finally {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage
    });
  }
}

describe('game state storage', () => {
  it('falls back to a valid backup when the current save is corrupted', () => {
    withMemoryStorage(() => {
      const state = createInitialGameState();
      state.player.name = 'Backup player';
      localStorage.setItem(GAME_STATE_STORAGE_KEY, '{broken json');
      localStorage.setItem(GAME_STATE_BACKUP_STORAGE_KEY, encodeSavePayload(state));

      expect(loadGameState()?.player.name).toBe('Backup player');
    });
  });

  it('continues from a corrupted current save to a valid legacy save', () => {
    withMemoryStorage(() => {
      const state = createInitialGameState();
      state.player.name = 'Legacy player';
      localStorage.setItem(GAME_STATE_STORAGE_KEY, '{broken json');
      localStorage.setItem(LEGACY_GAME_STATE_STORAGE_KEYS[0], JSON.stringify(state));

      expect(loadGameState()?.player.name).toBe('Legacy player');
    });
  });

  it('rotates the previous valid current save into the backup slot', () => {
    withMemoryStorage(() => {
      const first = createInitialGameState();
      first.player.name = 'First save';
      const second = { ...first, player: { ...first.player, name: 'Second save' } };

      saveGameState(first);
      saveGameState(second);

      const currentRaw = localStorage.getItem(GAME_STATE_STORAGE_KEY);
      const backupRaw = localStorage.getItem(GAME_STATE_BACKUP_STORAGE_KEY);
      expect(currentRaw).not.toBeNull();
      expect(backupRaw).not.toBeNull();
      expect((decodeSavePayload(currentRaw!, CURRENT_SAVE_VERSION).state as typeof second).player.name).toBe('Second save');
      expect((decodeSavePayload(backupRaw!, CURRENT_SAVE_VERSION).state as typeof first).player.name).toBe('First save');
    });
  });

  it('clears current, backup and every supported legacy key', () => {
    withMemoryStorage(() => {
      getAllSaveStorageKeys().forEach((key) => localStorage.setItem(key, '{}'));

      clearSavedGameState();

      expect(getAllSaveStorageKeys().every((key) => localStorage.getItem(key) === null)).toBe(true);
    });
  });
});
