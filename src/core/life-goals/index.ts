import { LIFE_GOAL_MILESTONE_IDS } from '../../data/lifeGoals';
import type {
  LifeGoalDefinition,
  LifeGoalEvaluationContext,
  LifeGoalId,
  LifeGoalMilestoneProgress,
  LifeGoalProgressView,
  LifeGoalsState
} from '../../types/lifeGoal';

export function createInitialLifeGoalsState(): LifeGoalsState {
  return {
    completedMilestoneIds: [],
    completedGoalIds: []
  };
}

export function normalizeLifeGoalsState(value: unknown): LifeGoalsState {
  const initial = createInitialLifeGoalsState();
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<LifeGoalsState>;
  const validGoalIds: LifeGoalId[] = ['university', 'career', 'boxing', 'business', 'housing'];
  const activeGoalId = validGoalIds.includes(candidate.activeGoalId as LifeGoalId)
    ? candidate.activeGoalId as LifeGoalId
    : undefined;
  return {
    activeGoalId,
    selectedDay: typeof candidate.selectedDay === 'number' ? Math.max(1, Math.floor(candidate.selectedDay)) : undefined,
    completedMilestoneIds: Array.isArray(candidate.completedMilestoneIds)
      ? [...new Set(candidate.completedMilestoneIds.filter((entry): entry is string => typeof entry === 'string'))].slice(0, 40)
      : [],
    completedGoalIds: Array.isArray(candidate.completedGoalIds)
      ? [...new Set(candidate.completedGoalIds.filter((entry): entry is LifeGoalId => validGoalIds.includes(entry as LifeGoalId)))].slice(0, validGoalIds.length)
      : []
  };
}

