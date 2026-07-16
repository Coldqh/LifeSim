import { applyMoneyDelta } from '../economy';
import { applyActivityNeedsDelta, getNeedsRequirementFailure } from '../needs';
import { applySkillExperience } from '../progression';
import { addMinutes, getTotalMinutes } from '../time';
import type { Player } from '../../types/player';
import type { GameTime, Weekday } from '../../types/time';
import type {
  DegreeProgramDefinition,
  UniversityApplication,
  UniversityCampusActivityDefinition,
  UniversityClassView,
  UniversityDefinition,
  UniversityEnrollment,
  UniversityOperationResult,
  UniversitySemesterSummary,
  UniversityState,
  UniversitySubjectDefinition,
  UniversitySubjectProgress,
  UniversityTimeProcessResult
} from '../../types/university';
import type {
  DegreeProgramId,
  LocationId,
  UniversityApplicationId,
  UniversitySubjectId
} from '../../types/ids';

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_MINUTES = 1440;

function applicationId(value: string): UniversityApplicationId {
  return value as UniversityApplicationId;
}

function getDayFromTotal(totalMinutes: number): number {
  return Math.floor(Math.max(0, totalMinutes) / DAY_MINUTES) + 1;
}

function totalForDayAndMinute(day: number, minute: number): number {
  return (Math.max(1, day) - 1) * DAY_MINUTES + minute;
}

function getWeekdayForDay(day: number): Weekday {
  return WEEKDAYS[(Math.max(1, day) - 1) % WEEKDAYS.length];
}

function getNextEntranceExamAt(currentTotalMinutes: number): number {
  const currentDay = getDayFromTotal(currentTotalMinutes);
  const currentMinute = currentTotalMinutes % DAY_MINUTES;
  const targetMinute = 11 * 60;
  const dayOffset = currentMinute < targetMinute - 120 ? 1 : 2;
  return totalForDayAndMinute(currentDay + dayOffset, targetMinute);
}

function createProgress(): UniversitySubjectProgress {
  return { classesAttended: 0, classesMissed: 0, assignmentsCompleted: 0, knowledge: 0 };
}

function formatRussianCount(value: number, forms: [string, string, string]): string {
  const normalized = Math.abs(value) % 100;
  const lastDigit = normalized % 10;
  const form = normalized > 10 && normalized < 20
    ? forms[2]
    : lastDigit === 1
      ? forms[0]
      : lastDigit >= 2 && lastDigit <= 4
        ? forms[1]
        : forms[2];
  return `${value} ${form}`;
}

function createEnrollment(program: DegreeProgramDefinition, day: number): UniversityEnrollment {
  return {
    programId: program.id,
    startedDay: day,
    semester: 1,
    tuitionPaidThroughSemester: 1,
    studyLoad: 10,
    subjectProgress: Object.fromEntries(program.subjectIds.map((id) => [id, createProgress()])),
    assignments: [],
    attendedSessionKeys: [],
    missedSessionKeys: [],
    examsPassed: 0,
    completed: false
  };
}

export function createInitialUniversityState(currentTotalMinutes: number): UniversityState {
  return {
    applications: [],
    history: [],
    lastProcessedTotalMinutes: currentTotalMinutes
  };
}

export function getUniversityApplicationForProgram(
  state: UniversityState,
  programId: DegreeProgramId
): UniversityApplication | undefined {
  return [...state.applications].reverse().find((entry) => entry.programId === programId);
}

