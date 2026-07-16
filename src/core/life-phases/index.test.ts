import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../state/gameState';
import { createInitialLifePhasesState, createLifePhaseSnapshot, processLifePhasesTime, resolveLongTermLifeEvent } from '.';

function setup(day = 1) {
  const game = createInitialGameState();
  const snapshot = createLifePhaseSnapshot({ day, player: game.player, university: game.world.university, business: game.world.business, medical: game.world.medical, social: game.world.social, lifeGoals: game.lifeGoals });
  return { game, state: createInitialLifePhasesState(snapshot) };
}

describe('life phases', () => {
  it('creates weekly summaries when a week boundary is crossed', () => {
    const { game, state } = setup();
    const result = processLifePhasesTime({
      state,
      fromDay: 1,
      toDay: 8,
      player: { ...game.player, money: game.player.money + 2000 },
      university: game.world.university,
      business: game.world.business,
      medical: game.world.medical,
      population: game.world.population,
      social: game.world.social,
      progression: game.progression,
      lifeGoals: game.lifeGoals,
      cityDistrictIds: []
    });
    expect(result.state.weeklySummaries).toHaveLength(1);
    expect(result.state.weeklySummaries[0].lines.join(' ')).toContain('+2000');
  });

  it('keeps weekly and monthly summary windows independent', () => {
    const { game, state } = setup();
    const result = processLifePhasesTime({
      state,
      fromDay: 1,
      toDay: 25,
      player: game.player,
      university: game.world.university,
      business: game.world.business,
      medical: game.world.medical,
      population: game.world.population,
      social: game.world.social,
      progression: game.progression,
      lifeGoals: game.lifeGoals,
      cityDistrictIds: []
    });

    expect(result.state.weeklySummaries[0]).toMatchObject({ fromDay: 15, toDay: 22 });
    expect(result.state.monthlySummaries[0]).toMatchObject({ fromDay: 1, toDay: 25 });
    expect(result.state.lastWeeklySnapshot.day).toBe(22);
    expect(result.state.lastMonthlySnapshot.day).toBe(25);
  });

  it('automatically applies an expired health decision', () => {
    const { game, state } = setup();
    const event = {
      id: 'health_test', kind: 'health_recovery' as const, tone: 'critical' as const, title: 'Health', description: 'x',
      startedDay: 1, dueDay: 2, defaultChoiceId: 'push_through', choices: [{ id: 'recovery_plan', label: 'Rest', description: 'Rest' }, { id: 'push_through', label: 'Push', description: 'Push' }]
    };
    const medical = { ...game.world.medical, conditions: [{ id: 'exhaustion' as const, severity: 'moderate' as const, source: 'needs' as const, startedAtTotalMinutes: 0, recoveryHoursRemaining: 40, diagnosed: false, treatmentProgress: 0, lastUpdatedTotalMinutes: 0 }] };
    const result = processLifePhasesTime({ state: { ...state, activeEvents: [event] }, fromDay: 1, toDay: 3, player: game.player, university: game.world.university, business: game.world.business, medical, population: game.world.population, social: game.world.social, progression: game.progression, lifeGoals: game.lifeGoals, cityDistrictIds: [] });
    expect(result.state.activeEvents).toHaveLength(0);
    expect(result.player.needs.health).toBeLessThan(game.player.needs.health);
    expect(result.resolvedEntries[0].expired).toBe(true);
  });

  it('applies a rent decision through the core resolver', () => {
    const { game, state } = setup();
    const activeEvent = {
      id: 'rent_test', kind: 'rent_review' as const, tone: 'warning' as const, title: 'Rent', description: 'x',
      startedDay: 1, dueDay: 5, sourceKey: 'housing_room_danilovsky:1', defaultChoiceId: 'accept_rent', choices: [{ id: 'accept_rent', label: 'Accept', description: 'Accept' }, { id: 'negotiate_rent', label: 'Negotiate', description: 'Negotiate' }]
    };
    const resolved = resolveLongTermLifeEvent({ state: { ...state, activeEvents: [activeEvent] }, player: game.player, university: game.world.university, business: game.world.business, medical: game.world.medical, population: game.world.population, social: game.world.social, progression: game.progression, eventId: activeEvent.id, choiceId: 'accept_rent', day: 3 });
    expect(resolved?.state.rentMultiplier).toBe(1.1);
    expect(resolved?.state.rentContractKey).toBe('housing_room_danilovsky:1');
    expect(resolved?.state.activeEvents).toHaveLength(0);
  });
});
