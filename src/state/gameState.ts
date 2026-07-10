import type { ActionResult } from '../types/actions';
import type { CityId, DistrictId, LocationId, PlayerId, SkillId } from '../types/ids';
import type { Player } from '../types/player';
import type { PlayerSkills } from '../types/skill';
import type { HousingId } from '../types/housing';
import type { GameTime } from '../types/time';
import { createInitialTime, formatGameTime } from '../core/time';

export const GAME_STATE_STORAGE_KEY = 'lifesim.gameState.v9';
const LEGACY_GAME_STATE_STORAGE_KEYS = ['lifesim.gameState.v8', 'lifesim.gameState.v7'];

export type LifeLogEntry = {
  id: string;
  day: number;
  timeLabel: string;
  title: string;
  text: string;
};

export type GameState = {
  player: Player;
  time: GameTime;
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
    money: 12000,
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
    inventory: [],
    completedShifts: {},
    jobExperience: {},
    jobLevels: {},
    housingId: housingId('housing_room_danilovsky'),
    rentDebt: 0,
    daysUntilRent: 7
  };
}

export function createInitialGameState(): GameState {
  const time = createInitialTime();

  return {
    player: createInitialPlayer(),
    time,
    lifeLog: [
      {
        id: 'log_start',
        day: time.day,
        timeLabel: formatGameTime(time),
        title: 'Старт',
        text: 'Москва. Даниловский. Дом. Время теперь влияет на еду, воду и энергию.'
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

export function loadGameState(): GameState | undefined {
  try {
    const storageKeys = [GAME_STATE_STORAGE_KEY, ...LEGACY_GAME_STATE_STORAGE_KEYS];

    for (const storageKey of storageKeys) {
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as GameState;
      if (!parsed.player || !parsed.time || !Array.isArray(parsed.lifeLog)) continue;

      return {
        ...parsed,
        player: {
          ...parsed.player,
          completedShifts: parsed.player.completedShifts ?? {},
          jobExperience: parsed.player.jobExperience ?? {},
          jobLevels: parsed.player.jobLevels ?? {},
          skills: normalizePlayerSkills(parsed.player.skills)
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