export function submitUniversityApplication(input: {
  state: UniversityState;
  player: Player;
  program: DegreeProgramDefinition;
  currentTotalMinutes: number;
}): { state: UniversityState; result: UniversityOperationResult; application?: UniversityApplication } {
  if (input.state.enrollment) {
    return { state: input.state, result: { ok: false, title: 'Поступление', message: 'Сначала заверши текущее обучение.', timeDeltaMinutes: 0 } };
  }
  const active = getUniversityApplicationForProgram(input.state, input.program.id);
  if (active && ['submitted', 'exam_scheduled', 'passed', 'enrolled'].includes(active.status)) {
    return { state: input.state, result: { ok: false, title: 'Поступление', message: 'По этой программе уже есть активная заявка.', timeDeltaMinutes: 0 } };
  }
  const missing = (input.program.requiredSkills ?? []).find((requirement) => {
    const progress = input.player.skills[requirement.skillId];
    return (progress?.level ?? 0) < requirement.minLevel;
  });
  if (missing) {
    return { state: input.state, result: { ok: false, title: 'Поступление', message: `Не выполнено требование по навыку: уровень ${missing.minLevel}.`, timeDeltaMinutes: 0 } };
  }
  const examAt = getNextEntranceExamAt(input.currentTotalMinutes);
  const application: UniversityApplication = {
    id: applicationId(`university_application_${String(input.program.id)}_${input.currentTotalMinutes}`),
    programId: input.program.id,
    status: 'exam_scheduled',
    submittedAtTotalMinutes: input.currentTotalMinutes,
    entranceExamAtTotalMinutes: examAt
  };
  return {
    state: {
      ...input.state,
      applications: [...input.state.applications, application].slice(-30),
      history: [{ id: `university_history_${input.currentTotalMinutes}`, totalMinutes: input.currentTotalMinutes, title: 'Заявление подано', text: input.program.title }, ...input.state.history].slice(0, 40)
    },
    application,
    result: { ok: true, title: 'Заявление подано', message: 'Вступительное испытание добавлено в календарь.', timeDeltaMinutes: 0 }
  };
}

export function getEntranceExamFailure(input: {
  state: UniversityState;
  program: DegreeProgramDefinition;
  university: UniversityDefinition;
  currentLocationId?: LocationId;
  currentTotalMinutes: number;
}): string | undefined {
  const application = getUniversityApplicationForProgram(input.state, input.program.id);
  if (!application || application.status !== 'exam_scheduled') return 'Нет активного вступительного испытания.';
  if (input.currentLocationId !== input.university.locationId) return 'Нужно приехать в университет.';
  if (input.currentTotalMinutes < application.entranceExamAtTotalMinutes - 60) return 'Испытание ещё не началось.';
  if (input.currentTotalMinutes > application.entranceExamAtTotalMinutes + 120) return 'Ты пропустил вступительное испытание.';
  return undefined;
}

export function attendEntranceExam(input: {
  state: UniversityState;
  player: Player;
  time: GameTime;
  program: DegreeProgramDefinition;
  university: UniversityDefinition;
}): { state: UniversityState; player: Player; time: GameTime; result: UniversityOperationResult; passed: boolean; score: number } {
  const total = getTotalMinutes(input.time);
  const failure = getEntranceExamFailure({
    state: input.state,
    program: input.program,
    university: input.university,
    currentLocationId: input.player.locationId,
    currentTotalMinutes: total
  });
  if (failure) return { state: input.state, player: input.player, time: input.time, passed: false, score: 0, result: { ok: false, title: 'Вступительное испытание', message: failure, timeDeltaMinutes: 0 } };

  const skillLevels = input.program.requiredSkills?.map((entry) => input.player.skills[entry.skillId]?.level ?? 0) ?? [];
  const avgSkill = skillLevels.length ? skillLevels.reduce((sum, value) => sum + value, 0) / skillLevels.length : 0;
  const stableNoise = ((String(input.program.id).length + input.time.day * 7) % 9) - 4;
  const score = Math.max(0, Math.min(100, Math.round(64 + avgSkill * 8 + input.player.needs.energy * 0.12 - input.program.entranceDifficulty * 4 + stableNoise)));
  const passed = score >= 60;
  const nextTime = addMinutes(input.time, 90);
  const needsApplied = applyActivityNeedsDelta(input.player.needs, { energy: -10, mood: passed ? 4 : -5 }, { scaleEnergyCost: true });
  const nextState: UniversityState = {
    ...input.state,
    applications: input.state.applications.map((entry) => entry.programId === input.program.id && entry.status === 'exam_scheduled'
      ? { ...entry, status: passed ? 'passed' : 'failed', score, resolvedAtTotalMinutes: getTotalMinutes(nextTime) }
      : entry),
    history: [{ id: `university_history_exam_${total}`, totalMinutes: total, title: passed ? 'Испытание сдано' : 'Испытание не сдано', text: `${input.program.title}: ${score} баллов.` }, ...input.state.history].slice(0, 40)
  };
  return {
    state: nextState,
    player: { ...input.player, needs: needsApplied.needs },
    time: nextTime,
    passed,
    score,
    result: { ok: true, title: 'Вступительное испытание', message: passed ? `Результат: ${score}. Можно оформлять зачисление.` : `Результат: ${score}. Нужно подать заявление повторно позже.`, timeDeltaMinutes: 90 }
  };
}

