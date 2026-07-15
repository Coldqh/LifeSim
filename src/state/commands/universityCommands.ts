import { getLocationById } from '../../core/location';
import { getTotalMinutes } from '../../core/time';
import { attendEntranceExam, attendUniversityClass, completeUniversityAssignment, enrollUniversityProgram, submitUniversityApplication, takeUniversitySemesterExam } from '../../core/university';
import { getDegreeProgramById, getUniversityById, getUniversitySubjectById } from '../../data/education/universities';
import type { DegreeProgramId, UniversitySubjectId, PhoneNotificationId, PhoneCalendarEventId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

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
      const applied = attendUniversityClass({ state: currentState.world.university, player: currentState.player, time: currentState.time, subject, startsAtTotalMinutes, university });
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

  function takeDegreeSemesterExam(): void {
    setGameState((currentState) => {
      const program = getDegreeProgramById(currentState.world.university.enrollment?.programId);
      const university = getUniversityById(program?.universityId);
      if (!program || !university) return currentState;
      const applied = takeUniversitySemesterExam({ state: currentState.world.university, player: currentState.player, time: currentState.time, program, university });
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

  return {
    submitDegreeApplication,
    attendDegreeEntranceExam,
    enrollDegreeProgram,
    attendDegreeClass,
    completeDegreeAssignment,
    takeDegreeSemesterExam
  };
}
