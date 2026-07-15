import { attendMedicalAppointment, issueSickLeave, scheduleMedicalAppointment } from '../../core/healthcare';
import { getTotalMinutes } from '../../core/time';
import { getMedicalServiceById } from '../../data/cities/contentSelectors';
import type { MedicalServiceId, PhoneNotificationId, PhoneCalendarEventId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createMedicalCommands(setGameState: GameStateSetter) {
  function scheduleMedicalVisit(serviceId: MedicalServiceId): void {
    const service = getMedicalServiceById(serviceId);
    if (!service) return;
    setGameState((currentState) => {
      const applied = scheduleMedicalAppointment({ state: currentState.world.medical, service, time: currentState.time });
      if (!applied.result.ok || !applied.appointment) {
        const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
          lifeLog: mergeLifeLog([entry], currentState.lifeLog)
        };
      }
      const appointment = applied.appointment;
      const calendarId = (`calendar_medical_${appointment.id}`) as PhoneCalendarEventId;
      const notificationId = (`notification_medical_${appointment.id}`) as PhoneNotificationId;
      const phone = {
        ...currentState.world.phone,
        calendarEvents: [{
          id: calendarId,
          type: 'medical_appointment' as const,
          title: service.name,
          locationId: service.clinicLocationId,
          startsAtTotalMinutes: appointment.startsAtTotalMinutes,
          durationMinutes: appointment.durationMinutes,
          status: 'scheduled' as const,
          medicalServiceId: service.id,
          medicalAppointmentId: appointment.id
        }, ...currentState.world.phone.calendarEvents].slice(0, 60),
        notifications: [{
          id: notificationId,
          appId: 'health' as const,
          title: 'Запись подтверждена',
          body: `${service.name}. Приём добавлен в календарь.`,
          createdAtTotalMinutes: getTotalMinutes(currentState.time),
          read: false,
          locationId: service.clinicLocationId,
          medicalServiceId: service.id,
          medicalAppointmentId: appointment.id
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      const entry = createLifeLogEntry(currentState, 'Запись к врачу', applied.result.message);
      return {
        ...currentState,
        world: { ...currentState.world, medical: applied.state, phone },
        lastResult: { ok: true, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([entry], currentState.lifeLog)
      };
    });
  }

  function attendMedicalVisit(serviceId: MedicalServiceId): void {
    const service = getMedicalServiceById(serviceId);
    if (!service) return;
    setGameState((currentState) => {
      const applied = attendMedicalAppointment({
        state: currentState.world.medical,
        player: currentState.player,
        service,
        time: currentState.time,
        currentLocationId: currentState.player.locationId
      });
      if (!applied.result.ok) {
        const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
          lifeLog: mergeLifeLog([entry], currentState.lifeLog)
        };
      }
      const completedAppointment = applied.state.appointments.find((entry) => entry.serviceId === service.id && entry.status === 'completed');
      const phone = {
        ...currentState.world.phone,
        calendarEvents: currentState.world.phone.calendarEvents.map((event) =>
          event.medicalAppointmentId === completedAppointment?.id ? { ...event, status: 'completed' as const } : event
        ),
        notifications: [{
          id: (`notification_medical_result_${getTotalMinutes(applied.time)}`) as PhoneNotificationId,
          appId: 'health' as const,
          title: 'Приём завершён',
          body: applied.result.message,
          createdAtTotalMinutes: getTotalMinutes(applied.time),
          read: false,
          locationId: service.clinicLocationId,
          medicalServiceId: service.id,
          medicalAppointmentId: completedAppointment?.id
        }, ...currentState.world.phone.notifications].slice(0, 80)
      };
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        'active',
        { medical: applied.state, phone, actionTitle: applied.result.title }
      );
      const messages = [applied.result.message, ...elapsedApplied.messages];
      const entry = createLifeLogEntry({ time: applied.time }, 'Медицина', messages.join(' '));
      return {
        ...currentState,
        time: applied.time,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: applied.result.title,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([entry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function requestSickLeave(): void {
    setGameState((currentState) => {
      const applied = issueSickLeave({
        state: currentState.world.medical,
        day: currentState.time.day,
        totalMinutes: getTotalMinutes(currentState.time)
      });
      const entry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
      return {
        ...currentState,
        world: { ...currentState.world, medical: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([entry], currentState.lifeLog)
      };
    });
  }

  return {
    scheduleMedicalVisit,
    attendMedicalVisit,
    requestSickLeave
  };
}