export function enrollUniversityProgram(input: {
  state: UniversityState;
  player: Player;
  time: GameTime;
  program: DegreeProgramDefinition;
}): { state: UniversityState; player: Player; result: UniversityOperationResult } {
  const application = getUniversityApplicationForProgram(input.state, input.program.id);
  if (!application || application.status !== 'passed') {
    return { state: input.state, player: input.player, result: { ok: false, title: 'Зачисление', message: 'Сначала нужно сдать вступительное испытание.', timeDeltaMinutes: 0 } };
  }
  if (input.player.money < input.program.tuitionPerSemester) {
    return { state: input.state, player: input.player, result: { ok: false, title: 'Зачисление', message: `Нужно ${input.program.tuitionPerSemester} ₽ за семестр.`, timeDeltaMinutes: 0 } };
  }
  const enrollment = createEnrollment(input.program, input.time.day);
  return {
    player: { ...input.player, money: applyMoneyDelta(input.player.money, -input.program.tuitionPerSemester) },
    state: {
      ...input.state,
      enrollment,
      applications: input.state.applications.map((entry) => entry.programId === input.program.id ? { ...entry, status: 'enrolled' } : entry),
      history: [{ id: `university_history_enroll_${getTotalMinutes(input.time)}`, totalMinutes: getTotalMinutes(input.time), title: 'Зачисление', text: `${input.program.title}, семестр 1.` }, ...input.state.history].slice(0, 40)
    },
    result: { ok: true, title: 'Зачисление', message: `Оплачен первый семестр: ${input.program.tuitionPerSemester} ₽.`, timeDeltaMinutes: 0, moneyDelta: -input.program.tuitionPerSemester }
  };
}

function sessionKey(subjectId: UniversitySubjectId, day: number): string {
  return `${String(subjectId)}:${day}`;
}

export function getUniversityClasses(input: {
  state: UniversityState;
  time: GameTime;
  program?: DegreeProgramDefinition;
  subjects: UniversitySubjectDefinition[];
  university?: UniversityDefinition;
  currentLocationId?: LocationId;
}): UniversityClassView[] {
  if (!input.state.enrollment || !input.program || !input.university) return [];
  const currentTotal = getTotalMinutes(input.time);
  const result: UniversityClassView[] = [];
  for (let offset = 0; offset <= 7; offset += 1) {
    const day = input.time.day + offset;
    const weekday = getWeekdayForDay(day);
    input.program.subjectIds.forEach((id) => {
      const subject = input.subjects.find((entry) => entry.id === id);
      if (!subject || subject.weekday !== weekday) return;
      const startsAt = totalForDayAndMinute(day, subject.startMinute);
      if (startsAt < currentTotal - 120) return;
      const key = sessionKey(subject.id, day);
      const already = input.state.enrollment?.attendedSessionKeys.includes(key) || input.state.enrollment?.missedSessionKeys.includes(key);
      const locationFailure = input.currentLocationId !== input.university?.locationId ? 'Нужно быть в университете.' : undefined;
      const timeFailure = currentTotal < startsAt - 45 ? 'Пара ещё не началась.' : currentTotal > startsAt + 30 ? 'Ты опоздал на пару.' : undefined;
      const failure = already
        ? 'Эта пара уже завершена.'
        : timeFailure ?? locationFailure;
      result.push({
        subject,
        startsAtTotalMinutes: startsAt,
        sessionKey: key,
        isToday: day === input.time.day,
        canAttend: !already && !locationFailure && !timeFailure,
        failure
      });
    });
  }
  return result.sort((a, b) => a.startsAtTotalMinutes - b.startsAtTotalMinutes).slice(0, 8);
}

