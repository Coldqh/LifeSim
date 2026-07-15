import type {
  CareerApplicationChannel,
  CareerEmploymentRecord,
  CareerResume,
  PlayerCareerState,
  PlayerQualification
} from '../../types/career';
import type { CareerEmploymentId, QualificationId } from '../../types/ids';
import type { Job } from '../../types/job';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';
import type { DegreeProgramDefinition, UniversityDefinition } from '../../types/university';

function employmentId(value: string): CareerEmploymentId {
  return value as CareerEmploymentId;
}

function qualificationId(value: string): QualificationId {
  return value as QualificationId;
}

function normalizeDay(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(1, Math.floor(value))
    : Math.max(1, Math.floor(fallback));
}

export function createInitialCareerState(): PlayerCareerState {
  return { employmentHistory: [] };
}

export function normalizePlayerQualifications(value: unknown): PlayerQualification[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: PlayerQualification[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const candidate = raw as Partial<PlayerQualification>;
    if (
      candidate.kind !== 'degree'
      || !candidate.id
      || !candidate.degreeProgramId
      || !candidate.universityId
      || typeof candidate.title !== 'string'
      || typeof candidate.institutionName !== 'string'
      || !candidate.awardedOn
    ) continue;
    const key = String(candidate.degreeProgramId);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      id: candidate.id,
      kind: 'degree',
      degreeProgramId: candidate.degreeProgramId,
      universityId: candidate.universityId,
      title: candidate.title,
      institutionName: candidate.institutionName,
      careerTags: Array.isArray(candidate.careerTags)
        ? candidate.careerTags.filter((entry): entry is string => typeof entry === 'string')
        : [],
      awardedDay: normalizeDay(candidate.awardedDay, 1),
      awardedOn: {
        year: Math.floor(Number(candidate.awardedOn.year)),
        month: Math.floor(Number(candidate.awardedOn.month)),
        dayOfMonth: Math.floor(Number(candidate.awardedOn.dayOfMonth))
      }
    });
  }
  return result;
}

function normalizeEmploymentRecord(value: unknown, fallbackDay: number): CareerEmploymentRecord | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Partial<CareerEmploymentRecord>;
  if (!candidate.id || !candidate.jobId) return undefined;
  const status = candidate.status === 'probation' || candidate.status === 'active' || candidate.status === 'ended'
    ? candidate.status
    : 'active';
  const employmentType = candidate.employmentType === 'internship' || candidate.employmentType === 'professional'
    ? candidate.employmentType
    : 'casual';
  return {
    id: candidate.id,
    jobId: candidate.jobId,
    companyId: candidate.companyId,
    employmentType,
    status,
    startedDay: normalizeDay(candidate.startedDay, fallbackDay),
    probationEndsDay: typeof candidate.probationEndsDay === 'number'
      ? normalizeDay(candidate.probationEndsDay, fallbackDay)
      : undefined,
    probationCompletedDay: typeof candidate.probationCompletedDay === 'number'
      ? normalizeDay(candidate.probationCompletedDay, fallbackDay)
      : undefined,
    endedDay: typeof candidate.endedDay === 'number'
      ? normalizeDay(candidate.endedDay, fallbackDay)
      : undefined,
    endReason: candidate.endReason === 'resigned' || candidate.endReason === 'changed_job'
      ? candidate.endReason
      : undefined
  };
}

export function normalizePlayerCareerState(
  value: unknown,
  currentJobId: Player['currentJobId'],
  currentDay: number
): PlayerCareerState {
  const candidate = value && typeof value === 'object' ? value as Partial<PlayerCareerState> : undefined;
  const history = Array.isArray(candidate?.employmentHistory)
    ? candidate.employmentHistory
        .map((entry) => normalizeEmploymentRecord(entry, currentDay))
        .filter((entry): entry is CareerEmploymentRecord => Boolean(entry))
        .slice(0, 80)
    : [];
  let activeEmployment = normalizeEmploymentRecord(candidate?.activeEmployment, currentDay);

  if (activeEmployment?.status === 'ended') activeEmployment = undefined;
  if (currentJobId && (!activeEmployment || activeEmployment.jobId !== currentJobId)) {
    activeEmployment = {
      id: employmentId(`employment_legacy_${String(currentJobId)}_${currentDay}`),
      jobId: currentJobId,
      employmentType: 'casual',
      status: 'active',
      startedDay: currentDay
    };
  }

  const historyWithoutActive = activeEmployment
    ? history.filter((entry) => entry.id !== activeEmployment?.id)
    : history;
  return {
    activeEmployment,
    employmentHistory: activeEmployment
      ? [activeEmployment, ...historyWithoutActive].slice(0, 80)
      : historyWithoutActive.slice(0, 80)
  };
}

function getQualifications(player: Player): PlayerQualification[] {
  return normalizePlayerQualifications(player.qualifications);
}

function hasAcceptedDegree(player: Player, job: Job): boolean {
  const acceptedProgramIds = job.requirements?.acceptedDegreeProgramIds ?? [];
  const requiredTags = job.requirements?.requiredCareerTags ?? [];
  if (acceptedProgramIds.length === 0 && requiredTags.length === 0) return true;

  const qualifications = getQualifications(player);
  const exactMatch = acceptedProgramIds.some((programId) => (
    qualifications.some((qualification) => qualification.degreeProgramId === programId)
  ));
  const tagMatch = requiredTags.some((tag) => (
    qualifications.some((qualification) => qualification.careerTags.includes(tag))
  ));
  return exactMatch || tagMatch;
}

