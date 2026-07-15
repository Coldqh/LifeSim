import { describe, expect, it } from 'vitest';
import { applyLifeAction } from './index';
import { createInitialTime } from '../time';
import type { LifeAction } from '../../types/actions';
import type { ActionId } from '../../types/ids';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';

const time: GameTime = createInitialTime();

function createPlayer(money: number): Player {
  return {
    money,
    needs: {
      hunger: 50,
      thirst: 50,
      energy: 50,
      health: 50,
      mood: 50
    }
  } as Player;
}

function createAction(overrides: Partial<LifeAction> = {}): LifeAction {
  return {
    id: 'test_meal' as ActionId,
    name: 'Тестовый приём пищи',
    description: 'Детерминированное действие для проверки текущей логики.',
    category: 'food',
    durationMinutes: 15,
    moneyDelta: -100,
    needsDelta: { hunger: 20 },
    resultMessage: 'Игрок поел.',
    ...overrides
  };
}

describe('applyLifeAction', () => {
  it('applies a successful action to time, money and needs', () => {
    const output = applyLifeAction({
      player: createPlayer(1_000),
      time,
      action: createAction()
    });

    expect(output.result).toEqual({
      ok: true,
      actionId: 'test_meal',
      actionName: 'Тестовый приём пищи',
      timeDeltaMinutes: 15,
      moneyDelta: -100,
      needsDelta: { hunger: 20 },
      messages: ['Игрок поел.']
    });
    expect(output.time).toEqual({
      day: 1,
      hour: 7,
      minute: 15,
      weekday: 'monday',
      calendar: { year: 2026, month: 9, dayOfMonth: 7, season: 'autumn' }
    });
    expect(output.player.money).toBe(900);
    expect(output.player.needs).toEqual({
      hunger: 70,
      thirst: 50,
      energy: 50,
      health: 50,
      mood: 50
    });
  });

  it('rejects an unaffordable action without changing player or time', () => {
    const player = createPlayer(50);
    const action = createAction();
    const output = applyLifeAction({ player, time, action });

    expect(output.player).toBe(player);
    expect(output.time).toBe(time);
    expect(output.result).toEqual({
      ok: false,
      actionId: 'test_meal',
      actionName: 'Тестовый приём пищи',
      timeDeltaMinutes: 0,
      messages: ['Деньги: 50/100 ₽.']
    });
  });
});