export function getUniversitySemesterSummary(input: {
  state: UniversityState;
  program?: DegreeProgramDefinition;
  subjects: UniversitySubjectDefinition[];
}): UniversitySemesterSummary | undefined {
  const enrollment = input.state.enrollment;
  if (!enrollment || !input.program) return undefined;

  const subjectSummaries = input.program.subjectIds.map((subjectId) => {
    const subject = input.subjects.find((entry) => entry.id === subjectId);
    const progress = enrollment.subjectProgress[subjectId] ?? createProgress();
    const overdueAssignments = enrollment.assignments.filter((assignment) => (
      assignment.subjectId === subjectId && assignment.missed
    )).length;

    return {
      subjectId,
      title: subject?.title ?? String(subjectId),
      classesAttended: progress.classesAttended,
      classesMissed: progress.classesMissed,
      assignmentsCompleted: progress.assignmentsCompleted,
      knowledge: progress.knowledge,
      overdueAssignments,
      readyForExam: progress.classesAttended >= 2 && progress.assignmentsCompleted >= 1
    };
  });

  const attendedClasses = subjectSummaries.reduce((sum, subject) => sum + subject.classesAttended, 0);
  const missedClasses = subjectSummaries.reduce((sum, subject) => sum + subject.classesMissed, 0);
  const completedAssignments = subjectSummaries.reduce((sum, subject) => sum + subject.assignmentsCompleted, 0);
  const activeAssignments = enrollment.assignments.filter((assignment) => !assignment.completed && !assignment.missed).length;
  const overdueAssignments = enrollment.assignments.filter((assignment) => assignment.missed).length;
  const totalRecordedClasses = attendedClasses + missedClasses;
  const averageKnowledge = Math.round(
    subjectSummaries.reduce((sum, subject) => sum + subject.knowledge, 0) / Math.max(1, subjectSummaries.length)
  );

  return {
    attendedClasses,
    missedClasses,
    attendanceRate: totalRecordedClasses > 0 ? Math.round((attendedClasses / totalRecordedClasses) * 100) : 100,
    completedAssignments,
    activeAssignments,
    overdueAssignments,
    averageKnowledge,
    academicDebtCount: missedClasses + overdueAssignments,
    examPenaltyPoints: missedClasses * 4,
    examRequirementsMet: subjectSummaries.every((subject) => subject.readyForExam),
    subjectsAtRisk: subjectSummaries.filter((subject) => {
      const hasAcademicRecord = subject.classesAttended + subject.classesMissed + subject.assignmentsCompleted > 0;
      return subject.classesMissed > 0
        || subject.overdueAssignments > 0
        || (hasAcademicRecord && subject.knowledge < 50);
    }).length,
    subjects: subjectSummaries
  };
}

export function getUniversitySemesterExamFailure(input: {
  state: UniversityState;
  program: DegreeProgramDefinition;
  university: UniversityDefinition;
  currentLocationId?: LocationId;
}): string | undefined {
  const enrollment = input.state.enrollment;
  if (!enrollment || enrollment.completed) return 'Нет активного обучения.';

  const missingClasses = input.program.subjectIds.reduce((sum, subjectId) => {
    const progress = enrollment.subjectProgress[subjectId] ?? createProgress();
    return sum + Math.max(0, 2 - progress.classesAttended);
  }, 0);
  const missingAssignments = input.program.subjectIds.reduce((sum, subjectId) => {
    const progress = enrollment.subjectProgress[subjectId] ?? createProgress();
    return sum + Math.max(0, 1 - progress.assignmentsCompleted);
  }, 0);

  if (missingClasses > 0 || missingAssignments > 0) {
    const requirements = [
      missingClasses > 0 ? `посетить ещё ${formatRussianCount(missingClasses, ['пару', 'пары', 'пар'])}` : undefined,
      missingAssignments > 0 ? `сдать ещё ${formatRussianCount(missingAssignments, ['задание', 'задания', 'заданий'])}` : undefined
    ].filter((entry): entry is string => Boolean(entry));
    return `До допуска нужно ${requirements.join(' и ')}.`;
  }

  if (input.currentLocationId !== input.university.locationId) return 'Нужно приехать в университет.';

  return undefined;
}

