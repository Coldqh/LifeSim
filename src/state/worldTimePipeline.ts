import { simulateBusinessTime } from '../core/business';
import { processFinanceDay, reconcileExternalBankBalance } from '../core/finance';
import { applyHousingDayChanges, applyHousingSleepRecovery, refreshHousingMarket } from '../core/housing';
import { processMedicalTime } from '../core/healthcare';
import { processIntercityTime } from '../core/intercity';
import { getLocationById } from '../core/location';
import {
  applyNeedsDecay,
  describeNeedsDecay,
  getConditionTransitionMessages,
  type NeedsDecayProfile
} from '../core/needs';
import { processPhoneTime } from '../core/phone';
import { simulatePopulation } from '../core/population';
import { processSocialLifeTime } from '../core/social-life';
import { maybeActivateSocialEvent, processScheduledSocialEvents } from '../core/events';
import { applyBoxingRecovery } from '../core/sport';
import { fromTotalMinutes, getElapsedMinutes, getTotalMinutes } from '../core/time';
import { processUniversityTime } from '../core/university';
import { refreshVehicleMarket } from '../core/vehicles';
import { businessEquipment } from '../data/business/equipment';
import { businessMenuItems } from '../data/business/menu';
import { getBusinessPremisesById } from '../data/business/premises';
import { businessSupplies } from '../data/business/supplies';
import { getBusinessTypeById } from '../data/business/businessTypes';
import { businessUpgrades } from '../data/business/upgrades';
import { getDegreeProgramById, universitySubjects } from '../data/education/universities';
import { basicHousing, getHousingById } from '../data/housing/basicHousing';
import { getIntercityRouteById } from '../data/intercity/routes';
import { basicJobs } from '../data/jobs/basicJobs';
import { allLocations } from '../data/locations';
import { populationDataSource } from '../data/population/config';
import { socialMeetingTypes } from '../data/social/meetingTypes';
import { socialEventTemplates } from '../data/social/socialEventTemplates';
import { getMedicalServiceById } from '../data/healthcare/services';
import { usedVehicleListingTemplates } from '../data/vehicles/usedListingTemplates';
import type { PhoneNotificationId } from '../types/ids';
import type { NeedsState } from '../types/needs';
import type { Player } from '../types/player';
import type { GameTime } from '../types/time';
import type { GameState, LifeLogEntry, WorldState } from './gameState';
import { createLifeLogEntry } from './gameState';

export type AdvanceWorldTimeInput = {
  state: GameState;
  player: Player;
  nextTime: GameTime;
  decayProfile?: NeedsDecayProfile;
  worldOverride?: Partial<WorldState>;
  actionTitle?: string;
};

export type AdvanceWorldTimeResult = {
  player: Player;
  world: WorldState;
  population: WorldState['population'];
  social: WorldState['social'];
  housingMarket: WorldState['housingMarket'];
  business: WorldState['business'];
  phone: WorldState['phone'];
  finance: WorldState['finance'];
  vehicles: WorldState['vehicles'];
  medical: WorldState['medical'];
  intercity: WorldState['intercity'];
  university: WorldState['university'];
  lifeLogEntries: LifeLogEntry[];
  needsDelta?: Partial<NeedsState>;
  messages: string[];
};

export function mergeNeedsDelta(
  first: Partial<NeedsState> = {},
  second: Partial<NeedsState> = {}
): Partial<NeedsState> | undefined {
  const merged: Partial<NeedsState> = {
    hunger: (first.hunger ?? 0) + (second.hunger ?? 0),
    thirst: (first.thirst ?? 0) + (second.thirst ?? 0),
    energy: (first.energy ?? 0) + (second.energy ?? 0),
    health: (first.health ?? 0) + (second.health ?? 0),
    mood: (first.mood ?? 0) + (second.mood ?? 0)
  };
  const visibleEntries = Object.entries(merged).filter(([, value]) => value !== 0);
  return visibleEntries.length > 0
    ? Object.fromEntries(visibleEntries) as Partial<NeedsState>
    : undefined;
}