export function getCareerApplicationFailure(
  player: Player,
  job: Job,
  channel: CareerApplicationChannel
): string | undefined {
  if (channel === 'direct' && job.applicationMode === 'interview') {
    return 'На эту вакансию нужно откликнуться через приложение «Работа» и пройти собеседование.';
  }
  if (!hasAcceptedDegree(player, job)) {
    return 'Для этой вакансии нужен подходящий диплом о высшем образовании.';
  }
  return undefined;
}

export function issueDegreeQualification(input: {
  player: Player;
  program: DegreeProgramDefinition;
  university: UniversityDefinition;
  time: GameTime;
}): { player: Player; qualification: PlayerQualification; created: boolean } {
  const qualifications = getQualifications(input.player);
  const existing = qualifications.find((entry) => entry.degreeProgramId === input.program.id);
  if (existing) return { player: { ...input.player, qualifications }, qualification: existing, created: false };

  const qualification: PlayerQualification = {
    id: qualificationId(`qualification_degree_${String(input.program.id)}`),
    kind: 'degree',
    degreeProgramId: input.program.id,
    universityId: input.university.id,
    title: input.program.title,
    institutionName: input.university.name,
    careerTags: [...input.program.careerTags],
    awardedDay: input.time.day,
    awardedOn: { ...input.time.calendar }
  };
  return {
    player: { ...input.player, qualifications: [qualification, ...qualifications] },
    qualification,
    created: true
  };
}

function replaceHistoryRecord(
  history: readonly CareerEmploymentRecord[],
  record: CareerEmploymentRecord
): CareerEmploymentRecord[] {
  return [record, ...history.filter((entry) => entry.id !== record.id)].slice(0, 80);
}

export function startCareerEmployment(input: {
  player: Player;
  job: Job;
  currentDay: number;
}): Player {
  const career = normalizePlayerCareerState(input.player.career, input.player.currentJobId, input.currentDay);
  if (career.activeEmployment?.jobId === input.job.id) {
    return { ...input.player, currentJobId: input.job.id, career };
  }

  let history = career.employmentHistory;
  if (career.activeEmployment) {
    const closed: CareerEmploymentRecord = {
      ...career.activeEmployment,
      status: 'ended',
      endedDay: input.currentDay,
      endReason: 'changed_job'
    };
    history = replaceHistoryRecord(history, closed);
  }

  const probationDays = Math.max(0, Math.floor(input.job.probationDays ?? 0));
  const record: CareerEmploymentRecord = {
    id: employmentId(`employment_${String(input.job.id)}_${input.currentDay}_${history.length + 1}`),
    jobId: input.job.id,
    companyId: input.job.companyId,
    employmentType: input.job.employmentType ?? 'casual',
    status: probationDays > 0 ? 'probation' : 'active',
    startedDay: input.currentDay,
    probationEndsDay: probationDays > 0 ? input.currentDay + probationDays : undefined
  };

  return {
    ...input.player,
    currentJobId: input.job.id,
    career: {
      activeEmployment: record,
      employmentHistory: replaceHistoryRecord(history, record)
    }
  };
}

export function resignCareerEmployment(input: {
  player: Player;
  currentDay: number;
}): { player: Player; resigned?: CareerEmploymentRecord } {
  const career = normalizePlayerCareerState(input.player.career, input.player.currentJobId, input.currentDay);
  if (!input.player.currentJobId || !career.activeEmployment) {
    return { player: { ...input.player, currentJobId: undefined, career } };
  }
  const resigned: CareerEmploymentRecord = {
    ...career.activeEmployment,
    status: 'ended',
    endedDay: input.currentDay,
    endReason: 'resigned'
  };
  return {
    resigned,
    player: {
      ...input.player,
      currentJobId: undefined,
      career: {
        activeEmployment: undefined,
        employmentHistory: replaceHistoryRecord(career.employmentHistory, resigned)
      }
    }
  };
}

export function processCareerTime(input: {
  player: Player;
  currentDay: number;
}): { player: Player; completedProbationJobId?: CareerEmploymentRecord['jobId'] } {
  const career = normalizePlayerCareerState(input.player.career, input.player.currentJobId, input.currentDay);
  const active = career.activeEmployment;
  if (!active || active.status !== 'probation' || !active.probationEndsDay || input.currentDay < active.probationEndsDay) {
    return { player: { ...input.player, career } };
  }

  const completed: CareerEmploymentRecord = {
    ...active,
    status: 'active',
    probationCompletedDay: input.currentDay
  };
  return {
    completedProbationJobId: completed.jobId,
    player: {
      ...input.player,
      career: {
        activeEmployment: completed,
        employmentHistory: replaceHistoryRecord(career.employmentHistory, completed)
      }
    }
  };
}

export function getCareerResume(player: Player): CareerResume {
  const career = normalizePlayerCareerState(player.career, player.currentJobId, 1);
  return {
    qualifications: getQualifications(player),
    activeEmployment: career.activeEmployment,
    employmentHistory: career.employmentHistory,
    completedShiftCount: Object.values(player.completedShifts).reduce<number>((sum, value) => sum + (value ?? 0), 0)
  };
}
