import { getTravelDurationMinutes } from '../travel';
import type { DailyAgendaItem, DailyLifePanelState, DailyOpportunity, DailyOpportunityResolution, DailyPaymentItem } from '../../types/dailyLife';
import type { Job } from '../../types/job';
import type { Location } from '../../types/location';
import type { PhoneCalendarEvent } from '../../types/phone';
import type { GameTime } from '../../types/time';
import type { UniversityClassView } from '../../types/university';
import type { UpcomingPayment } from '../../types/finance';
import type { ActionId, UniversityCampusActivityId } from '../../types/ids';

const MINUTES_IN_DAY = 24 * 60;
const PAYMENT_LOOKAHEAD_DAYS = 2;

export type DailyLifeSelectorInput = {
  time: GameTime;
  money: number;
  currentLocation?: Location;
  locations: readonly Location[];
  calendarEvents: readonly PhoneCalendarEvent[];
  universityClasses: readonly UniversityClassView[];
  universityLocation?: Location;
  attendedUniversitySessionKeys: readonly string[];
  missedUniversitySessionKeys: readonly string[];
  currentJob?: Job;
  currentJobWage?: number;
  jobLocation?: Location;
  upcomingPayments: readonly UpcomingPayment[];
  opportunityResolutions: readonly DailyOpportunityResolution[];
  libraryActivityId: UniversityCampusActivityId;
  recoveryActionId: ActionId;
  lifeLog: ReadonlyArray<{ id: string; day: number; timeLabel: string; title: string; text: string }>;
};

function getDayStart(day: number): number {
  return (Math.max(1, day) - 1) * MINUTES_IN_DAY;
}

function getStatus(input: {
  now: number;
  startsAt: number;
  endsAt: number;
  sourceStatus?: PhoneCalendarEvent['status'];
}): DailyAgendaItem['status'] {
  if (input.sourceStatus === 'completed') return 'completed';
  if (input.sourceStatus === 'missed') return 'missed';
  if (input.now >= input.endsAt) return 'missed';
  if (input.now >= input.startsAt) return 'active';
  return 'upcoming';
}

function withTravel(item: DailyAgendaItem, currentLocation?: Location, destination?: Location): DailyAgendaItem {
  if (!currentLocation || !destination || currentLocation.cityId !== destination.cityId || item.startsAtTotalMinutes === undefined) {
    return item;
  }
  const travelMinutes = getTravelDurationMinutes(currentLocation, destination);
  return {
    ...item,
    travelMinutes,
    leaveByTotalMinutes: item.startsAtTotalMinutes - travelMinutes
  };
}

function attachConflicts(items: DailyAgendaItem[]): DailyAgendaItem[] {
  const conflicts = new Map<string, Set<string>>();
  for (let leftIndex = 0; leftIndex < items.length; leftIndex += 1) {
    const left = items[leftIndex];
    if (left.startsAtTotalMinutes === undefined || left.endsAtTotalMinutes === undefined || left.status === 'completed' || left.status === 'missed') continue;
    for (let rightIndex = leftIndex + 1; rightIndex < items.length; rightIndex += 1) {
      const right = items[rightIndex];
      if (right.startsAtTotalMinutes === undefined || right.endsAtTotalMinutes === undefined || right.status === 'completed' || right.status === 'missed') continue;
      if (left.startsAtTotalMinutes < right.endsAtTotalMinutes && right.startsAtTotalMinutes < left.endsAtTotalMinutes) {
        if (!conflicts.has(left.id)) conflicts.set(left.id, new Set());
        if (!conflicts.has(right.id)) conflicts.set(right.id, new Set());
        conflicts.get(left.id)?.add(right.id);
        conflicts.get(right.id)?.add(left.id);
      }
    }
  }
  return items.map((item) => ({ ...item, conflictIds: [...(conflicts.get(item.id) ?? [])] }));
}

