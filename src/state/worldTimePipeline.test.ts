import { describe, expect, it } from 'vitest';
import { addMinutes, getTotalMinutes } from '../core/time';
import { createInitialGameState } from './gameState';
import { advanceWorldTime } from './worldTimePipeline';

describe('advanceWorldTime', () => {
  it('processes every time-driven world system in one advancement', () => {
    const state = createInitialGameState();
    const nextTime = addMinutes(state.time, 120);
    const currentTotalMinutes = getTotalMinutes(nextTime);

    const result = advanceWorldTime({
      state,
      player: state.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });

    expect(result.world.phone.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.social.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.university.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.medical.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.intercity.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.player.needs.hunger).toBeLessThan(state.player.needs.hunger);
  });

  it('records day expenses after housing consequences and does not apply them twice', () => {
    const state = createInitialGameState();
    const nextTime = addMinutes(state.time, 24 * 60);

    const first = advanceWorldTime({
      state,
      player: state.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });
    const housingTransaction = first.world.finance.transactions.find((entry) => (
      entry.title === 'Жильё и регулярные платежи'
    ));

    expect(first.world.finance.lastProcessedDay).toBe(nextTime.day);
    expect(housingTransaction?.amount).toBeLessThan(0);

    const committedState = {
      ...state,
      player: first.player,
      time: nextTime,
      world: first.world
    };
    const second = advanceWorldTime({
      state: committedState,
      player: committedState.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });

    expect(second.player.money).toBe(first.player.money);
    expect(second.world.finance.transactions).toHaveLength(first.world.finance.transactions.length);
    expect(second.world.phone.lastProcessedTotalMinutes).toBe(getTotalMinutes(nextTime));
  });
});
