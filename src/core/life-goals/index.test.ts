import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../state/gameState';
import { getHousingById } from '../../data/cities/contentSelectors';
import { lifeGoalDefinitions } from '../../data/lifeGoals';
import { getLifeGoalProgress } from '.';

function getGoal(id: typeof lifeGoalDefinitions[number]['id']) {
  const goal = lifeGoalDefinitions.find((entry) => entry.id === id);
  if (!goal) throw new Error(`Missing goal ${id}`);
  return goal;
}

function context() {
  const state = createInitialGameState();
  return {
    player: state.player,
    university: state.world.university,
    business: state.world.business,
    finance: state.world.finance,
    currentHousing: getHousingById(state.player.housingId),
    activeProgram: undefined
  };
}

describe('life goal progress', () => {
  it('reads career progress from existing job history and shift counters', () => {
    const base = context();
    const progress = getLifeGoalProgress(getGoal('career'), {
      ...base,
      player: {
        ...base.player,
        currentJobId: 'job_test' as typeof base.player.currentJobId,
        completedShifts: { ['job_test' as keyof typeof base.player.completedShifts]: 10 },
        jobLevels: { ['job_test' as keyof typeof base.player.jobLevels]: 2 }
      }
    });

    expect(progress.milestones[0].completed).toBe(true);
    expect(progress.milestones[1].completed).toBe(true);
    expect(progress.milestones[2].completed).toBe(true);
  });

  it('requires a real official boxing fight before completing that milestone', () => {
    const base = context();
    const progress = getLifeGoalProgress(getGoal('boxing'), {
      ...base,
      player: {
        ...base.player,
        boxing: {
          ...base.player.boxing,
          sparringCount: 2,
          officialRecord: { wins: 0, losses: 1, draws: 0 }
        }
      }
    });

    expect(progress.milestones.find((entry) => entry.definition.id === 'boxing:first_sparring')?.completed).toBe(true);
    expect(progress.milestones.find((entry) => entry.definition.id === 'boxing:first_official_fight')?.completed).toBe(true);
    expect(progress.complete).toBe(false);
  });

  it('counts liquid funds from bank, cash and savings for the housing goal', () => {
    const base = context();
    const progress = getLifeGoalProgress(getGoal('housing'), {
      ...base,
      player: { ...base.player, money: 20000 },
      finance: { ...base.finance, cash: 10000, savings: 25000 }
    });

    expect(progress.milestones.find((entry) => entry.definition.id === 'housing:reserve')?.completed).toBe(true);
    expect(progress.milestones.find((entry) => entry.definition.id === 'housing:capital')?.completed).toBe(false);
  });
});
