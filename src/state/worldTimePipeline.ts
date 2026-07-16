import { simulateBusinessTime } from '../core/business';
import { processCareerTime } from '../core/career';
import { processFinanceDay, reconcileExternalBankBalance } from '../core/finance';
import { applyHousingDayChanges, applyHousingSleepRecovery, refreshHousingMarket } from '../core/housing';
import { getHouseholdSleepPenalty, processHouseholdDays } from '../core/household';
import { processMedicalTime } from '../core/healthcare';
import { processIntercityTime } from '../core/intercity';
import { getLocationById } from '../core/location';
import {
  applyNeedsDecay,
  applyNeedsDelta,
  describeNeedsDecay,
  getConditionTransitionMessages,
  type NeedsDecayProfile
} from '../core/needs';
import { processPhoneTime, pushPhoneNotification } from '../core/phone';
import { processSocialLifeTime } from '../core/social-life';
import { expireActiveSocialEvent, maybeActivateSocialEvent, processScheduledSocialEvents } from '../core/events';
import { maybeActivateNpcStory } from '../core/npc-stories';
import { createSocialGroupMemberMap, maybeActivateSocialGroupEvent } from '../core/social-groups';
import { applyBoxingRecovery } from '../core/sport';
import { calculateAge, formatGameDate, fromTotalMinutes, getElapsedMinutes, getTotalMinutes } from '../core/time';
import { processUniversityTime } from '../core/university';
import { refreshVehicleMarket } from '../core/vehicles';
import { getRegionalCityIds, processWorldAtlasTime, simulateActiveCityPopulation } from '../core/world-atlas';
import { getWorldDynamicsModifiers, processWorldDynamicsTime } from '../core/world-dynamics';
import { isJobOpportunityOpen, processOpportunityLifecycle } from '../core/opportunity-lifecycle';
import { processNpcDailyPopulation } from '../core/npc-daily';
import { getBusinessCompetitionMultiplier, getOrganizationJobModifier, processOrganizationTime } from '../core/organizations';
import { businessEquipment } from '../data/business/equipment';
import {
  getAllHousing,
  getAllJobs,
  getAllUniversitySubjects,
  getBusinessPremisesById,
  getCareerCompanyById,
  getDegreeProgramById,
  getHousingById,
  getJobById,
  getMedicalServiceById,
  getUniversityById
} from '../data/cities/contentSelectors';
import { businessMenuItems } from '../data/business/menu';
import { businessSupplies } from '../data/business/supplies';
import { getBusinessTypeById } from '../data/business/businessTypes';
import { businessUpgrades } from '../data/business/upgrades';
import { getIntercityRouteById, intercityNetwork } from '../data/intercity/routes';
import { allLocations } from '../data/locations';
import { cityRegistry } from '../data/cities';
import { populationDataSource } from '../data/population/config';
import { socialMeetingTypes } from '../data/social/meetingTypes';
import { npcStoryChains } from '../data/social/npcStoryChains';
import { socialGroupDefinitions, socialGroupEventTemplates } from '../data/social/socialGroups';
import { socialEventTemplates } from '../data/social/socialEventTemplates';
import { getBoxingGymById } from '../data/sports';
import { usedVehicleListingTemplates } from '../data/vehicles/usedListingTemplates';
import { worldDynamicsTemplates } from '../data/worldDynamics';
import { jobCategoryNpcRoles, opportunityLifecycleRules } from '../data/opportunityLifecycle';
import { getOrganizationForJob, organizationDefinitions } from '../data/organizations';
import type { PhoneNotificationId } from '../types/ids';
import type { NeedsState } from '../types/needs';
import type { Player } from '../types/player';
import type { GameTime } from '../types/time';
import type { GameState, LifeLogEntry, WorldState } from './gameState';
import { createLifeLogEntry } from './gameState';

