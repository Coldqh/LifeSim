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
    expect(result.world.atlas.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.atlas.cityStates.moscow.tier).toBe('active');
    expect(result.world.atlas.cityStates.yaroslavl.tier).toBe('regional');
    expect(result.world.atlas.cityStates.rybinsk.tier).toBe('regional');
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

  it('advances player age exactly on the stored birthday', () => {
    const state = createInitialGameState();
    const beforeBirthday = {
      ...state,
      time: { ...state.time, day: 347, calendar: { year: 2027, month: 8, dayOfMonth: 19, season: 'summer' as const } },
      player: { ...state.player, age: 18 }
    };
    const nextTime = addMinutes(beforeBirthday.time, 24 * 60);
    const result = advanceWorldTime({
      state: beforeBirthday,
      player: beforeBirthday.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });

    expect(result.player.age).toBe(19);
    expect(result.lifeLogEntries.some((entry) => entry.title === 'День рождения')).toBe(true);
  });

  it('keeps non-active city NPC details frozen while the active city advances', () => {
    const state = createInitialGameState();
    const remoteNpc = state.world.population.npcs.find((npc) => String(npc.homeDistrictId).startsWith('yar_'));
    expect(remoteNpc).toBeDefined();

    const result = advanceWorldTime({
      state,
      player: state.player,
      nextTime: addMinutes(state.time, 180),
      decayProfile: 'active',
      actionTitle: 'Ожидание'
    });
    const remoteAfter = result.world.population.npcs.find((npc) => npc.id === remoteNpc?.id);

    expect(remoteAfter).toBe(remoteNpc);
    expect(result.world.atlas.cityStates.yaroslavl.lastProcessedDay).toBe(state.time.day);
  });

});
