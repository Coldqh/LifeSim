import type {
  JobApplicationId,
  JobId,
  LocationId,
  PhoneCalendarEventId,
  PhoneMessageId,
  PhoneNotificationId,
  MedicalServiceId,
  MedicalAppointmentId,
  IntercityRouteId,
  IntercityTicketId,
  DegreeProgramId
} from './ids';

export type PhoneAppId = 'home' | 'jobs' | 'education' | 'clock' | 'maps' | 'bank' | 'auto' | 'health' | 'trips' | 'messages' | 'calendar' | 'notifications';

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
  medicalServiceId?: MedicalServiceId;
  medicalAppointmentId?: MedicalAppointmentId;
  intercityRouteId?: IntercityRouteId;
  intercityTicketId?: IntercityTicketId;
  degreeProgramId?: DegreeProgramId;
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
  type: 'job_interview' | 'medical_appointment' | 'intercity_departure' | 'university_entrance_exam';
  title: string;
  locationId: LocationId;
  startsAtTotalMinutes: number;
  durationMinutes: number;
  status: PhoneCalendarEventStatus;
  jobId?: JobId;
  medicalServiceId?: MedicalServiceId;
  medicalAppointmentId?: MedicalAppointmentId;
  intercityRouteId?: IntercityRouteId;
  intercityTicketId?: IntercityTicketId;
  degreeProgramId?: DegreeProgramId;
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
