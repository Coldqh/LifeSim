import type { Job } from '../../types/job';
import type {
  JobApplicationId,
  JobId,
  LocationId,
  PhoneCalendarEventId,
  PhoneMessageId,
  PhoneNotificationId
} from '../../types/ids';
import type {
  PhoneCalendarEvent,
  PhoneJobApplication,
  PhoneMessage,
  PhoneNotification,
  PhoneOperationResult,
  PhoneState
} from '../../types/phone';

const MINUTES_IN_DAY = 24 * 60;
const INTERVIEW_DURATION_MINUTES = 30;
const INTERVIEW_EARLY_WINDOW_MINUTES = 60;
const INTERVIEW_LATE_WINDOW_MINUTES = 120;

function applicationId(value: string): JobApplicationId {
  return value as JobApplicationId;
}

function notificationId(value: string): PhoneNotificationId {
  return value as PhoneNotificationId;
}

function messageId(value: string): PhoneMessageId {
  return value as PhoneMessageId;
}

function calendarEventId(value: string): PhoneCalendarEventId {
  return value as PhoneCalendarEventId;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createId(prefix: string, key: string, totalMinutes: number): string {
  return `${prefix}_${key}_${totalMinutes}`;
}

export function pushPhoneNotification(
  state: PhoneState,
  notification: Omit<PhoneNotification, 'id' | 'read'>
): PhoneState {
  const key = String(notification.worldNewsId ?? notification.jobId ?? notification.npcId ?? notification.locationId ?? 'general');
  const id = notificationId(createId('notification', key, notification.createdAtTotalMinutes));
  if (state.notifications.some((entry) => entry.id === id)) return state;
  return {
    ...state,
    notifications: [{ ...notification, id, read: false }, ...state.notifications].slice(0, 80)
  };
}

export function pushPhoneMessage(state: PhoneState, message: Omit<PhoneMessage, 'id' | 'read'>): PhoneState {
  const key = String(message.jobId ?? message.npcId ?? message.locationId ?? 'general');
  const id = messageId(createId('message', key, message.createdAtTotalMinutes));
  if (state.messages.some((entry) => entry.id === id)) return state;
  return {
    ...state,
    messages: [{ ...message, id, read: false }, ...state.messages].slice(0, 80)
  };
}

export function pushPhoneCalendarEvent(state: PhoneState, event: PhoneCalendarEvent): PhoneState {
  if (state.calendarEvents.some((entry) => entry.id === event.id)) return state;
  return { ...state, calendarEvents: [event, ...state.calendarEvents].slice(0, 80) };
}

function createInterviewTime(responseAtTotalMinutes: number, jobId: JobId): number {
  const responseDay = Math.floor(responseAtTotalMinutes / MINUTES_IN_DAY);
  const seed = hashString(`${String(jobId)}:${responseAtTotalMinutes}`);
  const daysAhead = 1 + (seed % 2);
  const hour = 10 + (seed % 7);
  const minute = seed % 2 === 0 ? 0 : 30;
  return (responseDay + daysAhead) * MINUTES_IN_DAY + hour * 60 + minute;
}

function shouldInvite(application: PhoneJobApplication, applicationIndex: number): boolean {
  if (applicationIndex === 0) return true;
  const threshold = Math.min(95, Math.max(35, 78 + (application.inviteChanceDelta ?? 0)));
  return hashString(`${String(application.jobId)}:${application.submittedAtTotalMinutes}`) % 100 < threshold;
}

function formatClock(totalMinutes: number): string {
  const insideDay = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hour = String(Math.floor(insideDay / 60)).padStart(2, '0');
  const minute = String(insideDay % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

function dayNumber(totalMinutes: number): number {
  return Math.floor(totalMinutes / MINUTES_IN_DAY) + 1;
}

export function createInitialPhoneState(totalMinutes = 0): PhoneState {
  return {
    applications: [],
    notifications: [],
    messages: [],
    calendarEvents: [],
    savedJobIds: [],
    dailyOpportunityResolutions: [],
    lastProcessedTotalMinutes: Math.max(0, totalMinutes)
  };
}

export function getPhoneUnreadCount(state: PhoneState): number {
  return state.notifications.filter((entry) => !entry.read).length
    + state.messages.filter((entry) => !entry.read).length;
}

export function getJobApplicationForJob(state: PhoneState, jobId: JobId): PhoneJobApplication | undefined {
  return state.applications
    .filter((entry) => entry.jobId === jobId)
    .sort((left, right) => right.submittedAtTotalMinutes - left.submittedAtTotalMinutes)[0];
}

export function submitPhoneJobApplication(input: {
  state: PhoneState;
  job: Job;
  currentTotalMinutes: number;
  applicationFailure?: string;
  employerName: string;
  responseDelayMultiplier?: number;
  inviteChanceDelta?: number;
}): { state: PhoneState; result: PhoneOperationResult } {
  if (input.applicationFailure) {
    return {
      state: input.state,
      result: { ok: false, title: 'Отклик не отправлен', message: input.applicationFailure }
    };
  }

  const existing = getJobApplicationForJob(input.state, input.job.id);
  if (existing && ['submitted', 'invited', 'accepted'].includes(existing.status)) {
    const message = existing.status === 'submitted'
      ? 'Работодатель ещё рассматривает твой отклик.'
      : existing.status === 'invited'
        ? 'У тебя уже назначено собеседование.'
        : 'Ты уже получил эту работу.';
    return { state: input.state, result: { ok: false, title: 'Отклик уже существует', message } };
  }

  const baseResponseDelay = 6 * 60 + hashString(`${String(input.job.id)}:${input.currentTotalMinutes}`) % (13 * 60);
  const responseDelay = Math.max(120, Math.round(baseResponseDelay * Math.max(0.5, Math.min(2, input.responseDelayMultiplier ?? 1))));
  const application: PhoneJobApplication = {
    id: applicationId(createId('application', input.job.id, input.currentTotalMinutes)),
    jobId: input.job.id,
    status: 'submitted',
    submittedAtTotalMinutes: input.currentTotalMinutes,
    responseAtTotalMinutes: input.currentTotalMinutes + responseDelay,
    inviteChanceDelta: input.inviteChanceDelta
  };

  let nextState: PhoneState = {
    ...input.state,
    applications: [application, ...input.state.applications].slice(0, 40)
  };
  nextState = pushPhoneMessage(nextState, {
    senderName: input.employerName,
    subject: 'Отклик получен',
    body: `Отклик на вакансию «${input.job.title}» получен. Ответ придёт в течение рабочего дня.`,
    createdAtTotalMinutes: input.currentTotalMinutes,
    jobId: input.job.id,
    locationId: input.job.locationId
  });
  nextState = pushPhoneNotification(nextState, {
    appId: 'jobs',
    title: 'Отклик отправлен',
    body: `${input.job.title} · ${input.employerName}`,
    createdAtTotalMinutes: input.currentTotalMinutes,
    jobId: input.job.id,
    locationId: input.job.locationId
  });

  return {
    state: nextState,
    result: { ok: true, title: 'Отклик отправлен', message: 'Работодатель ответит через несколько игровых часов.' }
  };
}

export function processPhoneTime(input: {
  state: PhoneState;
  currentTotalMinutes: number;
  jobs: Job[];
  getEmployerName: (job: Job) => string;
  isJobAvailable?: (jobId: JobId) => boolean;
}): PhoneState {
  if (input.currentTotalMinutes <= input.state.lastProcessedTotalMinutes) return input.state;

  let state: PhoneState = { ...input.state };
  const applications = state.applications.map((application, applicationIndex) => {
    const job = input.jobs.find((candidate) => candidate.id === application.jobId);
    if (!job) return application;
    const employerName = input.getEmployerName(job);

    if (application.status === 'submitted' && input.isJobAvailable && !input.isJobAvailable(application.jobId)) {
      state = pushPhoneMessage(state, {
        senderName: employerName,
        subject: 'Вакансия закрыта',
        body: `Работодатель завершил поиск по вакансии «${job.title}». Другой кандидат успел раньше.`,
        createdAtTotalMinutes: input.currentTotalMinutes,
        jobId: job.id,
        locationId: job.locationId
      });
      state = pushPhoneNotification(state, {
        appId: 'jobs',
        title: 'Возможность упущена',
        body: `Вакансия «${job.title}» больше недоступна`,
        createdAtTotalMinutes: input.currentTotalMinutes,
        jobId: job.id,
        locationId: job.locationId
      });
      return { ...application, status: 'rejected' as const, resolvedAtTotalMinutes: input.currentTotalMinutes };
    }

    if (application.status === 'submitted' && input.currentTotalMinutes >= application.responseAtTotalMinutes) {
      if (shouldInvite(application, applicationIndex)) {
        const interviewAtTotalMinutes = createInterviewTime(application.responseAtTotalMinutes, application.jobId);
        const calendarEvent: PhoneCalendarEvent = {
          id: calendarEventId(createId('calendar', application.jobId, interviewAtTotalMinutes)),
          type: 'job_interview',
          title: `Собеседование: ${job.title}`,
          locationId: job.locationId,
          startsAtTotalMinutes: interviewAtTotalMinutes,
          durationMinutes: INTERVIEW_DURATION_MINUTES,
          status: 'scheduled',
          jobId: job.id
        };
        if (!state.calendarEvents.some((entry) => entry.id === calendarEvent.id)) {
          state = { ...state, calendarEvents: [calendarEvent, ...state.calendarEvents].slice(0, 60) };
        }
        state = pushPhoneMessage(state, {
          senderName: employerName,
          subject: 'Приглашение на собеседование',
          body: `Приходи на собеседование: день ${dayNumber(interviewAtTotalMinutes)}, ${formatClock(interviewAtTotalMinutes)}. Адрес указан в карточке вакансии.`,
          createdAtTotalMinutes: application.responseAtTotalMinutes,
          jobId: job.id,
          locationId: job.locationId
        });
        state = pushPhoneNotification(state, {
          appId: 'calendar',
          title: 'Приглашение на собеседование',
          body: `День ${dayNumber(interviewAtTotalMinutes)} · ${formatClock(interviewAtTotalMinutes)}`,
          createdAtTotalMinutes: application.responseAtTotalMinutes,
          jobId: job.id,
          locationId: job.locationId
        });
        return { ...application, status: 'invited' as const, interviewAtTotalMinutes };
      }

      state = pushPhoneMessage(state, {
        senderName: employerName,
        subject: 'Ответ по вакансии',
        body: `Спасибо за отклик на вакансию «${job.title}». Сейчас работодатель продолжает поиск другого кандидата.`,
        createdAtTotalMinutes: application.responseAtTotalMinutes,
        jobId: job.id,
        locationId: job.locationId
      });
      state = pushPhoneNotification(state, {
        appId: 'jobs',
        title: 'Ответ работодателя',
        body: `Отклик на «${job.title}» отклонён`,
        createdAtTotalMinutes: application.responseAtTotalMinutes,
        jobId: job.id,
        locationId: job.locationId
      });
      return { ...application, status: 'rejected' as const, resolvedAtTotalMinutes: application.responseAtTotalMinutes };
    }

    if (application.status === 'invited' && application.interviewAtTotalMinutes !== undefined) {
      const reminderAt = application.interviewAtTotalMinutes - 90;
      if (!application.reminderSent && input.currentTotalMinutes >= reminderAt && input.currentTotalMinutes < application.interviewAtTotalMinutes + INTERVIEW_LATE_WINDOW_MINUTES) {
        state = pushPhoneNotification(state, {
          appId: 'calendar',
          title: 'Собеседование скоро',
          body: `${job.title} · ${formatClock(application.interviewAtTotalMinutes)}`,
          createdAtTotalMinutes: Math.max(reminderAt, input.state.lastProcessedTotalMinutes),
          jobId: job.id,
          locationId: job.locationId
        });
        return { ...application, reminderSent: true };
      }
      if (input.currentTotalMinutes > application.interviewAtTotalMinutes + INTERVIEW_LATE_WINDOW_MINUTES) {
        state = pushPhoneMessage(state, {
          senderName: employerName,
          subject: 'Собеседование пропущено',
          body: `Ты не пришёл на собеседование по вакансии «${job.title}». Отклик закрыт.`,
          createdAtTotalMinutes: application.interviewAtTotalMinutes + INTERVIEW_LATE_WINDOW_MINUTES,
          jobId: job.id,
          locationId: job.locationId
        });
        state = pushPhoneNotification(state, {
          appId: 'jobs',
          title: 'Собеседование пропущено',
          body: job.title,
          createdAtTotalMinutes: application.interviewAtTotalMinutes + INTERVIEW_LATE_WINDOW_MINUTES,
          jobId: job.id,
          locationId: job.locationId
        });
        state = {
          ...state,
          calendarEvents: state.calendarEvents.map((event) => event.jobId === job.id && event.status === 'scheduled'
            ? { ...event, status: 'missed' }
            : event)
        };
        return { ...application, status: 'missed' as const, resolvedAtTotalMinutes: input.currentTotalMinutes };
      }
    }

    return application;
  });

  return {
    ...state,
    applications,
    lastProcessedTotalMinutes: input.currentTotalMinutes
  };
}

export function getInterviewFailure(input: {
  state: PhoneState;
  job: Job;
  currentLocationId?: LocationId;
  currentTotalMinutes: number;
}): string | undefined {
  const application = getJobApplicationForJob(input.state, input.job.id);
  if (!application || application.status !== 'invited' || application.interviewAtTotalMinutes === undefined) {
    return 'Сначала получи приглашение на собеседование.';
  }
  if (input.currentLocationId !== input.job.locationId) return 'Нужно приехать по адресу работодателя.';
  if (input.currentTotalMinutes < application.interviewAtTotalMinutes - INTERVIEW_EARLY_WINDOW_MINUTES) {
    return `Собеседование начнётся в ${formatClock(application.interviewAtTotalMinutes)}.`;
  }
  if (input.currentTotalMinutes > application.interviewAtTotalMinutes + INTERVIEW_LATE_WINDOW_MINUTES) {
    return 'Ты опоздал на собеседование.';
  }
  return undefined;
}

export function completeJobInterview(input: {
  state: PhoneState;
  job: Job;
  currentLocationId?: LocationId;
  currentTotalMinutes: number;
  employerName: string;
}): { state: PhoneState; result: PhoneOperationResult } {
  const failure = getInterviewFailure(input);
  if (failure) return { state: input.state, result: { ok: false, title: 'Собеседование недоступно', message: failure } };

  const application = getJobApplicationForJob(input.state, input.job.id);
  if (!application) return { state: input.state, result: { ok: false, title: 'Ошибка', message: 'Отклик не найден.' } };

  let state: PhoneState = {
    ...input.state,
    applications: input.state.applications.map((entry) => entry.id === application.id
      ? { ...entry, status: 'accepted', resolvedAtTotalMinutes: input.currentTotalMinutes }
      : entry),
    calendarEvents: input.state.calendarEvents.map((event) => event.jobId === input.job.id && event.status === 'scheduled'
      ? { ...event, status: 'completed' }
      : event)
  };
  state = pushPhoneMessage(state, {
    senderName: input.employerName,
    subject: 'Предложение о работе',
    body: `Собеседование пройдено. Работодатель готов принять тебя на должность «${input.job.title}».`,
    createdAtTotalMinutes: input.currentTotalMinutes,
    jobId: input.job.id,
    locationId: input.job.locationId
  });
  state = pushPhoneNotification(state, {
    appId: 'jobs',
    title: 'Работа получена',
    body: `${input.job.title} · ${input.employerName}`,
    createdAtTotalMinutes: input.currentTotalMinutes,
    jobId: input.job.id,
    locationId: input.job.locationId
  });

  return {
    state,
    result: { ok: true, title: 'Собеседование пройдено', message: `Ты принят на работу: ${input.job.title}.` }
  };
}

export function toggleSavedPhoneJob(state: PhoneState, jobId: JobId): PhoneState {
  const exists = state.savedJobIds.includes(jobId);
  return {
    ...state,
    savedJobIds: exists ? state.savedJobIds.filter((id) => id !== jobId) : [jobId, ...state.savedJobIds]
  };
}

export function setPhoneMapTarget(state: PhoneState, locationId: LocationId | undefined): PhoneState {
  return { ...state, mapTargetLocationId: locationId };
}

export function markPhoneNotificationRead(state: PhoneState, id: PhoneNotificationId): PhoneState {
  return {
    ...state,
    notifications: state.notifications.map((entry) => entry.id === id ? { ...entry, read: true } : entry)
  };
}

export function markPhoneMessageRead(state: PhoneState, id: PhoneMessageId): PhoneState {
  return {
    ...state,
    messages: state.messages.map((entry) => entry.id === id ? { ...entry, read: true } : entry)
  };
}
