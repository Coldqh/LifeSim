import type { HousingKind } from './housing';

export type LifeProgressionTrackId = 'career' | 'education' | 'independence' | 'social' | 'business';

export type LifeProgressionTrackDefinition = {
  id: LifeProgressionTrackId;
  title: string;
  description: string;
  levelTitles: readonly [string, string, string, string, string, string];
};

export type LifeProgressionTrackState = {
  xp: number;
  level: number;
  reputation: number;
  lastUpdatedDay: number;
};

export type PersistentConsequenceKind =
  | 'career_unreliable'
  | 'academic_warning'
  | 'rent_arrears'
  | 'business_debt';

export type PersistentConsequenceSeverity = 'warning' | 'critical';

export type PersistentConsequence = {
  id: string;
  kind: PersistentConsequenceKind;
  title: string;
  description: string;
  severity: PersistentConsequenceSeverity;
  startedDay: number;
  expiresDay?: number;
  sourceKey?: string;
};

export type LifeProgressionState = {
  version: 1;
  tracks: Record<LifeProgressionTrackId, LifeProgressionTrackState>;
  consequences: PersistentConsequence[];
  handledSignalIds: string[];
};

export type LifeProgressionTrackView = LifeProgressionTrackState & {
  definition: LifeProgressionTrackDefinition;
  levelTitle: string;
  nextLevelTitle?: string;
  currentLevelXp: number;
  nextLevelXp?: number;
  progressPercent: number;
  xpRemaining: number;
  isMaxLevel: boolean;
};

export type LifeProgressionPanelState = {
  state: LifeProgressionState;
  tracks: LifeProgressionTrackView[];
  consequences: PersistentConsequence[];
};

export type LifeProgressionSnapshot = {
  day: number;
  career: {
    completedShifts: number;
    promotionCount: number;
    completedProbations: number;
    professionalEmploymentCount: number;
    qualificationCount: number;
    missedInterviewIds: string[];
    earlyResignationIds: string[];
  };
  education: {
    enrolled: boolean;
    applicationCount: number;
    attendedClasses: number;
    missedClasses: number;
    assignmentsCompleted: number;
    overdueAssignments: number;
    examsPassed: number;
    totalKnowledge: number;
    degreeCount: number;
    academicDebtCount: number;
  };
  independence: {
    currentHousingKind: HousingKind;
    savings: number;
    housingPaymentCount: number;
    rentDebt: number;
  };
  social: {
    interactionCount: number;
    contactCount: number;
    completedMeetings: number;
    missedMeetings: number;
    positiveMemoryCount: number;
    averageTrust: number;
    averageAffinity: number;
    averageTension: number;
  };
  business: {
    owned: boolean;
    totalServed: number;
    profitableDays: number;
    employeeCount: number;
    upgradeCount: number;
    reputation: number;
    debt: number;
  };
};
