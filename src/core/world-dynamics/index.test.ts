import { describe, expect, it } from 'vitest';
import { worldDynamicsTemplates } from '../../data/worldDynamics';
import type { CityId } from '../../types/ids';
import type { WorldAtlasState } from '../../types/worldAtlas';
import {
  createInitialWorldDynamicsState,
  getWorldDynamicsModifiers,
  processWorldDynamicsTime
} from './index';

const cityId = 'moscow' as CityId;

function atlas(economyIndex = 100, jobMarketIndex = 100): WorldAtlasState {
  return {
    version: 1,
    seed: 7,
    activeCityId: cityId,
    regionalCityIds: [],
    cityStates: {
      moscow: {
        cityId,
        tier: 'active',
        lastProcessedDay: 1,
        lastProcessedTotalMinutes: 0,
        aggregate: {
          residents: 100,
          employed: 60,
          activeResidents: 80,
          economyIndex,
          housingPressure: 100,
          jobMarketIndex,
          revision: 1
        }
      }
    },
    lastRebalancedDay: 1,
    lastProcessedTotalMinutes: 0
  };
}

describe('world dynamics', () => {
  it('creates autonomous city conditions while days pass', () => {
    const result = processWorldDynamicsTime({
      state: createInitialWorldDynamicsState(5, 1),
      fromDay: 1,
      toDay: 5,
      activeCityId: cityId,
      atlas: atlas(114, 116),
      templates: worldDynamicsTemplates
    });

    expect(result.started.length).toBeGreaterThan(0);
    expect(result.state.history.length).toBeGreaterThan(0);
    expect(result.state.lastProcessedDay).toBe(5);
    expect(result.state.activeConditions.every((condition) => condition.cityId === cityId)).toBe(true);
  });

  it('expires conditions and publishes a closing news entry', () => {
    const first = processWorldDynamicsTime({
      state: createInitialWorldDynamicsState(5, 1),
      fromDay: 1,
      toDay: 3,
      activeCityId: cityId,
      atlas: atlas(114, 116),
      templates: worldDynamicsTemplates
    });
    const lastEndDay = Math.max(...first.state.activeConditions.map((condition) => condition.endsDay));
    const second = processWorldDynamicsTime({
      state: first.state,
      fromDay: 3,
      toDay: lastEndDay + 1,
      activeCityId: cityId,
      atlas: atlas(100, 100),
      templates: []
    });

    expect(second.ended.length).toBeGreaterThan(0);
    expect(second.state.history.some((entry) => entry.phase === 'ended')).toBe(true);
  });

  it('combines persistent effects into gameplay modifiers', () => {
    const state = {
      ...createInitialWorldDynamicsState(1, 4),
      activeConditions: [
        {
          id: 'transit',
          kind: 'transit_disruption' as const,
          cityId,
          title: 'Транспорт',
          description: 'Задержки',
          startedDay: 2,
          endsDay: 6,
          strength: 0.25
        },
        {
          id: 'jobs',
          kind: 'hiring_slowdown' as const,
          cityId,
          title: 'Работа',
          description: 'Медленный найм',
          startedDay: 3,
          endsDay: 7,
          strength: 0.2
        },
        {
          id: 'business',
          kind: 'consumer_boom' as const,
          cityId,
          title: 'Спрос',
          description: 'Высокий спрос',
          startedDay: 4,
          endsDay: 5,
          strength: 0.2
        }
      ]
    };

    expect(getWorldDynamicsModifiers(state, cityId, 4)).toEqual({
      publicTransportDurationMultiplier: 1.25,
      jobResponseDelayMultiplier: 1.4,
      jobInviteChanceDelta: -20,
      businessDemandMultiplier: 1.2
    });
  });
});
