import type { Housing, HousingKind } from '../../types/housing';
import type { Job } from '../../types/job';
import type {
  LifeProgressionPanelState,
  LifeProgressionSnapshot,
  LifeProgressionState,
  LifeProgressionTrackDefinition,
  LifeProgressionTrackId,
  LifeProgressionTrackState,
  LifeProgressionTrackView,
  PersistentConsequence,
  PersistentConsequenceKind
} from '../../types/lifeProgression';

export const LIFE_PROGRESSION_LEVEL_XP = [0, 50, 150, 350, 700, 1200] as const;
const TRACK_IDS: LifeProgressionTrackId[] = ['career', 'education', 'independence', 'social', 'business'];
const HANDLED_SIGNAL_LIMIT = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function createTrack(day: number): LifeProgressionTrackState {
  return { xp: 0, level: 0, reputation: 50, lastUpdatedDay: Math.max(1, day) };
}

export function createInitialLifeProgressionState(day = 1): LifeProgressionState {
  return {
    version: 1,
    tracks: {
      career: createTrack(day),
      education: createTrack(day),
      independence: createTrack(day),
      social: createTrack(day),
      business: { ...createTrack(day), reputation: 0 }
    },
    consequences: [],
    handledSignalIds: []
  };
}

export function normalizeLifeProgressionState(value: unknown, day = 1): LifeProgressionState {
  const initial = createInitialLifeProgressionState(day);
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<LifeProgressionState>;
  const rawTracks = candidate.tracks && typeof candidate.tracks === 'object' ? candidate.tracks : {};
  const tracks = Object.fromEntries(TRACK_IDS.map((id) => {
    const raw = (rawTracks as Partial<Record<LifeProgressionTrackId, Partial<LifeProgressionTrackState>>>)[id];
    return [id, {
      xp: typeof raw?.xp === 'number' ? Math.max(0, Math.floor(raw.xp)) : initial.tracks[id].xp,
      level: typeof raw?.level === 'number' ? clamp(raw.level, 0, LIFE_PROGRESSION_LEVEL_XP.length - 1) : initial.tracks[id].level,
      reputation: typeof raw?.reputation === 'number' ? clamp(raw.reputation, 0, 100) : initial.tracks[id].reputation,
      lastUpdatedDay: typeof raw?.lastUpdatedDay === 'number' ? Math.max(1, Math.floor(raw.lastUpdatedDay)) : day
    }];
  })) as Record<LifeProgressionTrackId, LifeProgressionTrackState>;

  return {
    version: 1,
    tracks,
    consequences: Array.isArray(candidate.consequences)
      ? candidate.consequences.filter((entry): entry is PersistentConsequence => Boolean(
          entry
          && typeof entry === 'object'
          && typeof entry.id === 'string'
          && typeof entry.kind === 'string'
          && typeof entry.title === 'string'
          && typeof entry.description === 'string'
          && typeof entry.startedDay === 'number'
        )).slice(0, 20)
      : [],
    handledSignalIds: Array.isArray(candidate.handledSignalIds)
      ? candidate.handledSignalIds.filter((entry): entry is string => typeof entry === 'string').slice(-HANDLED_SIGNAL_LIMIT)
      : []
  };
}

export function getLifeProgressionLevel(xp: number): number {
  let level = 0;
  for (let index = 1; index < LIFE_PROGRESSION_LEVEL_XP.length; index += 1) {
    if (xp < LIFE_PROGRESSION_LEVEL_XP[index]) break;
    level = index;
  }
  return level;
}

function housingXp(kind: HousingKind): number {
  if (kind === 'room') return 20;
  if (kind === 'studio') return 120;
  if (kind === 'one_room') return 220;
  return 0;
}

function activeConsequencePenalty(consequences: readonly PersistentConsequence[], kind: PersistentConsequenceKind): number {
  return consequences.some((entry) => entry.kind === kind) ? 1 : 0;
}

