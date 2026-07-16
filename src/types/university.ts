import type {
  CityId,
  DegreeProgramId,
  LocationId,
  SkillId,
  UniversityApplicationId,
  UniversityCampusActivityId,
  UniversityId,
  UniversitySubjectId
} from './ids';
import type { GameTime, Weekday } from './time';
import type { NeedsRequirement, NeedsState } from './needs';

export type UniversityDefinition = {
  id: UniversityId;
  name: string;
  shortName: string;
  cityId: CityId;
  locationId: LocationId;
  address: string;
  description: string;
  programIds: DegreeProgramId[];
};

export type DegreeProgramDefinition = {
  id: DegreeProgramId;
  universityId: UniversityId;
  title: string;
  durationSemesters: number;
  tuitionPerSemester: number;
  entranceDifficulty: number;
  requiredSkills?: Array<{ skillId: SkillId; minLevel: number }>;
  subjectIds: UniversitySubjectId[];
  careerTags: string[];
};

export type UniversitySubjectDefinition = {
  id: UniversitySubjectId;
  title: string;
  skillId: SkillId;
  weekday: Weekday;
  startMinute: number;
  durationMinutes: number;
  experienceReward: number;
};

export type UniversityCampusActivityKind = 'study' | 'meal' | 'social';

export type UniversityCampusActivityDefinition = {
  id: UniversityCampusActivityId;
  kind: UniversityCampusActivityKind;
  title: string;
  description: string;
  resultMessage: string;
  durationMinutes: number;
  moneyCost: number;
  needsDelta?: Partial<NeedsState>;
  needsRequirement?: NeedsRequirement;
  studyLoadDelta: number;
  knowledgeReward?: number;
};

export type UniversityApplicationStatus =
  | 'submitted'
  | 'exam_scheduled'
  | 'passed'
  | 'failed'
  | 'enrolled';

export type UniversityApplication = {
  id: UniversityApplicationId;
  programId: DegreeProgramId;
  status: UniversityApplicationStatus;
  submittedAtTotalMinutes: number;
  entranceExamAtTotalMinutes: number;
  score?: number;
  resolvedAtTotalMinutes?: number;
};

export type UniversityAssignment = {
  id: string;
  subjectId: UniversitySubjectId;
  title: string;
  dueDay: number;
  durationMinutes: number;
  completed: boolean;
  missed: boolean;
};

export type UniversitySubjectProgress = {
  classesAttended: number;
  classesMissed: number;
  assignmentsCompleted: number;
  knowledge: number;
};

export type UniversitySubjectSemesterSummary = {
  subjectId: UniversitySubjectId;
  title: string;
  classesAttended: number;
  classesMissed: number;
  assignmentsCompleted: number;
  knowledge: number;
  overdueAssignments: number;
  readyForExam: boolean;
};

export type UniversitySemesterSummary = {
  attendedClasses: number;
  missedClasses: number;
  attendanceRate: number;
  completedAssignments: number;
  activeAssignments: number;
  overdueAssignments: number;
  averageKnowledge: number;
  academicDebtCount: number;
  examPenaltyPoints: number;
  examRequirementsMet: boolean;
  subjectsAtRisk: number;
  subjects: UniversitySubjectSemesterSummary[];
};

export type UniversityEnrollment = {
  programId: DegreeProgramId;
  startedDay: number;
  semester: number;
  tuitionPaidThroughSemester: number;
  studyLoad: number;
  subjectProgress: Partial<Record<UniversitySubjectId, UniversitySubjectProgress>>;
  assignments: UniversityAssignment[];
  attendedSessionKeys: string[];
  missedSessionKeys: string[];
  examsPassed: number;
  completed: boolean;
};

export type UniversityHistoryEntry = {
  id: string;
  totalMinutes: number;
  title: string;
  text: string;
};

export type UniversityState = {
  applications: UniversityApplication[];
  enrollment?: UniversityEnrollment;
  history: UniversityHistoryEntry[];
  lastProcessedTotalMinutes: number;
};

export type UniversityOperationResult = {
  ok: boolean;
  title: string;
  message: string;
  timeDeltaMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
};

export type UniversityClassView = {
  subject: UniversitySubjectDefinition;
  startsAtTotalMinutes: number;
  sessionKey: string;
  isToday: boolean;
  canAttend: boolean;
  failure?: string;
};

export type TimeSkipRequest = {
  hours: number;
  minutes: number;
};

export type UniversityTimeProcessResult = {
  state: UniversityState;
  messages: string[];
};

export type UniversityActionContext = {
  time: GameTime;
  currentLocationId?: LocationId;
  playerMoney: number;
  playerEnergy: number;
  playerHealth: number;
};
