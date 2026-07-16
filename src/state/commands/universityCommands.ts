import { issueDegreeQualification } from '../../core/career';
import { getLocationById } from '../../core/location';
import { getUniversityProgressionFailure } from '../../core/life-progression';
import { getOrganizationUniversityModifier } from '../../core/organizations';
import { getScheduleActivityFailure } from '../../core/schedule';
import { getTotalMinutes } from '../../core/time';
import { attendEntranceExam, attendUniversityClass, completeUniversityAssignment, enrollUniversityProgram, getUniversityCampusActivityFailure, performUniversityCampusActivity, submitUniversityApplication, takeUniversitySemesterExam } from '../../core/university';
import { getDegreeProgramById, getUniversityById, getUniversitySubjectById } from '../../data/cities/contentSelectors';
import { getUniversityCampusActivityById } from '../../data/education/universityActivities';
import { getOrganizationForUniversity } from '../../data/organizations';
import type { DegreeProgramId, UniversityCampusActivityId, UniversitySubjectId, PhoneNotificationId, PhoneCalendarEventId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';
import { mergeNeedsDelta } from '../worldTimePipeline';

export function createUniversityCommands(setGameState: GameStateSetter) {
  function submitDegreeApplication(programId: DegreeProgramId): void {
    const program = getDegreeProgramById(programId);
    const university = getUniversityById(program?.universityId);
    if (!program || !university) return;
    setGameState((currentState) => {
      const currentTotal = getTotalMinutes(currentState.time);
      const applied = submitUniversityApplication({
        state: currentState.world.university,
        player: currentState.player,
        program,
        currentTotalMinutes: currentTotal
      });
      if (!applied.result.ok || !applied.application) {
        return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };
      }
      const calendarId = (`calendar_university_exam_${String(applied.application.id)}`) as PhoneCalendarEventId;
      const notificationId = (`notification_university_application_${String(applied.application.id)}`) as PhoneNotificationId;
      const phone = {
        ...currentState.world.phone,
        calendarEvents: [{
          id: calendarId,
          type: 'university_entrance_exam' as const,
          title: `Вступительное испытание: ${program.title}`,
          locationId: university.locationId,
          startsAtTotalMinutes: applied.application.entranceExamAtTotalMinutes,
          durationMinutes: 90,
          status: 'scheduled' as const,
          degreeProgramId: program.id
        }, ...currentState.world.phone.calendarEvents].slice(0, 60),
        notifications: [{
          id: notificationId,
          appId: 'education' as const,
          title: 'Заявление принято',
          body: `${university.shortName}: вступительное испытание добавлено в календарь.`,
          createdAtTotalMinutes: currentTotal,
          read: false,
          locationId: university.locationId,
          degreeProgramId: program.id
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      return {
        ...currentState,
        world: { ...currentState.world, university: applied.state, phone },
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([createLifeLogEntry(currentState, applied.result.title, `${university.shortName}: ${program.title}.`)], currentState.lifeLog)
      };
    });
  }

  function attendDegreeEntranceExam(programId: DegreeProgramId): void {
    const program = getDegreeProgramById(programId);
    const university = getUniversityById(program?.universityId);
    if (!program || !university) return;
    setGameState((currentState) => {
      const applied = attendEntranceExam({ state: currentState.world.university, player: currentState.player, time: currentState.time, program, university });
      if (!applied.result.ok) {
        return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };
      }
      const phone = {
        ...currentState.world.phone,
        calendarEvents: currentState.world.phone.calendarEvents.map((event) => event.type === 'university_entrance_exam' && event.degreeProgramId === program.id
          ? { ...event, status: 'completed' as const }
          : event),
        notifications: [{
          id: (`notification_university_exam_${String(program.id)}_${getTotalMinutes(applied.time)}`) as PhoneNotificationId,
          appId: 'education' as const,
          title: applied.passed ? 'Испытание сдано' : 'Испытание не сдано',
          body: applied.result.message,
          createdAtTotalMinutes: getTotalMinutes(applied.time),
          read: false,
          degreeProgramId: program.id,
          locationId: university.locationId
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        'active',
        { university: applied.state, phone, actionTitle: applied.result.title }
      );
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: applied.result.timeDeltaMinutes, needsDelta: elapsedApplied.needsDelta, messages: [applied.result.message, ...elapsedApplied.messages] },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: applied.time }, applied.result.title, applied.result.message), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function enrollDegreeProgram(programId: DegreeProgramId): void {
    const program = getDegreeProgramById(programId);
    if (!program) return;
    setGameState((currentState) => {
      const applied = enrollUniversityProgram({ state: currentState.world.university, player: currentState.player, time: currentState.time, program });
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, university: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, moneyDelta: applied.result.moneyDelta, messages: [applied.result.message] },
        lifeLog: applied.result.ok ? mergeLifeLog([createLifeLogEntry(currentState, applied.result.title, applied.result.message)], currentState.lifeLog) : currentState.lifeLog
      };
    });
  }

  function attendDegreeClass(subjectId: UniversitySubjectId, startsAtTotalMinutes: number): void {
    const subject = getUniversitySubjectById(subjectId);
    if (!subject) return;
    setGameState((currentState) => {
      const program = getDegreeProgramById(currentState.world.university.enrollment?.programId);
      const university = getUniversityById(program?.universityId);
      if (!program || !university) return currentState;
      const organizationModifier = getOrganizationUniversityModifier({ state: currentState.world.organizations, definition: getOrganizationForUniversity(university.id) });
      const applied = attendUniversityClass({ state: currentState.world.university, player: currentState.player, time: currentState.time, subject, startsAtTotalMinutes, university, organizationModifier });
      if (!applied.result.ok) return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };
      const elapsedApplied = applyElapsedTimeConsequences(currentState, applied.player, applied.time, 'active', { university: applied.state, actionTitle: applied.result.title });
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: applied.result.timeDeltaMinutes, needsDelta: elapsedApplied.needsDelta, messages: [applied.result.message, ...elapsedApplied.messages] },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: applied.time }, applied.result.title, applied.result.message), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function completeDegreeAssignment(assignmentId: string): void {
    setGameState((currentState) => {
      const currentLocation = getLocationById(currentState.player.locationId);
      const applied = completeUniversityAssignment({ state: currentState.world.university, player: currentState.player, time: currentState.time, assignmentId, currentLocationType: currentLocation?.type });
      if (!applied.result.ok) return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };
      const elapsedApplied = applyElapsedTimeConsequences(currentState, applied.player, applied.time, 'active', { university: applied.state, actionTitle: applied.result.title });
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: applied.result.timeDeltaMinutes, needsDelta: elapsedApplied.needsDelta, messages: [applied.result.message, ...elapsedApplied.messages] },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: applied.time }, applied.result.title, applied.result.message), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function performDegreeCampusActivity(activityId: UniversityCampusActivityId): void {
    const activity = getUniversityCampusActivityById(activityId);
    if (!activity) return;
    setGameState((currentState) => {
      const program = getDegreeProgramById(currentState.world.university.enrollment?.programId);
      const university = getUniversityById(program?.universityId);
      if (!program || !university) return currentState;
      const subjects = program.subjectIds
        .map((subjectId) => getUniversitySubjectById(subjectId))
        .filter((subject): subject is NonNullable<typeof subject> => Boolean(subject));
      const activityFailure = getUniversityCampusActivityFailure({
        state: currentState.world.university,
        player: currentState.player,
        university,
        activity
      }) ?? getUniversityProgressionFailure(currentState.progression, activity.id);
      if (activityFailure) {
        return {
          ...currentState,
          lastResult: { ok: false, actionName: activity.title, timeDeltaMinutes: 0, messages: [activityFailure] }
        };
      }
      const universityLocation = getLocationById(university.locationId);
      const scheduleFailure = getScheduleActivityFailure(
        universityLocation?.openingHours,
        currentState.time,
        activity.durationMinutes,
        'Кампус'
      );
      if (scheduleFailure) {
        return {
          ...currentState,
          lastResult: { ok: false, actionName: activity.title, timeDeltaMinutes: 0, messages: [scheduleFailure] }
        };
      }
      const applied = performUniversityCampusActivity({
        state: currentState.world.university,
        player: currentState.player,
        time: currentState.time,
        program,
        university,
        subjects,
        activity,
        organizationModifier: getOrganizationUniversityModifier({ state: currentState.world.organizations, definition: getOrganizationForUniversity(university.id) })
      });
      if (!applied.result.ok) {
        return {
          ...currentState,
          lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] }
        };
      }
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        'active',
        { university: applied.state, actionTitle: applied.result.title }
      );
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: applied.result.title,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages: [applied.result.message, ...elapsedApplied.messages]
        },
        lifeLog: mergeLifeLog([
          createLifeLogEntry({ time: applied.time }, applied.result.title, applied.result.message),
          ...elapsedApplied.lifeLogEntries
        ], currentState.lifeLog)
      };
    });
  }

  function takeDegreeSemesterExam(): void {
    setGameState((currentState) => {
      const program = getDegreeProgramById(currentState.world.university.enrollment?.programId);
      const university = getUniversityById(program?.universityId);
      if (!program || !university) return currentState;
      const wasCompleted = Boolean(currentState.world.university.enrollment?.completed);
      const applied = takeUniversitySemesterExam({ state: currentState.world.university, player: currentState.player, time: currentState.time, program, university, organizationModifier: getOrganizationUniversityModifier({ state: currentState.world.organizations, definition: getOrganizationForUniversity(university.id) }) });
      if (!applied.result.ok) return { ...currentState, lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] } };

      const completedNow = !wasCompleted && Boolean(applied.state.enrollment?.completed);
      const qualificationApplied = completedNow
        ? issueDegreeQualification({ player: applied.player, program, university, time: applied.time })
        : { player: applied.player, qualification: undefined, created: false };
      const diplomaMessage = qualificationApplied.created && qualificationApplied.qualification
        ? `Выдан диплом: ${qualificationApplied.qualification.title}.`
        : undefined;
      const phone = diplomaMessage ? {
        ...currentState.world.phone,
        notifications: [{
          id: (`notification_degree_awarded_${String(program.id)}_${getTotalMinutes(applied.time)}`) as PhoneNotificationId,
          appId: 'education' as const,
          title: 'Диплом получен',
          body: `${university.shortName}: ${program.title}`,
          createdAtTotalMinutes: getTotalMinutes(applied.time),
          read: false,
          degreeProgramId: program.id,
          locationId: university.locationId
        }, ...currentState.world.phone.notifications].slice(0, 80)
      } : currentState.world.phone;
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        qualificationApplied.player,
        applied.time,
        'active',
        { university: applied.state, phone, actionTitle: applied.result.title }
      );
      const messages = [applied.result.message, diplomaMessage, ...elapsedApplied.messages].filter((message): message is string => Boolean(message));
      const diplomaLog = diplomaMessage ? [createLifeLogEntry({ time: applied.time }, 'Диплом', diplomaMessage)] : [];
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: applied.result.timeDeltaMinutes, needsDelta: elapsedApplied.needsDelta, messages },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: applied.time }, applied.result.title, applied.result.message), ...diplomaLog, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    submitDegreeApplication,
    attendDegreeEntranceExam,
    enrollDegreeProgram,
    attendDegreeClass,
    completeDegreeAssignment,
    performDegreeCampusActivity,
    takeDegreeSemesterExam
  };
}