function buildCalendarItems(input: DailyLifeSelectorInput, dayStart: number, dayEnd: number, now: number): DailyAgendaItem[] {
  return input.calendarEvents
    .filter((event) => event.startsAtTotalMinutes >= dayStart && event.startsAtTotalMinutes < dayEnd)
    .map((event) => {
      const destination = input.locations.find((location) => location.id === event.locationId);
      const startsAt = event.startsAtTotalMinutes;
      const endsAt = startsAt + event.durationMinutes;
      return withTravel({
        id: `calendar:${String(event.id)}`,
        kind: 'calendar',
        title: event.title,
        locationId: event.locationId,
        locationName: destination?.name,
        startsAtTotalMinutes: startsAt,
        endsAtTotalMinutes: endsAt,
        status: getStatus({ now, startsAt, endsAt, sourceStatus: event.status }),
        conflictIds: [],
        sourceCalendarEventId: event.id
      }, input.currentLocation, destination);
    });
}

function buildUniversityItems(input: DailyLifeSelectorInput, now: number): DailyAgendaItem[] {
  const attended = new Set(input.attendedUniversitySessionKeys);
  const missed = new Set(input.missedUniversitySessionKeys);
  return input.universityClasses
    .filter((entry) => entry.isToday)
    .map((entry) => {
      const startsAt = entry.startsAtTotalMinutes;
      const endsAt = startsAt + entry.subject.durationMinutes;
      const sourceStatus = attended.has(entry.sessionKey) ? 'completed' : missed.has(entry.sessionKey) ? 'missed' : undefined;
      return withTravel({
        id: `class:${entry.sessionKey}`,
        kind: 'university_class',
        title: entry.subject.title,
        description: 'Учебная пара',
        locationId: input.universityLocation?.id,
        locationName: input.universityLocation?.name,
        startsAtTotalMinutes: startsAt,
        endsAtTotalMinutes: endsAt,
        status: getStatus({ now, startsAt, endsAt, sourceStatus }),
        conflictIds: [],
        subjectId: entry.subject.id
      }, input.currentLocation, input.universityLocation);
    });
}

function buildWorkItem(input: DailyLifeSelectorInput, dayStart: number): DailyAgendaItem[] {
  if (!input.currentJob) return [];
  const schedule = input.currentJob.shiftSchedule;
  const windows = schedule?.kind === 'weekly' ? (schedule.days[input.time.weekday] ?? []) : [];
  const window = windows[0];
  return [{
    id: `work:${String(input.currentJob.id)}:${input.time.day}`,
    kind: 'work_shift',
    title: input.currentJob.title,
    description: window ? 'Рабочая смена доступна в это окно' : 'Гибкая смена доступна сегодня',
    locationId: input.currentJob.locationId,
    locationName: input.jobLocation?.name,
    startsAtTotalMinutes: window ? dayStart + window.startMinute : undefined,
    endsAtTotalMinutes: window ? dayStart + window.startMinute + input.currentJob.shiftDurationMinutes : undefined,
    windowEndTotalMinutes: window ? dayStart + window.endMinute : undefined,
    status: 'flexible',
    travelMinutes: input.currentLocation && input.jobLocation && input.currentLocation.cityId === input.jobLocation.cityId
      ? getTravelDurationMinutes(input.currentLocation, input.jobLocation)
      : undefined,
    conflictIds: [],
    jobId: input.currentJob.id
  }];
}

function buildPayments(input: DailyLifeSelectorInput): DailyPaymentItem[] {
  return input.upcomingPayments
    .filter((payment) => payment.dueDay >= input.time.day && payment.dueDay <= input.time.day + PAYMENT_LOOKAHEAD_DAYS)
    .map((payment) => ({
      id: payment.id,
      title: payment.title,
      amount: payment.amount,
      dueDay: payment.dueDay,
      daysUntilDue: payment.dueDay - input.time.day
    }))
    .sort((left, right) => left.dueDay - right.dueDay || left.amount - right.amount);
}