export function attendUniversityClass(input: {
  state: UniversityState;
  player: Player;
  time: GameTime;
  subject: UniversitySubjectDefinition;
  startsAtTotalMinutes: number;
  university: UniversityDefinition;
}): { state: UniversityState; player: Player; time: GameTime; result: UniversityOperationResult } {
  const enrollment = input.state.enrollment;
  if (!enrollment) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Пара', message: 'Нет активного обучения.', timeDeltaMinutes: 0 } };
  const key = sessionKey(input.subject.id, getDayFromTotal(input.startsAtTotalMinutes));
  const currentTotal = getTotalMinutes(input.time);
  if (input.player.locationId !== input.university.locationId) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Пара', message: 'Нужно быть в университете.', timeDeltaMinutes: 0 } };
  if (currentTotal < input.startsAtTotalMinutes - 45 || currentTotal > input.startsAtTotalMinutes + 30) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Пара', message: 'Сейчас нельзя начать эту пару.', timeDeltaMinutes: 0 } };
  if (enrollment.attendedSessionKeys.includes(key) || enrollment.missedSessionKeys.includes(key)) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Пара', message: 'Эта пара уже закрыта.', timeDeltaMinutes: 0 } };
  const needsFailure = getNeedsRequirementFailure(input.player.needs, { minEnergy: 10, minHealth: 20, minHunger: 5, minThirst: 5 });
  if (needsFailure) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Пара', message: needsFailure, timeDeltaMinutes: 0 } };

  const progress = enrollment.subjectProgress[input.subject.id] ?? createProgress();
  const assignmentExists = enrollment.assignments.some((entry) => entry.subjectId === input.subject.id && !entry.completed && !entry.missed);
  const nextAssignments = assignmentExists || progress.classesAttended > 0
    ? enrollment.assignments
    : [...enrollment.assignments, {
        id: `assignment_${String(input.subject.id)}_${input.time.day}`,
        subjectId: input.subject.id,
        title: `Задание: ${input.subject.title}`,
        dueDay: input.time.day + 4,
        durationMinutes: 120,
        completed: false,
        missed: false
      }];
  const skillApplied = applySkillExperience(input.player.skills, input.subject.skillId, input.subject.experienceReward);
  const needsApplied = applyActivityNeedsDelta(input.player.needs, { energy: -8, mood: 1 }, { scaleEnergyCost: true });
  const nextTime = addMinutes(input.time, input.subject.durationMinutes);
  return {
    player: { ...input.player, needs: needsApplied.needs, skills: skillApplied.skills },
    time: nextTime,
    state: {
      ...input.state,
      enrollment: {
        ...enrollment,
        studyLoad: Math.min(100, enrollment.studyLoad + 6),
        attendedSessionKeys: [...enrollment.attendedSessionKeys, key].slice(-200),
        assignments: nextAssignments,
        subjectProgress: {
          ...enrollment.subjectProgress,
          [input.subject.id]: { ...progress, classesAttended: progress.classesAttended + 1, knowledge: Math.min(100, progress.knowledge + 18) }
        }
      },
      history: [{ id: `university_history_class_${currentTotal}`, totalMinutes: currentTotal, title: input.subject.title, text: 'Пара посещена.' }, ...input.state.history].slice(0, 40)
    },
    result: { ok: true, title: input.subject.title, message: 'Посещаемость и знания выросли.', timeDeltaMinutes: input.subject.durationMinutes }
  };
}

