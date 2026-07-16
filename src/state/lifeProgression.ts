import { createLifeProgressionPanelState, reconcileLifeProgression } from '../core/life-progression';
import { getHousingById } from '../data/cities/contentSelectors';
import { lifeProgressionTrackDefinitions } from '../data/lifeProgression';
import type { LifeProgressionSnapshot } from '../types/lifeProgression';
import { createLifeLogEntry, type GameState } from './gameState';

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function createLifeProgressionSnapshot(state: GameState): LifeProgressionSnapshot {
  const employmentHistory = state.player.career?.employmentHistory ?? [];
  const relationships = Object.values(state.world.social.relationships);
  const enrollment = state.world.university.enrollment;
  const subjectProgress = Object.values(enrollment?.subjectProgress ?? {}).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const business = state.world.business.ownedBusiness;
  const currentHousing = getHousingById(state.player.housingId);
  const missedInterviewIds = state.world.phone.applications
    .filter((entry) => entry.status === 'missed')
    .map((entry) => String(entry.id));
  const earlyResignationIds = employmentHistory
    .filter((entry) => entry.status === 'ended' && entry.endReason === 'resigned' && entry.probationEndsDay && !entry.probationCompletedDay && (entry.endedDay ?? Number.MAX_SAFE_INTEGER) < entry.probationEndsDay)
    .map((entry) => String(entry.id));
  const totalServed = business
    ? business.currentReport.served + business.reports.reduce((sum, report) => sum + report.served, 0)
    : 0;
  const profitableDays = business
    ? business.reports.filter((report) => report.netProfit > 0).length + (business.currentReport.netProfit > 0 && business.currentReport.served > 0 ? 1 : 0)
    : 0;

  return {
    day: state.time.day,
    career: {
      completedShifts: Object.values(state.player.completedShifts).reduce<number>((sum, value) => sum + (value ?? 0), 0),
      promotionCount: Object.values(state.player.jobLevels).reduce<number>((sum, value) => sum + Math.max(0, (value ?? 1) - 1), 0),
      completedProbations: employmentHistory.filter((entry) => Boolean(entry.probationCompletedDay)).length,
      professionalEmploymentCount: employmentHistory.filter((entry) => entry.employmentType === 'professional').length,
      qualificationCount: state.player.qualifications?.length ?? 0,
      missedInterviewIds,
      earlyResignationIds
    },
    education: {
      enrolled: Boolean(enrollment),
      applicationCount: state.world.university.applications.length,
      attendedClasses: subjectProgress.reduce((sum, entry) => sum + entry.classesAttended, 0),
      missedClasses: subjectProgress.reduce((sum, entry) => sum + entry.classesMissed, 0),
      assignmentsCompleted: subjectProgress.reduce((sum, entry) => sum + entry.assignmentsCompleted, 0),
      overdueAssignments: enrollment?.assignments.filter((entry) => entry.missed).length ?? 0,
      examsPassed: enrollment?.examsPassed ?? 0,
      totalKnowledge: subjectProgress.reduce((sum, entry) => sum + Math.max(0, Math.floor(entry.knowledge)), 0),
      degreeCount: state.player.qualifications?.length ?? 0,
      academicDebtCount: subjectProgress.reduce((sum, entry) => sum + entry.classesMissed, 0)
        + (enrollment?.assignments.filter((entry) => entry.missed).length ?? 0)
    },
    independence: {
      currentHousingKind: currentHousing?.kind ?? 'bed_space',
      savings: state.world.finance.savings,
      housingPaymentCount: state.world.finance.transactions.filter((entry) => entry.category === 'housing' && entry.amount < 0).length,
      rentDebt: state.player.rentDebt
    },
    social: {
      interactionCount: relationships.reduce((sum, entry) => sum + entry.interactionCount, 0),
      contactCount: Object.keys(state.world.social.contacts).length,
      completedMeetings: state.world.social.meetings.filter((entry) => entry.status === 'completed').length,
      missedMeetings: state.world.social.meetings.filter((entry) => entry.status === 'missed').length,
      positiveMemoryCount: relationships.reduce((sum, entry) => sum + entry.memories.filter((memory) => memory.tone === 'positive').length, 0),
      averageTrust: average(relationships.map((entry) => entry.trust)),
      averageAffinity: average(relationships.map((entry) => entry.affinity)),
      averageTension: average(relationships.map((entry) => entry.tension))
    },
    business: {
      owned: Boolean(business),
      totalServed,
      profitableDays,
      employeeCount: business?.employees.length ?? 0,
      upgradeCount: business?.upgradeIds.length ?? 0,
      reputation: business?.reputation ?? 0,
      debt: business?.debt ?? 0
    }
  };
}

export function applyLifeProgression(state: GameState): GameState {
  const result = reconcileLifeProgression({
    state: state.progression,
    snapshot: createLifeProgressionSnapshot(state)
  });

  const panel = createLifeProgressionPanelState(result.state, lifeProgressionTrackDefinitions);
  const levelEntries = result.leveledUpTrackIds.map((trackId) => {
    const track = panel.tracks.find((entry) => entry.definition.id === trackId);
    return createLifeLogEntry(
      state,
      'Развитие',
      `${track?.definition.title ?? trackId}: новый статус «${track?.levelTitle ?? `уровень ${result.state.tracks[trackId].level}`}».`
    );
  });
  const activatedEntries = result.activated.map((entry) => createLifeLogEntry(state, entry.title, entry.description));
  const resolvedEntries = result.resolved.map((entry) => createLifeLogEntry(state, 'Последствие снято', `${entry.title}: ситуация больше не действует.`));

  if (levelEntries.length === 0 && activatedEntries.length === 0 && resolvedEntries.length === 0 && result.state === state.progression) {
    return state;
  }

  return {
    ...state,
    progression: result.state,
    lifeLog: [...resolvedEntries, ...activatedEntries, ...levelEntries, ...state.lifeLog].slice(0, 16)
  };
}