export function calculateLifeProgressionTracks(
  previous: LifeProgressionState,
  snapshot: LifeProgressionSnapshot,
  consequences: readonly PersistentConsequence[] = previous.consequences
): Record<LifeProgressionTrackId, LifeProgressionTrackState> {
  const careerXp = snapshot.career.completedShifts * 10
    + snapshot.career.promotionCount * 70
    + snapshot.career.completedProbations * 100
    + snapshot.career.professionalEmploymentCount * 160
    + snapshot.career.qualificationCount * 50;
  const careerReputation = 45
    + Math.min(20, snapshot.career.completedShifts)
    + snapshot.career.completedProbations * 8
    + snapshot.career.promotionCount * 4
    + snapshot.career.professionalEmploymentCount * 6
    - activeConsequencePenalty(consequences, 'career_unreliable') * 18;

  const educationXp = (snapshot.education.enrolled ? 25 : 0)
    + Math.min(20, snapshot.education.applicationCount * 10)
    + snapshot.education.attendedClasses * 8
    + snapshot.education.assignmentsCompleted * 18
    + snapshot.education.examsPassed * 120
    + snapshot.education.totalKnowledge
    + snapshot.education.degreeCount * 400;
  const classTotal = snapshot.education.attendedClasses + snapshot.education.missedClasses;
  const attendanceRate = classTotal > 0 ? snapshot.education.attendedClasses / classTotal * 100 : 50;
  const educationReputation = 45
    + (attendanceRate - 50) * 0.35
    + snapshot.education.examsPassed * 5
    + snapshot.education.degreeCount * 15
    - snapshot.education.academicDebtCount * 6;

  const independenceXp = housingXp(snapshot.independence.currentHousingKind)
    + Math.min(160, Math.floor(snapshot.independence.savings / 5000) * 10)
    + snapshot.independence.housingPaymentCount * 30
    + Math.min(60, Math.max(0, snapshot.day - 1) * 2);
  const independenceReputation = 48
    + snapshot.independence.housingPaymentCount * 5
    + Math.min(18, Math.floor(snapshot.independence.savings / 10000) * 3)
    - (snapshot.independence.rentDebt > 0 ? 35 : 0);

  const socialXp = snapshot.social.interactionCount * 5
    + snapshot.social.contactCount * 15
    + snapshot.social.completedMeetings * 30
    + snapshot.social.positiveMemoryCount * 4;
  const socialReputation = 45
    + snapshot.social.averageTrust * 0.25
    + snapshot.social.averageAffinity * 0.15
    - snapshot.social.averageTension * 0.25
    + snapshot.social.completedMeetings * 3
    - snapshot.social.missedMeetings * 8;

  const businessXp = snapshot.business.owned
    ? 60
      + snapshot.business.totalServed * 2
      + snapshot.business.profitableDays * 80
      + snapshot.business.employeeCount * 50
      + snapshot.business.upgradeCount * 40
    : 0;
  const businessReputation = snapshot.business.owned
    ? snapshot.business.reputation - (snapshot.business.debt > 0 ? 20 : 0)
    : 0;

  const targets: Record<LifeProgressionTrackId, { xp: number; reputation: number }> = {
    career: { xp: careerXp, reputation: careerReputation },
    education: { xp: educationXp, reputation: educationReputation },
    independence: { xp: independenceXp, reputation: independenceReputation },
    social: { xp: socialXp, reputation: socialReputation },
    business: { xp: businessXp, reputation: businessReputation }
  };

  return Object.fromEntries(TRACK_IDS.map((id) => {
    const xp = Math.max(previous.tracks[id].xp, Math.max(0, Math.floor(targets[id].xp)));
    return [id, {
      xp,
      level: getLifeProgressionLevel(xp),
      reputation: clamp(targets[id].reputation, 0, 100),
      lastUpdatedDay: snapshot.day
    }];
  })) as Record<LifeProgressionTrackId, LifeProgressionTrackState>;
}

function consequence(input: Omit<PersistentConsequence, 'id'>): PersistentConsequence {
  return { ...input, id: `progression_${input.kind}` };
}

function upsertConsequence(
  consequences: PersistentConsequence[],
  entry: PersistentConsequence
): PersistentConsequence[] {
  const existing = consequences.find((item) => item.kind === entry.kind);
  if (!existing) return [entry, ...consequences].slice(0, 20);
  return consequences.map((item) => item.kind === entry.kind
    ? {
        ...item,
        description: entry.description,
        severity: entry.severity,
        expiresDay: Math.max(item.expiresDay ?? 0, entry.expiresDay ?? 0) || undefined,
        sourceKey: entry.sourceKey ?? item.sourceKey
      }
    : item);
}