export function completeUniversityAssignment(input: {
  state: UniversityState;
  player: Player;
  time: GameTime;
  assignmentId: string;
  currentLocationType?: string;
}): { state: UniversityState; player: Player; time: GameTime; result: UniversityOperationResult } {
  const enrollment = input.state.enrollment;
  const assignment = enrollment?.assignments.find((entry) => entry.id === input.assignmentId);
  if (!enrollment || !assignment || assignment.completed || assignment.missed) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Задание', message: 'Активное задание не найдено.', timeDeltaMinutes: 0 } };
  if (!['home', 'coworking', 'university', 'education_center'].includes(input.currentLocationType ?? '')) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Задание', message: 'Задание можно выполнить дома, в коворкинге или университете.', timeDeltaMinutes: 0 } };
  const failure = getNeedsRequirementFailure(input.player.needs, { minEnergy: 12, minHealth: 20, minHunger: 5, minThirst: 5 });
  if (failure) return { state: input.state, player: input.player, time: input.time, result: { ok: false, title: 'Задание', message: failure, timeDeltaMinutes: 0 } };
  const progress = enrollment.subjectProgress[assignment.subjectId] ?? createProgress();
  const needsApplied = applyActivityNeedsDelta(input.player.needs, { energy: -10, mood: -1 }, { scaleEnergyCost: true });
  const nextTime = addMinutes(input.time, assignment.durationMinutes);
  return {
    player: { ...input.player, needs: needsApplied.needs },
    time: nextTime,
    state: {
      ...input.state,
      enrollment: {
        ...enrollment,
        studyLoad: Math.min(100, enrollment.studyLoad + 8),
        assignments: enrollment.assignments.map((entry) => entry.id === assignment.id ? { ...entry, completed: true } : entry),
        subjectProgress: {
          ...enrollment.subjectProgress,
          [assignment.subjectId]: { ...progress, assignmentsCompleted: progress.assignmentsCompleted + 1, knowledge: Math.min(100, progress.knowledge + 20) }
        }
      },
      history: [{ id: `university_history_assignment_${getTotalMinutes(input.time)}`, totalMinutes: getTotalMinutes(input.time), title: assignment.title, text: 'Задание сдано.' }, ...input.state.history].slice(0, 40)
    },
    result: { ok: true, title: assignment.title, message: 'Задание выполнено.', timeDeltaMinutes: assignment.durationMinutes }
  };
}

export function takeUniversitySemesterExam(input: {
  state: UniversityState;
  player: Player;
  time: GameTime;
  program: DegreeProgramDefinition;
  university: UniversityDefinition;
}): { state: UniversityState; player: Player; time: GameTime; result: UniversityOperationResult; passed: boolean } {
  const enrollment = input.state.enrollment;
  const examFailure = getUniversitySemesterExamFailure({
    state: input.state,
    program: input.program,
    university: input.university,
    currentLocationId: input.player.locationId
  });
  if (!enrollment || examFailure) {
    return {
      state: input.state,
      player: input.player,
      time: input.time,
      passed: false,
      result: { ok: false, title: 'Экзамен', message: examFailure ?? 'Нет активного обучения.', timeDeltaMinutes: 0 }
    };
  }
  const progresses = input.program.subjectIds.map((id) => enrollment.subjectProgress[id] ?? createProgress());
  const averageKnowledge = progresses.reduce((sum, progress) => sum + progress.knowledge, 0) / Math.max(1, progresses.length);
  const attendancePenalty = progresses.reduce((sum, progress) => sum + progress.classesMissed, 0) * 4;
  const score = Math.round(averageKnowledge + input.player.needs.energy * 0.15 - enrollment.studyLoad * 0.1 - attendancePenalty + 12);
  const passed = score >= 60;
  const nextTime = addMinutes(input.time, 120);
  const needsApplied = applyActivityNeedsDelta(input.player.needs, { energy: -14, mood: passed ? 8 : -8 }, { scaleEnergyCost: true });
  const nextSemester = passed ? enrollment.semester + 1 : enrollment.semester;
  const completed = passed && nextSemester > input.program.durationSemesters;
  const resetProgress = passed ? Object.fromEntries(input.program.subjectIds.map((id) => [id, createProgress()])) : enrollment.subjectProgress;
  return {
    player: { ...input.player, needs: needsApplied.needs },
    time: nextTime,
    passed,
    state: {
      ...input.state,
      enrollment: {
        ...enrollment,
        semester: completed ? enrollment.semester : nextSemester,
        examsPassed: enrollment.examsPassed + (passed ? 1 : 0),
        completed,
        studyLoad: Math.max(0, enrollment.studyLoad - (passed ? 30 : 5)),
        subjectProgress: resetProgress,
        assignments: passed ? [] : enrollment.assignments,
        attendedSessionKeys: passed ? [] : enrollment.attendedSessionKeys,
        missedSessionKeys: passed ? [] : enrollment.missedSessionKeys
      },
      history: [{ id: `university_history_semester_exam_${getTotalMinutes(input.time)}`, totalMinutes: getTotalMinutes(input.time), title: passed ? 'Экзамен сдан' : 'Нужна пересдача', text: `Результат: ${score} баллов.` }, ...input.state.history].slice(0, 40)
    },
    result: { ok: true, title: 'Семестровый экзамен', message: passed ? `Экзамен сдан: ${score}. Семестр ${completed ? 'завершён, программа окончена' : nextSemester}.` : `Результат ${score}. Назначена пересдача.`, timeDeltaMinutes: 120 }
  };
}