function processIntercityAndPhone(input: {
  intercity: WorldState['intercity'];
  phone: WorldState['phone'];
  currentTotalMinutes: number;
}): { intercity: WorldState['intercity']; phone: WorldState['phone'] } {
  const previous = input.intercity;
  const now = input.currentTotalMinutes;
  let intercity = processIntercityTime(previous, now);
  let phone = input.phone;

  const reminderIds = intercity.tickets
    .filter((ticket) => (
      ticket.status === 'booked'
      && !ticket.reminderSent
      && now >= ticket.departureTotalMinutes - 90
      && now < ticket.departureTotalMinutes
    ))
    .map((ticket) => ticket.id);

  if (reminderIds.length > 0) {
    intercity = {
      ...intercity,
      tickets: intercity.tickets.map((ticket) => reminderIds.includes(ticket.id)
        ? { ...ticket, reminderSent: true }
        : ticket)
    };
    for (const id of reminderIds) {
      const ticket = intercity.tickets.find((entry) => entry.id === id);
      const route = getIntercityRouteById(ticket?.routeId);
      const notificationId = (`notification_trip_reminder_${String(id)}`) as PhoneNotificationId;
      if (phone.notifications.some((entry) => entry.id === notificationId)) continue;
      phone = {
        ...phone,
        notifications: [{
          id: notificationId,
          appId: 'trips' as const,
          title: 'Скоро отправление',
          body: `${route?.title ?? 'Междугородняя поездка'} · через ${Math.max(1, Math.ceil(((ticket?.departureTotalMinutes ?? now) - now) / 60))} ч.`,
          createdAtTotalMinutes: now,
          read: false,
          locationId: route?.originTerminalLocationId,
          intercityRouteId: route?.id,
          intercityTicketId: id
        }, ...phone.notifications].slice(0, 80)
      };
    }
  }

  const missedIds = intercity.tickets
    .filter((ticket) => (
      ticket.status === 'missed'
      && previous.tickets.find((old) => old.id === ticket.id)?.status === 'booked'
    ))
    .map((ticket) => ticket.id);

  for (const id of missedIds) {
    const ticket = intercity.tickets.find((entry) => entry.id === id);
    const route = getIntercityRouteById(ticket?.routeId);
    const notificationId = (`notification_trip_missed_${String(id)}`) as PhoneNotificationId;
    if (phone.notifications.some((entry) => entry.id === notificationId)) continue;
    phone = {
      ...phone,
      notifications: [{
        id: notificationId,
        appId: 'trips' as const,
        title: 'Отправление пропущено',
        body: route?.title ?? 'Междугородняя поездка',
        createdAtTotalMinutes: now,
        read: false,
        locationId: route?.originTerminalLocationId,
        intercityRouteId: route?.id,
        intercityTicketId: id
      }, ...phone.notifications].slice(0, 80),
      calendarEvents: phone.calendarEvents.map((event) => (
        event.intercityTicketId === id && event.status === 'scheduled'
          ? { ...event, status: 'missed' as const }
          : event
      ))
    };
  }

  return { intercity, phone };
}

function processMedicalCalendar(input: {
  medical: WorldState['medical'];
  phone: WorldState['phone'];
  currentTotalMinutes: number;
}): WorldState['phone'] {
  const appointmentsById = new Map(input.medical.appointments.map((entry) => [String(entry.id), entry]));
  let phone = input.phone;
  let calendarChanged = false;
  const calendarEvents = phone.calendarEvents.map((event) => {
    if (!event.medicalAppointmentId) return event;
    const appointment = appointmentsById.get(String(event.medicalAppointmentId));
    if (!appointment || appointment.status === event.status) return event;
    calendarChanged = true;
    return {
      ...event,
      status: appointment.status === 'cancelled' ? 'missed' as const : appointment.status
    };
  });
  if (calendarChanged) phone = { ...phone, calendarEvents };

  for (const appointment of input.medical.appointments) {
    if (appointment.status !== 'scheduled') continue;
    const reminderId = (`notification_medical_reminder_${appointment.id}`) as PhoneNotificationId;
    const dueSoon = input.currentTotalMinutes >= appointment.startsAtTotalMinutes - 90
      && input.currentTotalMinutes <= appointment.startsAtTotalMinutes;
    if (!dueSoon || phone.notifications.some((entry) => entry.id === reminderId)) continue;
    const service = getMedicalServiceById(appointment.serviceId);
    phone = {
      ...phone,
      notifications: [{
        id: reminderId,
        appId: 'health' as const,
        title: 'Скоро приём',
        body: `${service?.name ?? 'Медицинский приём'} начнётся в ближайшие 90 минут.`,
        createdAtTotalMinutes: input.currentTotalMinutes,
        read: false,
        locationId: appointment.clinicLocationId,
        medicalServiceId: appointment.serviceId,
        medicalAppointmentId: appointment.id
      }, ...phone.notifications].slice(0, 80)
    };
  }

  return phone;
}