export type LifeProgressionReconcileResult = {
  state: LifeProgressionState;
  activated: PersistentConsequence[];
  resolved: PersistentConsequence[];
  leveledUpTrackIds: LifeProgressionTrackId[];
};

export function reconcileLifeProgression(input: {
  state: LifeProgressionState;
  snapshot: LifeProgressionSnapshot;
}): LifeProgressionReconcileResult {
  const state = normalizeLifeProgressionState(input.state, input.snapshot.day);
  const previousConsequences = state.consequences;
  let consequences = previousConsequences.filter((entry) => entry.expiresDay === undefined || entry.expiresDay >= input.snapshot.day);
  const handled = new Set(state.handledSignalIds);

  for (const applicationId of input.snapshot.career.missedInterviewIds) {
    const signalId = `missed_interview:${applicationId}`;
    if (handled.has(signalId)) continue;
    handled.add(signalId);
    consequences = upsertConsequence(consequences, consequence({
      kind: 'career_unreliable',
      title: 'Ненадёжный кандидат',
      description: 'Пропущенное собеседование временно снижает доверие работодателей и шанс приглашения.',
      severity: 'warning',
      startedDay: input.snapshot.day,
      expiresDay: input.snapshot.day + 14,
      sourceKey: signalId
    }));
  }

  for (const employmentId of input.snapshot.career.earlyResignationIds) {
    const signalId = `early_resignation:${employmentId}`;
    if (handled.has(signalId)) continue;
    handled.add(signalId);
    consequences = upsertConsequence(consequences, consequence({
      kind: 'career_unreliable',
      title: 'Сорванный испытательный срок',
      description: 'Уход во время испытательного срока портит карьерную репутацию на несколько недель.',
      severity: 'critical',
      startedDay: input.snapshot.day,
      expiresDay: input.snapshot.day + 21,
      sourceKey: signalId
    }));
  }

  const academicExisting = consequences.some((entry) => entry.kind === 'academic_warning');
  if (input.snapshot.education.academicDebtCount >= 3) {
    consequences = upsertConsequence(consequences, consequence({
      kind: 'academic_warning',
      title: 'Академическое предупреждение',
      description: 'Пропуски и просроченные задания закрывают студенческие активности, пока задолженность не будет снижена.',
      severity: input.snapshot.education.academicDebtCount >= 6 ? 'critical' : 'warning',
      startedDay: academicExisting
        ? consequences.find((entry) => entry.kind === 'academic_warning')?.startedDay ?? input.snapshot.day
        : input.snapshot.day
    }));
  } else if (input.snapshot.education.academicDebtCount <= 1) {
    consequences = consequences.filter((entry) => entry.kind !== 'academic_warning');
  }

  if (input.snapshot.independence.rentDebt > 0) {
    consequences = upsertConsequence(consequences, consequence({
      kind: 'rent_arrears',
      title: 'Долг по жилью',
      description: `Долг ${Math.round(input.snapshot.independence.rentDebt)} ₽ блокирует переезд и снижает финансовую репутацию.`,
      severity: input.snapshot.independence.rentDebt >= 10000 ? 'critical' : 'warning',
      startedDay: consequences.find((entry) => entry.kind === 'rent_arrears')?.startedDay ?? input.snapshot.day
    }));
  } else {
    consequences = consequences.filter((entry) => entry.kind !== 'rent_arrears');
  }

  if (input.snapshot.business.debt > 0) {
    consequences = upsertConsequence(consequences, consequence({
      kind: 'business_debt',
      title: 'Давление на бизнес',
      description: `Долг бизнеса ${Math.round(input.snapshot.business.debt)} ₽ снижает предпринимательскую репутацию.`,
      severity: input.snapshot.business.debt >= 30000 ? 'critical' : 'warning',
      startedDay: consequences.find((entry) => entry.kind === 'business_debt')?.startedDay ?? input.snapshot.day
    }));
  } else {
    consequences = consequences.filter((entry) => entry.kind !== 'business_debt');
  }

  const tracks = calculateLifeProgressionTracks(state, input.snapshot, consequences);
  const leveledUpTrackIds = TRACK_IDS.filter((id) => tracks[id].level > state.tracks[id].level);
  const previousKinds = new Set(previousConsequences.map((entry) => entry.kind));
  const nextKinds = new Set(consequences.map((entry) => entry.kind));

  return {
    state: {
      version: 1,
      tracks,
      consequences,
      handledSignalIds: [...handled].slice(-HANDLED_SIGNAL_LIMIT)
    },
    activated: consequences.filter((entry) => !previousKinds.has(entry.kind)),
    resolved: previousConsequences.filter((entry) => !nextKinds.has(entry.kind)),
    leveledUpTrackIds
  };
}