export function getUniversityCampusActivityFailure(input: {
  state: UniversityState;
  player: Player;
  university: UniversityDefinition;
  activity: UniversityCampusActivityDefinition;
}): string | undefined {
  const enrollment = input.state.enrollment;
  if (!enrollment || enrollment.completed) return 'Нет активного студенческого статуса.';
  if (input.player.locationId !== input.university.locationId) return 'Нужно быть в своём университете.';
  if (input.player.money < input.activity.moneyCost) return `Нужно ${input.activity.moneyCost} ₽.`;
  return getNeedsRequirementFailure(input.player.needs, input.activity.needsRequirement ?? {});
}

export function performUniversityCampusActivity(input: {
  state: UniversityState;
  player: Player;
  time: GameTime;
  program: DegreeProgramDefinition;
  university: UniversityDefinition;
  subjects: UniversitySubjectDefinition[];
  activity: UniversityCampusActivityDefinition;
}): { state: UniversityState; player: Player; time: GameTime; result: UniversityOperationResult } {
  const failure = getUniversityCampusActivityFailure({
    state: input.state,
    player: input.player,
    university: input.university,
    activity: input.activity
  });
  if (failure) {
    return {
      state: input.state,
      player: input.player,
      time: input.time,
      result: { ok: false, title: input.activity.title, message: failure, timeDeltaMinutes: 0 }
    };
  }

  const enrollment = input.state.enrollment!;
  const focusSubject = input.activity.knowledgeReward
    ? input.program.subjectIds
        .map((subjectId) => ({
          subject: input.subjects.find((entry) => entry.id === subjectId),
          progress: enrollment.subjectProgress[subjectId] ?? createProgress()
        }))
        .filter((entry): entry is { subject: UniversitySubjectDefinition; progress: UniversitySubjectProgress } => Boolean(entry.subject))
        .sort((first, second) => first.progress.knowledge - second.progress.knowledge)[0]
    : undefined;

  if (input.activity.knowledgeReward && !focusSubject) {
    return {
      state: input.state,
      player: input.player,
      time: input.time,
      result: { ok: false, title: input.activity.title, message: 'Для программы не найдены учебные предметы.', timeDeltaMinutes: 0 }
    };
  }

  const needsApplied = applyActivityNeedsDelta(input.player.needs, input.activity.needsDelta, {
    scaleEnergyCost: true,
    scaleEnergyRecovery: true
  });
  const nextTime = addMinutes(input.time, input.activity.durationMinutes);
  const nextSubjectProgress = focusSubject
    ? {
        ...enrollment.subjectProgress,
        [focusSubject.subject.id]: {
          ...focusSubject.progress,
          knowledge: Math.min(100, focusSubject.progress.knowledge + (input.activity.knowledgeReward ?? 0))
        }
      }
    : enrollment.subjectProgress;
  const knowledgeMessage = focusSubject && input.activity.knowledgeReward
    ? ` ${focusSubject.subject.title}: знания +${input.activity.knowledgeReward}.`
    : '';

  return {
    player: {
      ...input.player,
      money: applyMoneyDelta(input.player.money, -input.activity.moneyCost),
      needs: needsApplied.needs
    },
    time: nextTime,
    state: {
      ...input.state,
      enrollment: {
        ...enrollment,
        studyLoad: Math.max(0, Math.min(100, enrollment.studyLoad + input.activity.studyLoadDelta)),
        subjectProgress: nextSubjectProgress
      },
      history: [{
        id: `university_history_campus_${String(input.activity.id)}_${getTotalMinutes(input.time)}`,
        totalMinutes: getTotalMinutes(input.time),
        title: input.activity.title,
        text: `${input.activity.resultMessage}${knowledgeMessage}`
      }, ...input.state.history].slice(0, 40)
    },
    result: {
      ok: true,
      title: input.activity.title,
      message: `${input.activity.resultMessage}${knowledgeMessage}`,
      timeDeltaMinutes: input.activity.durationMinutes,
      moneyDelta: input.activity.moneyCost > 0 ? -input.activity.moneyCost : undefined,
      needsDelta: needsApplied.delta
    }
  };
}