export function advanceWorldTime(input: AdvanceWorldTimeInput): AdvanceWorldTimeResult {
  const { state, nextTime } = input;
  const decayProfile = input.decayProfile ?? 'active';
  const sourceWorld: WorldState = { ...state.world, ...input.worldOverride };
  const elapsedMinutes = getElapsedMinutes(state.time, nextTime);
  const currentTotalMinutes = getTotalMinutes(nextTime);
  const lifeLogEntries: LifeLogEntry[] = [];
  const messages: string[] = [];

  const decayApplied = applyNeedsDecay(input.player.needs, elapsedMinutes, decayProfile);
  const decayMessage = describeNeedsDecay(decayApplied.delta);
  let nextPlayer: Player = { ...input.player, needs: decayApplied.needs };
  let housingMarket = sourceWorld.housingMarket;
  let comfortNeedsDelta: Partial<NeedsState> = {};

  if (decayMessage) {
    messages.push(decayMessage);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, 'Время', decayMessage));
  }

  const conditionMessages = getConditionTransitionMessages(state.player.needs, decayApplied.needs);
  if (conditionMessages.length > 0) {
    messages.push(...conditionMessages);
    lifeLogEntries.push(...conditionMessages.map((message) => (
      createLifeLogEntry({ time: nextTime }, 'Состояние', message)
    )));
  }

  const elapsedDays = Math.max(0, nextTime.day - state.time.day);
  if (elapsedDays > 0) {
    const housing = getHousingById(nextPlayer.housingId);
    if (housing) {
      const applied = applyHousingDayChanges({ player: nextPlayer, housing, elapsedDays });
      nextPlayer = applied.player;
      lifeLogEntries.push(...applied.events.map((event) => (
        createLifeLogEntry({ time: nextTime }, event.title, event.text)
      )));
    }
    housingMarket = refreshHousingMarket({
      market: housingMarket,
      day: nextTime.day,
      currentHousingId: nextPlayer.housingId,
      catalogue: basicHousing
    });
  }

  nextPlayer = {
    ...nextPlayer,
    boxing: applyBoxingRecovery(nextPlayer.boxing, elapsedMinutes, decayProfile)
  };

  if (decayProfile === 'sleeping') {
    const comfortApplied = applyHousingSleepRecovery({
      player: nextPlayer,
      housing: getHousingById(nextPlayer.housingId),
      elapsedMinutes
    });
    nextPlayer = comfortApplied.player;
    comfortNeedsDelta = comfortApplied.needsDelta;
    if (Object.keys(comfortNeedsDelta).length > 0 || comfortApplied.fatigueDelta < 0) {
      const parts = [
        comfortNeedsDelta.energy ? `энергия +${comfortNeedsDelta.energy}` : undefined,
        comfortNeedsDelta.mood ? `настроение +${comfortNeedsDelta.mood}` : undefined,
        comfortApplied.fatigueDelta < 0 ? `спортивная усталость ${comfortApplied.fatigueDelta}` : undefined
      ].filter((entry): entry is string => Boolean(entry));
      if (parts.length > 0) messages.push(`Комфорт жилья: ${parts.join(', ')}.`);
    }
  }

  const population = simulatePopulation({
    population: sourceWorld.population,
    fromTime: state.time,
    toTime: nextTime,
    locations: allLocations,
    getLocationProfile: populationDataSource.getLocationProfile
  });

  const ownedBusiness = sourceWorld.business.ownedBusiness;
  const businessApplied = simulateBusinessTime({
    world: sourceWorld.business,
    fromTime: state.time,
    toTime: nextTime,
    population,
    premises: getBusinessPremisesById(ownedBusiness?.premisesId),
    businessType: getBusinessTypeById(ownedBusiness?.typeId),
    equipment: businessEquipment,
    menuItems: businessMenuItems,
    supplies: businessSupplies,
    upgrades: businessUpgrades
  });
  for (const event of businessApplied.events) {
    messages.push(event.text);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, event.title, event.text));
  }

  let social = processScheduledSocialEvents({
    social: sourceWorld.social,
    currentDay: nextTime.day,
    npcs: population.npcs,
    templates: socialEventTemplates
  });
  const currentLocation = getLocationById(state.player.locationId);
  if (!social.activeEvent && elapsedMinutes >= 60 && currentLocation?.type === 'home') {
    const neighbors = population.npcs.filter((npc) => (
      npc.homeDistrictId === state.player.districtId && npc.activationDay <= nextTime.day
    ));
    const neighbor = neighbors[(nextTime.day + population.seed) % Math.max(1, neighbors.length)];
    if (neighbor) {
      social = maybeActivateSocialEvent({
        social,
        npc: neighbor,
        context: 'home',
        day: nextTime.day,
        eventWeight: 1,
        templates: socialEventTemplates
      });
    }
  }

  const medicalApplied = processMedicalTime({
    state: sourceWorld.medical,
    player: nextPlayer,
    fromTime: state.time,
    toTime: nextTime,
    profile: decayProfile
  });
  nextPlayer = medicalApplied.player;
  if (medicalApplied.messages.length > 0) {
    messages.push(...medicalApplied.messages);
    lifeLogEntries.push(...medicalApplied.messages.map((message) => (
      createLifeLogEntry({ time: nextTime }, 'Здоровье', message)
    )));
  }

  let phone = processPhoneTime({
    state: sourceWorld.phone,
    currentTotalMinutes,
    jobs: basicJobs,
    getEmployerName: (job) => getLocationById(job.locationId)?.name ?? 'Работодатель'
  });

  const socialLifeApplied = processSocialLifeTime({
    social,
    phone,
    currentTotalMinutes,
    npcs: population.npcs,
    locations: allLocations,
    meetingTypes: socialMeetingTypes
  });
  social = socialLifeApplied.social;
  phone = socialLifeApplied.phone;
  lifeLogEntries.push(...socialLifeApplied.messages.map((entry) => (
    createLifeLogEntry({ time: nextTime }, entry.title, entry.text)
  )));

  const previousUniversity = sourceWorld.university;
  const universityApplied = processUniversityTime({
    state: previousUniversity,
    fromTime: fromTotalMinutes(previousUniversity.lastProcessedTotalMinutes),
    toTime: nextTime,
    program: getDegreeProgramById(previousUniversity.enrollment?.programId),
    subjects: universitySubjects
  });
  lifeLogEntries.push(...universityApplied.messages.map((message) => (
    createLifeLogEntry({ time: nextTime }, 'Учёба', message)
  )));

  const intercityApplied = processIntercityAndPhone({
    intercity: sourceWorld.intercity,
    phone,
    currentTotalMinutes
  });
  phone = processMedicalCalendar({
    medical: medicalApplied.state,
    phone: intercityApplied.phone,
    currentTotalMinutes
  });

  const crossedDayWithExpense = nextTime.day > sourceWorld.finance.lastProcessedDay
    && nextPlayer.money < sourceWorld.finance.lastObservedBankBalance;
  const reconciledFinance = reconcileExternalBankBalance({
    state: sourceWorld.finance,
    bankBalance: nextPlayer.money,
    totalMinutes: currentTotalMinutes,
    actionTitle: crossedDayWithExpense
      ? 'Жильё и регулярные платежи'
      : input.actionTitle ?? state.lastResult?.actionName
  });
  const financeApplied = processFinanceDay({
    state: reconciledFinance,
    player: nextPlayer,
    currentDay: nextTime.day,
    totalMinutes: currentTotalMinutes
  });
  nextPlayer = financeApplied.player;
  lifeLogEntries.push(...financeApplied.messages.map((message) => (
    createLifeLogEntry({ time: nextTime }, 'Банк', message)
  )));

  const vehicles = refreshVehicleMarket({
    world: sourceWorld.vehicles,
    day: nextTime.day,
    templates: usedVehicleListingTemplates
  });

  const world: WorldState = {
    ...sourceWorld,
    population,
    social,
    housingMarket,
    business: businessApplied.world,
    phone,
    finance: financeApplied.state,
    vehicles,
    medical: medicalApplied.state,
    intercity: intercityApplied.intercity,
    university: universityApplied.state
  };

  return {
    player: nextPlayer,
    world,
    population: world.population,
    social: world.social,
    housingMarket: world.housingMarket,
    business: world.business,
    phone: world.phone,
    finance: world.finance,
    vehicles: world.vehicles,
    medical: world.medical,
    intercity: world.intercity,
    university: world.university,
    lifeLogEntries,
    needsDelta: mergeNeedsDelta(decayApplied.delta, comfortNeedsDelta),
    messages
  };
}
