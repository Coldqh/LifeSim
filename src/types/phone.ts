import type {
  JobApplicationId,
  JobId,
  LocationId,
  PhoneCalendarEventId,
  PhoneMessageId,
  PhoneNotificationId
} from './ids';

export type PhoneAppId = 'home' | 'jobs' | 'maps' | 'bank' | 'messages' | 'calendar' | 'notifications';

export type JobApplicationStatus = 'submitted' | 'invited' | 'rejected' | 'accepted' | 'missed';

export type PhoneJobApplication = {
  id: JobApplicationId;
  jobId: JobId;
  status: JobApplicationStatus;
  submittedAtTotalMinutes: number;
  responseAtTotalMinutes: number;
  interviewAtTotalMinutes?: number;
  reminderSent?: boolean;
  resolvedAtTotalMinutes?: number;
};

export type PhoneNotification = {
  id: PhoneNotificationId;
  appId: PhoneAppId;
  title: string;
  body: string;
  createdAtTotalMinutes: number;
  read: boolean;
  jobId?: JobId;
  locationId?: LocationId;
};

export type PhoneMessage = {
  id: PhoneMessageId;
  senderName: string;
  subject: string;
  body: string;
  createdAtTotalMinutes: number;
  read: boolean;
  jobId?: JobId;
  locationId?: LocationId;
};

export type PhoneCalendarEventStatus = 'scheduled' | 'completed' | 'missed';

export type PhoneCalendarEvent = {
  id: PhoneCalendarEventId;
  type: 'job_interview';
  title: string;
  locationId: LocationId;
  startsAtTotalMinutes: number;
  durationMinutes: number;
  status: PhoneCalendarEventStatus;
  jobId: JobId;
};

export type PhoneState = {
  applications: PhoneJobApplication[];
  notifications: PhoneNotification[];
  messages: PhoneMessage[];
  calendarEvents: PhoneCalendarEvent[];
  savedJobIds: JobId[];
  mapTargetLocationId?: LocationId;
  lastProcessedTotalMinutes: number;
};

export type PhoneOperationResult = {
  ok: boolean;
  title: string;
  message: string;
};