function totalCompletedShifts(context: LifeGoalEvaluationContext): number {
  return Object.values(context.player.completedShifts).reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function maxJobLevel(context: LifeGoalEvaluationContext): number {
  return Math.max(0, ...Object.values(context.player.jobLevels).map((value) => value ?? 0));
}

function totalOfficialFights(context: LifeGoalEvaluationContext): number {
  const record = context.player.boxing.officialRecord;
  return record.wins + record.losses + record.draws;
}

function totalLiquidAssets(context: LifeGoalEvaluationContext): number {
  return context.player.money + context.finance.cash + context.finance.savings;
}

function profitableBusinessDays(context: LifeGoalEvaluationContext): number {
  const business = context.business.ownedBusiness;
  if (!business) return 0;
  const finalized = business.reports.filter((report) => report.netProfit > 0).length;
  const current = business.currentReport.netProfit > 0 && business.currentReport.served > 0 ? 1 : 0;
  return finalized + current;
}

function milestoneProgress(
  milestoneId: string,
  context: LifeGoalEvaluationContext
): Omit<LifeGoalMilestoneProgress, 'definition'> {
  const enrollment = context.university.enrollment;
  const totalSemesters = context.activeProgram?.durationSemesters ?? 0;
  const halfwayTarget = totalSemesters > 0 ? Math.max(1, Math.ceil(totalSemesters / 2)) : 1;
  const shifts = totalCompletedShifts(context);
  const jobLevel = maxJobLevel(context);
  const officialFights = totalOfficialFights(context);
  const business = context.business.ownedBusiness;
  const profitableDays = profitableBusinessDays(context);
  const assets = totalLiquidAssets(context);

  switch (milestoneId) {
    case LIFE_GOAL_MILESTONE_IDS.university.application:
      return { completed: context.university.applications.length > 0, progressLabel: `${context.university.applications.length}/1`, progressValue: Math.min(1, context.university.applications.length), targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.university.enrollment:
      return { completed: Boolean(enrollment), progressLabel: enrollment ? 'Зачислен' : 'Не зачислен', progressValue: enrollment ? 1 : 0, targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.university.firstSemester:
      return { completed: (enrollment?.examsPassed ?? 0) >= 1, progressLabel: `${enrollment?.examsPassed ?? 0}/1 экзамен`, progressValue: Math.min(1, enrollment?.examsPassed ?? 0), targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.university.halfway:
      return { completed: (enrollment?.examsPassed ?? 0) >= halfwayTarget, progressLabel: `${Math.min(halfwayTarget, enrollment?.examsPassed ?? 0)}/${halfwayTarget} семестров`, progressValue: Math.min(halfwayTarget, enrollment?.examsPassed ?? 0), targetValue: halfwayTarget };
    case LIFE_GOAL_MILESTONE_IDS.university.degree:
      return { completed: Boolean(enrollment?.completed || context.player.qualifications?.length), progressLabel: enrollment?.completed || context.player.qualifications?.length ? 'Диплом получен' : 'Обучение не завершено', progressValue: enrollment?.completed || context.player.qualifications?.length ? 1 : 0, targetValue: 1 };

    case LIFE_GOAL_MILESTONE_IDS.career.firstJob:
      return { completed: Boolean(context.player.currentJobId || context.player.career?.employmentHistory.length), progressLabel: context.player.currentJobId ? 'Работа есть' : 'Нет работы', progressValue: context.player.currentJobId || context.player.career?.employmentHistory.length ? 1 : 0, targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.career.shifts:
      return { completed: shifts >= 10, progressLabel: `${Math.min(10, shifts)}/10 смен`, progressValue: Math.min(10, shifts), targetValue: 10 };
    case LIFE_GOAL_MILESTONE_IDS.career.promotion:
      return { completed: jobLevel >= 2, progressLabel: `Уровень ${jobLevel || 1}/2`, progressValue: Math.min(2, Math.max(1, jobLevel)), targetValue: 2 };
    case LIFE_GOAL_MILESTONE_IDS.career.probation: {
      const completed = Boolean(context.player.career?.employmentHistory.some((entry) => entry.probationCompletedDay));
      return { completed, progressLabel: completed ? 'Испытательный срок закрыт' : 'Испытательный срок впереди', progressValue: completed ? 1 : 0, targetValue: 1 };
    }
    case LIFE_GOAL_MILESTONE_IDS.career.professional: {
      const completed = context.player.career?.activeEmployment?.employmentType === 'professional'
        && context.player.career.activeEmployment.status !== 'ended';
      return { completed: Boolean(completed), progressLabel: completed ? 'Профессиональная работа' : 'Позиция не получена', progressValue: completed ? 1 : 0, targetValue: 1 };
    }

    case LIFE_GOAL_MILESTONE_IDS.boxing.membership:
      return { completed: Boolean(context.player.boxing.membership), progressLabel: context.player.boxing.membership ? 'Абонемент активен' : 'Нет абонемента', progressValue: context.player.boxing.membership ? 1 : 0, targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.boxing.trainer:
      return { completed: Boolean(context.player.boxing.selectedTrainerId), progressLabel: context.player.boxing.selectedTrainerId ? 'Тренер выбран' : 'Тренер не выбран', progressValue: context.player.boxing.selectedTrainerId ? 1 : 0, targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.boxing.level:
      return { completed: context.player.boxing.level >= 2, progressLabel: `Уровень ${Math.min(2, context.player.boxing.level)}/2`, progressValue: Math.min(2, context.player.boxing.level), targetValue: 2 };
    case LIFE_GOAL_MILESTONE_IDS.boxing.sparring:
      return { completed: context.player.boxing.sparringCount >= 1, progressLabel: `${Math.min(1, context.player.boxing.sparringCount)}/1`, progressValue: Math.min(1, context.player.boxing.sparringCount), targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.boxing.officialFight:
      return { completed: officialFights >= 1, progressLabel: `${Math.min(1, officialFights)}/1`, progressValue: Math.min(1, officialFights), targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.boxing.tournament:
      return { completed: context.player.boxing.tournamentWins >= 1, progressLabel: `${Math.min(1, context.player.boxing.tournamentWins)}/1`, progressValue: Math.min(1, context.player.boxing.tournamentWins), targetValue: 1 };

    case LIFE_GOAL_MILESTONE_IDS.business.launch:
      return { completed: Boolean(business), progressLabel: business ? business.name : 'Бизнес не открыт', progressValue: business ? 1 : 0, targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.business.firstCustomers: {
      const served = business ? Math.max(business.currentReport.served, ...business.reports.map((report) => report.served), 0) : 0;
      return { completed: served > 0, progressLabel: `${served} обслужено`, progressValue: served > 0 ? 1 : 0, targetValue: 1 };
    }
    case LIFE_GOAL_MILESTONE_IDS.business.employee:
      return { completed: (business?.employees.length ?? 0) >= 1, progressLabel: `${Math.min(1, business?.employees.length ?? 0)}/1 сотрудник`, progressValue: Math.min(1, business?.employees.length ?? 0), targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.business.reputation:
      return { completed: (business?.reputation ?? 0) >= 55, progressLabel: `${Math.round(business?.reputation ?? 0)}/55`, progressValue: Math.min(55, business?.reputation ?? 0), targetValue: 55 };
    case LIFE_GOAL_MILESTONE_IDS.business.profitableDays:
      return { completed: profitableDays >= 3, progressLabel: `${Math.min(3, profitableDays)}/3 прибыльных дня`, progressValue: Math.min(3, profitableDays), targetValue: 3 };

    case LIFE_GOAL_MILESTONE_IDS.housing.debtFree:
      return { completed: context.player.rentDebt <= 0, progressLabel: context.player.rentDebt <= 0 ? 'Долга нет' : `Долг ${Math.round(context.player.rentDebt)} ₽`, progressValue: context.player.rentDebt <= 0 ? 1 : 0, targetValue: 1 };
    case LIFE_GOAL_MILESTONE_IDS.housing.reserve:
      return { completed: assets >= 50000, progressLabel: `${Math.min(50000, Math.round(assets)).toLocaleString('ru-RU')} / 50 000 ₽`, progressValue: Math.min(50000, assets), targetValue: 50000 };
    case LIFE_GOAL_MILESTONE_IDS.housing.studio: {
      const completed = context.currentHousing?.kind === 'studio' || context.currentHousing?.kind === 'one_room';
      return { completed, progressLabel: context.currentHousing?.name ?? 'Жильё не найдено', progressValue: completed ? 1 : 0, targetValue: 1 };
    }
    case LIFE_GOAL_MILESTONE_IDS.housing.capital:
      return { completed: assets >= 150000, progressLabel: `${Math.min(150000, Math.round(assets)).toLocaleString('ru-RU')} / 150 000 ₽`, progressValue: Math.min(150000, assets), targetValue: 150000 };
    case LIFE_GOAL_MILESTONE_IDS.housing.homeFund: {
      const completed = assets >= 300000 && context.player.rentDebt <= 0;
      return { completed, progressLabel: `${Math.min(300000, Math.round(assets)).toLocaleString('ru-RU')} / 300 000 ₽`, progressValue: Math.min(300000, assets), targetValue: 300000 };
    }
    default:
      return { completed: false };
  }
}

export function getLifeGoalProgress(
  definition: LifeGoalDefinition,
  context: LifeGoalEvaluationContext
): LifeGoalProgressView {
  const milestones = definition.milestones.map((definitionEntry) => ({
    definition: definitionEntry,
    ...milestoneProgress(definitionEntry.id, context)
  }));
  const completedCount = milestones.filter((entry) => entry.completed).length;
  const totalCount = milestones.length;
  return {
    definition,
    milestones,
    completedCount,
    totalCount,
    progressPercent: totalCount > 0 ? Math.round(completedCount / totalCount * 100) : 0,
    complete: totalCount > 0 && completedCount === totalCount,
    nextMilestone: milestones.find((entry) => !entry.completed)
  };
}
