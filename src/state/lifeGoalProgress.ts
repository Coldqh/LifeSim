import { getLifeGoalProgress } from '../core/life-goals';
import { getDegreeProgramById, getHousingById } from '../data/cities/contentSelectors';
import { getLifeGoalDefinition } from '../data/lifeGoals';
import { createLifeLogEntry, type GameState } from './gameState';

export function applyLifeGoalProgress(state: GameState): GameState {
  const activeGoal = getLifeGoalDefinition(state.lifeGoals.activeGoalId);
  if (!activeGoal) return state;

  const progress = getLifeGoalProgress(activeGoal, {
    player: state.player,
    university: state.world.university,
    business: state.world.business,
    finance: state.world.finance,
    currentHousing: getHousingById(state.player.housingId),
    activeProgram: getDegreeProgramById(state.world.university.enrollment?.programId)
  });
  const completedSet = new Set(state.lifeGoals.completedMilestoneIds);
  const newlyCompleted = progress.milestones.filter((entry) => entry.completed && !completedSet.has(entry.definition.id));
  const goalJustCompleted = progress.complete && !state.lifeGoals.completedGoalIds.includes(activeGoal.id);

  if (newlyCompleted.length === 0 && !goalJustCompleted) return state;

  const milestoneEntries = newlyCompleted.map((entry) => createLifeLogEntry(
    state,
    'Этап жизненной цели',
    `${activeGoal.shortTitle}: «${entry.definition.title}» завершён.`
  ));
  const completionEntry = goalJustCompleted
    ? createLifeLogEntry(state, 'Жизненная цель завершена', `Ты завершил цель «${activeGoal.title}».`)
    : undefined;
  const moodReward = newlyCompleted.length > 0 ? Math.min(6, newlyCompleted.length * 2) : 0;

  return {
    ...state,
    player: moodReward > 0
      ? { ...state.player, needs: { ...state.player.needs, mood: Math.min(100, state.player.needs.mood + moodReward) } }
      : state.player,
    lifeGoals: {
      ...state.lifeGoals,
      completedMilestoneIds: [
        ...state.lifeGoals.completedMilestoneIds,
        ...newlyCompleted.map((entry) => entry.definition.id)
      ],
      completedGoalIds: goalJustCompleted
        ? [...state.lifeGoals.completedGoalIds, activeGoal.id]
        : state.lifeGoals.completedGoalIds
    },
    lifeLog: [completionEntry, ...milestoneEntries, ...state.lifeLog]
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .slice(0, 16)
  };
}