export function processUniversityTime(input: {
  state: UniversityState;
  fromTime: GameTime;
  toTime: GameTime;
  program?: DegreeProgramDefinition;
  subjects: UniversitySubjectDefinition[];
}): UniversityTimeProcessResult {
  const elapsed = Math.max(0, getTotalMinutes(input.toTime) - getTotalMinutes(input.fromTime));
  const enrollment = input.state.enrollment;
  if (!enrollment || !input.program || elapsed <= 0) {
    return { state: { ...input.state, lastProcessedTotalMinutes: getTotalMinutes(input.toTime) }, messages: [] };
  }
  let nextEnrollment: UniversityEnrollment = {
    ...enrollment,
    studyLoad: Math.max(0, enrollment.studyLoad - Math.floor(elapsed / 240)),
    assignments: enrollment.assignments.map((entry) => entry)
  };
  const messages: string[] = [];
  const fromTotal = getTotalMinutes(input.fromTime);
  const toTotal = getTotalMinutes(input.toTime);
  const startDay = input.fromTime.day;
  const endDay = Math.min(input.toTime.day, startDay + 14);
  for (let day = startDay; day <= endDay; day += 1) {
    const weekday = getWeekdayForDay(day);
    input.program.subjectIds.forEach((id) => {
      const subject = input.subjects.find((entry) => entry.id === id);
      if (!subject || subject.weekday !== weekday) return;
      const endAt = totalForDayAndMinute(day, subject.startMinute + subject.durationMinutes);
      const key = sessionKey(subject.id, day);
      if (endAt > fromTotal && endAt <= toTotal && !nextEnrollment.attendedSessionKeys.includes(key) && !nextEnrollment.missedSessionKeys.includes(key)) {
        const progress = nextEnrollment.subjectProgress[subject.id] ?? createProgress();
        nextEnrollment = {
          ...nextEnrollment,
          studyLoad: Math.min(100, nextEnrollment.studyLoad + 7),
          missedSessionKeys: [...nextEnrollment.missedSessionKeys, key].slice(-200),
          subjectProgress: {
            ...nextEnrollment.subjectProgress,
            [subject.id]: { ...progress, classesMissed: progress.classesMissed + 1 }
          }
        };
        messages.push(`Пропущена пара: ${subject.title}.`);
      }
    });
  }
  nextEnrollment = {
    ...nextEnrollment,
    assignments: nextEnrollment.assignments.map((entry) => {
      if (!entry.completed && !entry.missed && entry.dueDay < input.toTime.day) {
        messages.push(`Просрочено задание: ${entry.title}.`);
        return { ...entry, missed: true };
      }
      return entry;
    })
  };
  return {
    state: {
      ...input.state,
      enrollment: nextEnrollment,
      lastProcessedTotalMinutes: toTotal,
      history: messages.length
        ? [{ id: `university_history_process_${toTotal}`, totalMinutes: toTotal, title: 'Учёба', text: messages.join(' ') }, ...input.state.history].slice(0, 40)
        : input.state.history
    },
    messages
  };
}
