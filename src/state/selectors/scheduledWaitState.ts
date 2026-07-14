import type { LocationId } from '../../types/ids';
import type { PhoneCalendarEvent } from '../../types/phone';
import type { UniversityClassView } from '../../types/university';

export type ScheduledWaitKind = PhoneCalendarEvent['type'] | 'university_class';

export type ScheduledWaitState = {
  kind: ScheduledWaitKind;
  title: string;
  description: string;
  startsAtTotalMinutes: number;
  minutes: number;
};

type ScheduledWaitCandidate = {
  kind: ScheduledWaitKind;
  title: string;
  locationId: LocationId;
  startsAtTotalMinutes: number;
};

export type ScheduledWaitSelectorInput = {
  currentTotalMinutes: number;
  currentLocationId?: LocationId;
  calendarEvents: readonly PhoneCalendarEvent[];
  universityClasses?: readonly UniversityClassView[];
  universityLocationId?: LocationId;
  maxWaitMinutes?: number;
};

function getActionTitle(kind: ScheduledWaitKind, eventTitle: string): string {
  if (kind === 'intercity_departure') {
    if (eventTitle.toLowerCase().startsWith('поезд')) return 'Подождать поезд';
    if (eventTitle.toLowerCase().startsWith('автобус')) return 'Подождать автобус';
    return 'Подождать отправления';
  }
  if (kind === 'university_entrance_exam') return 'Подождать испытания';
  if (kind === 'university_class') return 'Подождать пару';
  if (kind === 'job_interview') return 'Подождать собеседования';
  if (kind === 'medical_appointment') return 'Подождать приёма';
  return 'Подождать встречи';
}

export function selectScheduledWaitState(input: ScheduledWaitSelectorInput): ScheduledWaitState | undefined {
  const { currentLocationId, currentTotalMinutes } = input;
  if (!currentLocationId) return undefined;
  const maxWaitMinutes = input.maxWaitMinutes ?? Number.POSITIVE_INFINITY;

  const calendarCandidates: ScheduledWaitCandidate[] = input.calendarEvents
    .filter((event) => event.status === 'scheduled' && event.locationId === currentLocationId)
    .map((event) => ({
      kind: event.type,
      title: event.title,
      locationId: event.locationId,
      startsAtTotalMinutes: event.startsAtTotalMinutes
    }));

  const universityCandidates: ScheduledWaitCandidate[] = input.universityLocationId === currentLocationId
    ? (input.universityClasses ?? []).map((entry) => ({
        kind: 'university_class' as const,
        title: entry.subject.title,
        locationId: currentLocationId,
        startsAtTotalMinutes: entry.startsAtTotalMinutes
      }))
    : [];

  const candidate = [...calendarCandidates, ...universityCandidates]
    .filter((entry) => {
      const waitMinutes = entry.startsAtTotalMinutes - currentTotalMinutes;
      return waitMinutes > 0 && waitMinutes <= maxWaitMinutes;
    })
    .sort((a, b) => a.startsAtTotalMinutes - b.startsAtTotalMinutes)[0];

  if (!candidate) return undefined;
  const minutes = candidate.startsAtTotalMinutes - currentTotalMinutes;

  return {
    kind: candidate.kind,
    title: getActionTitle(candidate.kind, candidate.title),
    description: candidate.title,
    startsAtTotalMinutes: candidate.startsAtTotalMinutes,
    minutes
  };
}