export function getLifeProgressionTrackView(
  state: LifeProgressionState,
  definition: LifeProgressionTrackDefinition
): LifeProgressionTrackView {
  const track = state.tracks[definition.id];
  const currentLevelXp = LIFE_PROGRESSION_LEVEL_XP[track.level];
  const nextLevelXp = LIFE_PROGRESSION_LEVEL_XP[track.level + 1];
  const levelSpan = nextLevelXp === undefined ? 0 : Math.max(1, nextLevelXp - currentLevelXp);
  const progressPercent = nextLevelXp === undefined
    ? 100
    : clamp((track.xp - currentLevelXp) / levelSpan * 100, 0, 100);

  return {
    ...track,
    definition,
    levelTitle: definition.levelTitles[track.level],
    nextLevelTitle: nextLevelXp === undefined ? undefined : definition.levelTitles[track.level + 1],
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    xpRemaining: nextLevelXp === undefined ? 0 : Math.max(0, nextLevelXp - track.xp),
    isMaxLevel: nextLevelXp === undefined
  };
}

export function createLifeProgressionPanelState(
  state: LifeProgressionState,
  definitions: readonly LifeProgressionTrackDefinition[]
): LifeProgressionPanelState {
  return {
    state,
    tracks: definitions.map((definition) => getLifeProgressionTrackView(state, definition)),
    consequences: [...state.consequences].sort((left, right) => {
      if (left.severity !== right.severity) return left.severity === 'critical' ? -1 : 1;
      return right.startedDay - left.startedDay;
    })
  };
}

export function hasLifeProgressionConsequence(
  state: LifeProgressionState,
  kind: PersistentConsequenceKind
): boolean {
  return state.consequences.some((entry) => entry.kind === kind);
}

export function getCareerProgressionFailure(state: LifeProgressionState, job: Job): string | undefined {
  if (job.employmentType !== 'professional') return undefined;
  const track = state.tracks.career;
  if (track.level < 1) return 'Для профессиональной вакансии нужен хотя бы 1 уровень карьерного опыта.';
  if (track.reputation < 45) return 'Карьерная репутация слишком низкая для этой вакансии.';
  return undefined;
}

export function getCareerInviteChanceDelta(state: LifeProgressionState): number {
  const reputationDelta = clamp((state.tracks.career.reputation - 50) / 2, -15, 15);
  const reliabilityPenalty = hasLifeProgressionConsequence(state, 'career_unreliable') ? -15 : 0;
  return clamp(reputationDelta + reliabilityPenalty, -30, 20);
}

export function getHousingProgressionFailure(state: LifeProgressionState, housing: Housing): string | undefined {
  if (hasLifeProgressionConsequence(state, 'rent_arrears')) {
    return 'Сначала погаси долг по текущему жилью.';
  }
  const requiredLevel = housing.kind === 'one_room' ? 2 : housing.kind === 'studio' ? 1 : 0;
  if (state.tracks.independence.level < requiredLevel) {
    return `Для этого жилья нужен уровень самостоятельности ${requiredLevel}.`;
  }
  return undefined;
}

export function getBusinessProgressionFailure(state: LifeProgressionState): string | undefined {
  if (state.tracks.independence.level < 1) {
    return 'Сначала достигни 1 уровня самостоятельности: научись держать жильё и деньги под контролем.';
  }
  return undefined;
}

export function getUniversityProgressionFailure(
  state: LifeProgressionState,
  activityId: string
): string | undefined {
  if (activityId === 'university_activity_student_club' && hasLifeProgressionConsequence(state, 'academic_warning')) {
    return 'Студклуб недоступен из-за академического предупреждения. Сначала сократи задолженность.';
  }
  return undefined;
}
