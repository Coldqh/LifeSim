import { describe, expect, it } from 'vitest';
import { createInitialGameState } from './gameState';
import { applyLifeGoalProgress } from './lifeGoalProgress';

describe('life goal state progress', () => {
  it('rewards a newly completed milestone only once', () => {
    const initial = createInitialGameState();
    const selected = {
      ...initial,
      lifeGoals: { ...initial.lifeGoals, activeGoalId: 'housing' as const, selectedDay: initial.time.day }
    };

    const first = applyLifeGoalProgress(selected);
    const second = applyLifeGoalProgress(first);

    expect(first.lifeGoals.completedMilestoneIds).toContain('housing:debt_free');
    expect(first.player.needs.mood).toBe(initial.player.needs.mood + 2);
    expect(second.player.needs.mood).toBe(first.player.needs.mood);
    expect(second.lifeLog.filter((entry) => entry.title === 'Этап жизненной цели')).toHaveLength(1);
  });

  it('marks the whole goal completed when every milestone is satisfied', () => {
    const initial = createInitialGameState();
    const progressed = applyLifeGoalProgress({
      ...initial,
      player: {
        ...initial.player,
        money: 300000,
        housingId: 'housing_studio_danilovsky' as typeof initial.player.housingId,
        rentDebt: 0
      },
      lifeGoals: { ...initial.lifeGoals, activeGoalId: 'housing', selectedDay: initial.time.day }
    });

    expect(progressed.lifeGoals.completedGoalIds).toContain('housing');
    expect(progressed.lifeLog.some((entry) => entry.title === 'Жизненная цель завершена')).toBe(true);
  });
});