const housingCatalogue = getAllHousing();
const jobsCatalogue = getAllJobs();
const universitySubjectCatalogue = getAllUniversitySubjects();

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
  atlas: WorldState['atlas'];
  dynamics: WorldState['dynamics'];
  opportunities: WorldState['opportunities'];
  organizations: WorldState['organizations'];
  household: WorldState['household'];
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
  const previousAge = calculateAge(nextPlayer.birthDate, state.time.calendar);
  const currentAge = calculateAge(nextPlayer.birthDate, nextTime.calendar);
  nextPlayer = { ...nextPlayer, age: currentAge };
  if (currentAge > previousAge) {
    const birthdayMessage = `${formatGameDate(nextTime)}. Тебе исполнилось ${currentAge}.`;
    messages.push(birthdayMessage);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, 'День рождения', birthdayMessage));
  }
  const careerApplied = processCareerTime({ player: nextPlayer, currentDay: nextTime.day });
  nextPlayer = careerApplied.player;
  if (careerApplied.completedProbationJobId) {
    const completedJob = getJobById(careerApplied.completedProbationJobId);
    const probationMessage = `Испытательный срок завершён${completedJob ? `: ${completedJob.title}` : ''}.`;
    messages.push(probationMessage);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, 'Карьера', probationMessage));
  }
  let housingMarket = sourceWorld.housingMarket;
  let household = sourceWorld.household;
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
      const householdApplied = processHouseholdDays({ state: household, housing, player: nextPlayer, toDay: nextTime.day });
      household = householdApplied.state;
      nextPlayer = householdApplied.player;
      for (const event of householdApplied.events) {
        messages.push(event.text);
        lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, event.title, event.text));
      }
    }
    housingMarket = refreshHousingMarket({
      market: housingMarket,
      day: nextTime.day,
      currentHousingId: nextPlayer.housingId,
      catalogue: housingCatalogue
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
    const householdPenalty = getHouseholdSleepPenalty(household, elapsedMinutes);
    if (Object.keys(householdPenalty).length > 0) {
      const beforeHouseholdNeeds = nextPlayer.needs;
      const penalizedNeeds = applyNeedsDelta(beforeHouseholdNeeds, householdPenalty);
      nextPlayer = { ...nextPlayer, needs: penalizedNeeds };
      const actualPenalty = Object.fromEntries(Object.keys(householdPenalty).map((key) => {
        const typed = key as keyof NeedsState;
        return [typed, penalizedNeeds[typed] - beforeHouseholdNeeds[typed]];
      }).filter(([, value]) => value !== 0)) as Partial<NeedsState>;
      comfortNeedsDelta = mergeNeedsDelta(comfortNeedsDelta, actualPenalty) ?? {};
      messages.push('Состояние дома ухудшило качество сна.');
    }
    if (Object.keys(comfortNeedsDelta).length > 0 || comfortApplied.fatigueDelta < 0) {
      const parts = [
        comfortNeedsDelta.energy ? `энергия +${comfortNeedsDelta.energy}` : undefined,
        comfortNeedsDelta.mood ? `настроение +${comfortNeedsDelta.mood}` : undefined,
        comfortApplied.fatigueDelta < 0 ? `спортивная усталость ${comfortApplied.fatigueDelta}` : undefined
      ].filter((entry): entry is string => Boolean(entry));
      if (parts.length > 0) messages.push(`Комфорт жилья: ${parts.join(', ')}.`);
    }
  }

  const activeCityId = nextPlayer.cityId;
  const npcDailyApplied = processNpcDailyPopulation({
    population: sourceWorld.population,
    fromDay: state.time.day,
    toDay: nextTime.day,
    getNpcCityId: (npc) => cityRegistry.getDistrict(npc.homeDistrictId)?.cityId
      ?? cityRegistry.getLocation(npc.employment?.locationId)?.cityId
  });
  const visibleNpcDailyEvents = npcDailyApplied.events
    .filter((event) => event.cityId === activeCityId)
    .slice(-3);
  for (const event of visibleNpcDailyEvents) {
    messages.push(event.text);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, event.title, event.text));
  }

  let population = simulateActiveCityPopulation({
    population: npcDailyApplied.population,
    fromTime: state.time,
    toTime: nextTime,
    activeCityId,
    cityLocations: cityRegistry.getLocationsForCity(activeCityId),
    getLocationProfile: populationDataSource.getLocationProfile,
    getCityIdForDistrict: (districtId) => cityRegistry.getDistrict(districtId)?.cityId,
    getCityIdForLocation: (locationId) => cityRegistry.getLocation(locationId)?.cityId
  });
  const playerCurrentJob = getJobById(nextPlayer.currentJobId);
  const playerEnrollmentProgram = getDegreeProgramById(sourceWorld.university.enrollment?.programId);
  const organizationApplied = processOrganizationTime({
    state: sourceWorld.organizations,
    fromDay: state.time.day,
    toDay: nextTime.day,
    definitions: organizationDefinitions,
    npcs: population.npcs,
    playerJobLocationId: playerCurrentJob?.locationId,
    playerUniversityId: playerEnrollmentProgram?.universityId,
    getNpcCityId: (npc) => cityRegistry.getDistrict(npc.homeDistrictId)?.cityId ?? cityRegistry.getLocation(npc.employment?.locationId)?.cityId
  });
  population = { ...population, npcs: organizationApplied.npcs };
  const visibleOrganizationEvents = organizationApplied.events.filter((event) => event.cityId === activeCityId).slice(-5);
  for (const event of visibleOrganizationEvents) { messages.push(event.text); lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, event.title, event.text)); }
  const protectedJobIds = sourceWorld.phone.applications
    .filter((application) => application.status === 'invited')
    .map((application) => application.jobId);
  const opportunityApplied = processOpportunityLifecycle({
    state: sourceWorld.opportunities,
    fromDay: state.time.day,
    toDay: nextTime.day,
    jobs: jobsCatalogue,
    npcs: population.npcs,
    protectedJobIds,
    getJobCityId: (job) => cityRegistry.getLocation(job.locationId)?.cityId,
    getNpcCityId: (npc) => cityRegistry.getDistrict(npc.homeDistrictId)?.cityId
      ?? cityRegistry.getLocation(npc.employment?.locationId)?.cityId,
    getNpcRoleId: (job) => jobCategoryNpcRoles[job.category],
    getJobLifecycleModifier: (job) => getOrganizationJobModifier({ state: organizationApplied.state, definition: getOrganizationForJob(job.id) }),
    rules: opportunityLifecycleRules
  });
  population = { ...population, npcs: opportunityApplied.npcs };
  const visibleOpportunityEvents = opportunityApplied.events
    .filter((event) => event.cityId === activeCityId)
    .slice(-4);
  for (const event of visibleOpportunityEvents) {
    messages.push(event.text);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, event.title, event.text));
  }

  const regionalCityIds = getRegionalCityIds({
    activeCityId,
    routes: intercityNetwork.routes,
    roadConnections: intercityNetwork.roadConnections
  });
  const atlasApplied = processWorldAtlasTime({
    atlas: sourceWorld.atlas,
    cities: cityRegistry.cities,
    districts: cityRegistry.districts,
    locations: cityRegistry.locations,
    population,
    activeCityId,
    regionalCityIds,
    toTime: nextTime
  });
  const dynamicsApplied = processWorldDynamicsTime({
    state: sourceWorld.dynamics,
    fromDay: state.time.day,
    toDay: nextTime.day,
    activeCityId,
    atlas: atlasApplied.atlas,
    templates: worldDynamicsTemplates
  });
  const dynamicsModifiers = getWorldDynamicsModifiers(dynamicsApplied.state, activeCityId, nextTime.day);
  for (const news of [...dynamicsApplied.started, ...dynamicsApplied.ended]) {
    messages.push(news.text);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, news.title, news.text));
  }

  const ownedBusiness = sourceWorld.business.ownedBusiness;
  const ownedBusinessPremises = getBusinessPremisesById(ownedBusiness?.premisesId);
  const businessCompetitionMultiplier = getBusinessCompetitionMultiplier({ state: organizationApplied.state, definitions: organizationDefinitions, cityId: ownedBusinessPremises ? cityRegistry.getDistrict(ownedBusinessPremises.districtId)?.cityId : undefined, day: nextTime.day });
  const businessApplied = simulateBusinessTime({
    world: sourceWorld.business,
    fromTime: state.time,
    toTime: nextTime,
    population,
    premises: ownedBusinessPremises,
    businessType: getBusinessTypeById(ownedBusiness?.typeId),
    equipment: businessEquipment,
    menuItems: businessMenuItems,
    supplies: businessSupplies,
    upgrades: businessUpgrades,
    demandMultiplier: dynamicsModifiers.businessDemandMultiplier * businessCompetitionMultiplier
  });
  for (const event of businessApplied.events) {
    messages.push(event.text);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, event.title, event.text));
  }

  const expiredSocialEvent = expireActiveSocialEvent({
    social: sourceWorld.social,
    currentTotalMinutes,
    npcs: population.npcs
  });
  let social = expiredSocialEvent.social;
  if (expiredSocialEvent.message) {
    messages.push(expiredSocialEvent.message);
    lifeLogEntries.push(createLifeLogEntry({ time: nextTime }, 'История', expiredSocialEvent.message));
  }
  social = processScheduledSocialEvents({
    social,
    currentDay: nextTime.day,
    currentTotalMinutes,
    npcs: population.npcs,
    templates: socialEventTemplates
  });

  const currentJob = getJobById(nextPlayer.currentJobId);
  const enrolledProgram = getDegreeProgramById(sourceWorld.university.enrollment?.programId);
  const enrolledUniversity = getUniversityById(enrolledProgram?.universityId);
  const universityCityId = getLocationById(enrolledUniversity?.locationId)?.cityId;
  const boxingGym = getBoxingGymById(nextPlayer.boxing.membership?.gymId);
  const socialGroupMembers = createSocialGroupMemberMap({
    day: nextTime.day,
    universityCandidates: enrolledUniversity
      ? population.npcs.filter((npc) => (
          npc.activityProfile === 'student'
          && cityRegistry.getDistrict(npc.homeDistrictId)?.cityId === universityCityId
        ))
      : [],
    workCandidates: currentJob
      ? population.npcs.filter((npc) => npc.employment?.locationId === currentJob.locationId)
      : [],
    boxingCandidates: boxingGym
      ? population.npcs.filter((npc) => npc.employment?.locationId === boxingGym.locationId)
      : []
  });
  social = maybeActivateNpcStory({
    social,
    currentTotalMinutes,
    templates: socialEventTemplates,
    chains: npcStoryChains,
    universityCandidates: socialGroupMembers.university_group,
    workCandidates: socialGroupMembers.work_team,
    boxingCandidates: socialGroupMembers.boxing_gym
  });
  social = maybeActivateSocialGroupEvent({
    social,
    currentTotalMinutes,
    definitions: socialGroupDefinitions,
    templates: socialGroupEventTemplates,
    membersByGroup: socialGroupMembers
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
    jobs: jobsCatalogue,
    getEmployerName: (job) => getCareerCompanyById(job.companyId)?.name ?? getLocationById(job.locationId)?.name ?? 'Работодатель',
    isJobAvailable: (jobId) => isJobOpportunityOpen(opportunityApplied.state, jobId)
  });
  for (const event of visibleNpcDailyEvents) {
    phone = pushPhoneNotification(phone, {
      appId: 'contacts',
      title: event.title,
      body: event.text,
      createdAtTotalMinutes: currentTotalMinutes,
      npcId: event.npcId
    });
  }
  const appliedJobIds = new Set(sourceWorld.phone.applications.map((application) => String(application.jobId)));
  const savedJobIds = new Set(sourceWorld.phone.savedJobIds.map(String));
  for (const event of opportunityApplied.events) {
    const key = String(event.jobId);
    if (!savedJobIds.has(key) || appliedJobIds.has(key)) continue;
    const job = getJobById(event.jobId);
    phone = pushPhoneNotification(phone, {
      appId: 'jobs',
      title: event.title,
      body: job ? `${job.title} · ${event.text}` : event.text,
      createdAtTotalMinutes: currentTotalMinutes,
      jobId: event.jobId,
      locationId: job?.locationId
    });
  }

  for (const event of visibleOrganizationEvents) {
    phone = pushPhoneNotification(phone, { appId: 'today', title: event.title, body: event.text, createdAtTotalMinutes: currentTotalMinutes, locationId: organizationDefinitions.find((definition) => definition.id === event.organizationId)?.locationId });
  }

  for (const news of [...dynamicsApplied.started, ...dynamicsApplied.ended]) {
    phone = pushPhoneNotification(phone, {
      appId: 'today',
      title: news.title,
      body: news.text,
      createdAtTotalMinutes: currentTotalMinutes,
      worldNewsId: news.id
    });
  }

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
    subjects: universitySubjectCatalogue
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
    university: universityApplied.state,
    atlas: atlasApplied.atlas,
    dynamics: dynamicsApplied.state,
    opportunities: opportunityApplied.state,
    organizations: organizationApplied.state,
    household
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
    atlas: world.atlas,
    dynamics: world.dynamics,
    opportunities: world.opportunities,
    organizations: world.organizations,
    household: world.household,
    lifeLogEntries,
    needsDelta: mergeNeedsDelta(decayApplied.delta, comfortNeedsDelta),
    messages
  };
}