function buildOpportunity(input: DailyLifeSelectorInput): DailyOpportunity {
  const candidates: DailyOpportunity[] = [];
  if (input.currentJob) {
    candidates.push({
      id: `extra_shift:${input.time.day}`,
      kind: 'extra_shift',
      title: 'Взять смену сегодня',
      description: 'Закрыть рабочую смену и получить обычное начисление по своей должности.',
      rewardLabel: `${input.currentJobWage ?? input.currentJob.wagePerShift} ₽ в зарплату`,
      durationMinutes: input.currentJob.shiftDurationMinutes,
      locationId: input.currentJob.locationId,
      locationName: input.jobLocation?.name,
      targetApp: 'jobs',
      action: { kind: 'job_shift', jobId: input.currentJob.id }
    });
  }
  if (input.universityLocation) {
    candidates.push({
      id: `study_session:${input.time.day}`,
      kind: 'study_session',
      title: 'Подтянуть слабый предмет',
      description: 'Зайти в библиотеку, разобрать конспекты и снизить риск академической задолженности.',
      rewardLabel: 'Знания +10',
      durationMinutes: 90,
      locationId: input.universityLocation.id,
      locationName: input.universityLocation.name,
      targetApp: 'education',
      action: { kind: 'campus_activity', activityId: input.libraryActivityId }
    });
  }
  const recoveryLocation = input.currentLocation?.availableActionIds.includes(input.recoveryActionId)
    ? input.currentLocation
    : input.locations.find((location) => (
        location.cityId === input.currentLocation?.cityId
        && location.districtId === input.currentLocation?.districtId
        && location.availableActionIds.includes(input.recoveryActionId)
      ))
      ?? input.locations.find((location) => (
        location.cityId === input.currentLocation?.cityId
        && location.availableActionIds.includes(input.recoveryActionId)
      ));
  candidates.push({
    id: `recovery_walk:${input.time.day}`,
    kind: 'recovery_walk',
    title: 'Освободить голову',
    description: 'Оставить час без дел и пройтись по району.',
    rewardLabel: 'Настроение +6',
    durationMinutes: 60,
    locationId: recoveryLocation?.id,
    locationName: recoveryLocation?.name,
    action: { kind: 'life_action', actionId: input.recoveryActionId }
  });

  const dayResolution = input.opportunityResolutions.find((entry) => entry.day === input.time.day);
  const selected = candidates.find((candidate) => candidate.id === dayResolution?.opportunityId)
    ?? candidates[(input.time.day - 1) % candidates.length];
  const resolution = input.opportunityResolutions.find((entry) => entry.day === input.time.day && entry.opportunityId === selected.id);
  return { ...selected, decision: resolution?.decision };
}

export function selectDailyLifeState(input: DailyLifeSelectorInput): DailyLifePanelState {
  const dayStart = getDayStart(input.time.day);
  const dayEnd = dayStart + MINUTES_IN_DAY;
  const now = dayStart + input.time.hour * 60 + input.time.minute;
  const timedItems = attachConflicts([
    ...buildCalendarItems(input, dayStart, dayEnd, now),
    ...buildUniversityItems(input, now)
  ]).sort((left, right) => (left.startsAtTotalMinutes ?? Number.MAX_SAFE_INTEGER) - (right.startsAtTotalMinutes ?? Number.MAX_SAFE_INTEGER));
  const agenda = [...timedItems, ...buildWorkItem(input, dayStart)];
  const payments = buildPayments(input);
  const conflictPairs = new Set(agenda.flatMap((item) => item.conflictIds.map((otherId) => [item.id, otherId].sort().join('|'))));
  const mandatoryCount = agenda.filter((item) => ['upcoming', 'active', 'flexible'].includes(item.status)).length;

  return {
    agenda,
    payments,
    mandatoryCount,
    conflictCount: conflictPairs.size,
    remainingAfterPayments: input.money - payments.reduce((sum, payment) => sum + payment.amount, 0),
    opportunity: buildOpportunity(input),
    recentActivity: input.lifeLog.filter((entry) => entry.day === input.time.day).slice(0, 6)
  };
}
