import { applyNeedsDelta } from '../needs';
import { addNpcMemory, applyRelationshipDelta, getNpcRelationship } from '../relationships';
import { getHouseholdDebt, getHouseholdFoodUnits } from '../household';
import { getDistrictById, getLocationById } from '../location';
import { getOrganizationDefinitionForJob } from '../organizations';
import { getDegreeProgramById, getJobById } from '../../data/cities/contentSelectors';
import { contextualStoryDefinitions, getContextualStoryDefinition } from '../../data/contextualStories';
import { organizationDefinitions } from '../../data/organizations';
import type {
  ActiveContextualStory,
  ContextualStoryChoice,
  ContextualStoryDefinition,
  ContextualStoryHistoryEntry,
  ContextualStoryPanelState,
  ContextualStoryState,
  ContextualStoryTrigger,
  ScheduledContextualStory
} from '../../types/contextualStory';
import type { DistrictEcosystemState, DistrictRuntimeState } from '../../types/districtEcosystem';
import type { HouseholdBillState, HouseholdState } from '../../types/household';
import type { NpcId, OrganizationId, UniversitySubjectId } from '../../types/ids';
import type { OrganizationDefinition, OrganizationRuntimeState, OrganizationWorldState } from '../../types/organization';
import type { Player } from '../../types/player';
import type { PopulationState } from '../../types/population';
import type { SocialState } from '../../types/socialEvent';
import type { UniversityState, UniversitySubjectProgress } from '../../types/university';

const MAX_ACTIVE_EVENTS = 2;
const MAX_HISTORY = 80;
const MAX_SCHEDULED = 30;
const MAX_COOLDOWNS = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function stringHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicUnit(key: string): number {
  return stringHash(key) / 4294967295;
}

export type ContextualStoryDomains = {
  player: Player;
  university: UniversityState;
  household: HouseholdState;
  social: SocialState;
  organizations: OrganizationWorldState;
  districtEcosystem: DistrictEcosystemState;
  population: PopulationState;
};

type StoryContext = {
  npcId?: NpcId;
  organizationId?: OrganizationId;
  districtId?: Player['districtId'];
  jobId?: Player['currentJobId'];
  score: number;
};

type StoryCandidate = { definition: ContextualStoryDefinition; context: StoryContext };

function chooseNpc<T extends { id: NpcId }>(entries: T[], key: string): T | undefined {
  if (!entries.length) return undefined;
  const ordered = [...entries].sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return ordered[Math.floor(deterministicUnit(key) * ordered.length)] ?? ordered[0];
}

function knownNpcs(domains: ContextualStoryDomains) {
  return domains.population.npcs.filter((npc) => {
    const relationship = domains.social.relationships[String(npc.id)];
    return Boolean(domains.social.contacts[String(npc.id)] || (relationship && (relationship.interactionCount > 0 || relationship.familiarity >= 8)));
  });
}

function currentJobOrganization(domains: ContextualStoryDomains): { definition?: OrganizationDefinition; state?: OrganizationRuntimeState } {
  const job = getJobById(domains.player.currentJobId);
  const definition = getOrganizationDefinitionForJob(organizationDefinitions, job);
  return { definition, state: definition ? domains.organizations.organizations[String(definition.id)] : undefined };
}

function triggerContext(trigger: ContextualStoryTrigger, domains: ContextualStoryDomains, day: number, seed: number): StoryContext | undefined {
  if (trigger === 'follow_up') return undefined;
  const job = getJobById(domains.player.currentJobId);
  const jobOrganization = currentJobOrganization(domains);
  const colleagues = job ? domains.population.npcs.filter((npc) => npc.employment?.locationId === job.locationId) : [];
  const known = knownNpcs(domains);
  const currentDistrict = domains.districtEcosystem.districts[String(domains.player.districtId)];
  const students = domains.population.npcs.filter((npc) => npc.activityProfile === 'student' && getDistrictById(npc.homeDistrictId)?.cityId === domains.player.cityId);
  const knownStudents = known.filter((npc) => npc.activityProfile === 'student');
  const universityPeer = chooseNpc(knownStudents.length ? knownStudents : students, `${seed}:${day}:${trigger}:student`);

  switch (trigger) {
    case 'work_understaffed': {
      const state = jobOrganization.state;
      const definition = jobOrganization.definition;
      if (!job || !state || !definition) return undefined;
      const shortage = Math.max(0, state.targetStaff - state.staffCount);
      if (state.status !== 'strained' && state.status !== 'critical' && shortage < 1) return undefined;
      return { jobId: job.id, organizationId: definition.id, npcId: chooseNpc(colleagues, `${seed}:${day}:understaffed`)?.id, districtId: domains.player.districtId, score: 75 + shortage * 8 + (state.status === 'critical' ? 20 : 0) };
    }
    case 'work_pay_delay': {
      const state = jobOrganization.state;
      const definition = jobOrganization.definition;
      if (!job || !state || !definition || state.status !== 'critical' || state.budget > 20_000) return undefined;
      return { jobId: job.id, organizationId: definition.id, districtId: domains.player.districtId, score: 98 };
    }
    case 'work_coworker_sick': {
      if (!job || !colleagues.length) return undefined;
      const sick = colleagues.filter((npc) => npc.life.health < 72 || (npc.life.sickUntilDay ?? 0) >= day);
      const npc = chooseNpc(sick.length ? sick : colleagues, `${seed}:${day}:coworker`);
      return npc ? { jobId: job.id, organizationId: jobOrganization.definition?.id, npcId: npc.id, districtId: domains.player.districtId, score: sick.length ? 78 : 48 } : undefined;
    }
    case 'university_peer_help':
      return domains.university.enrollment && universityPeer
        ? { npcId: universityPeer.id, districtId: domains.player.districtId, score: 60 + domains.university.enrollment.studyLoad * 0.2 }
        : undefined;
    case 'university_deadline_pressure': {
      const enrollment = domains.university.enrollment;
      if (!enrollment) return undefined;
      const urgent = enrollment.assignments.filter((entry) => !entry.completed && (entry.missed || entry.dueDay <= day + 2));
      return urgent.length ? { districtId: domains.player.districtId, score: 75 + urgent.length * 8 + enrollment.studyLoad * 0.15 } : undefined;
    }
    case 'university_campus_group':
      return domains.university.enrollment && universityPeer
        ? { npcId: universityPeer.id, districtId: domains.player.districtId, score: 42 + Math.max(0, 55 - domains.player.needs.mood) * 0.2 }
        : undefined;
    case 'housing_inspection':
      return domains.household.cleanliness < 62 ? { districtId: domains.player.districtId, score: 60 + (62 - domains.household.cleanliness) } : undefined;
    case 'housing_breakdown':
      return domains.household.activeBreakdown ? { districtId: domains.player.districtId, npcId: chooseNpc(known, `${seed}:${day}:neighbor`)?.id, score: 95 } : undefined;
    case 'housing_empty_pantry': {
      const foodUnits = getHouseholdFoodUnits(domains.household, day);
      return foodUnits <= 2 ? { districtId: domains.player.districtId, score: 78 + (2 - foodUnits) * 6 } : undefined;
    }
    case 'finance_emergency_expense':
      return domains.player.money >= 800 && getHouseholdDebt(domains.household) <= 5_000
        ? { districtId: domains.player.districtId, score: domains.player.money < 4_000 ? 62 : 36 }
        : undefined;
    case 'finance_short_gig':
      return domains.player.money < 8_000 || !domains.player.currentJobId
        ? { districtId: domains.player.districtId, score: 72 + (domains.player.currentJobId ? 0 : 15) }
        : undefined;
    case 'finance_debt_call': {
      const debt = domains.player.rentDebt + getHouseholdDebt(domains.household);
      return debt > 0 ? { districtId: domains.player.districtId, score: 85 + Math.min(15, debt / 1000) } : undefined;
    }
    case 'social_friend_loan': {
      const candidates = known.filter((npc) => getNpcRelationship(domains.social, npc.id).trust >= 18);
      const npc = chooseNpc(candidates, `${seed}:${day}:loan`);
      return npc && domains.player.money >= 1500 ? { npcId: npc.id, districtId: domains.player.districtId, score: 48 + getNpcRelationship(domains.social, npc.id).trust * 0.2 } : undefined;
    }
    case 'social_friend_job_loss': {
      const npc = chooseNpc(known.filter((candidate) => candidate.activityProfile === 'unemployed'), `${seed}:${day}:jobloss`);
      return npc ? { npcId: npc.id, districtId: domains.player.districtId, score: 66 } : undefined;
    }
    case 'social_missed_promise': {
      const tense = known.map((npc) => ({ npc, relation: getNpcRelationship(domains.social, npc.id) }))
        .filter((entry) => entry.relation.tension >= 24)
        .sort((left, right) => right.relation.tension - left.relation.tension)[0];
      return tense ? { npcId: tense.npc.id, districtId: domains.player.districtId, score: 70 + tense.relation.tension * 0.25 } : undefined;
    }
    case 'district_transport':
      return currentDistrict && currentDistrict.transportLoadIndex >= 108 ? { districtId: domains.player.districtId, score: 55 + currentDistrict.transportLoadIndex - 100 } : undefined;
    case 'district_cleanup':
      return currentDistrict && currentDistrict.servicesIndex <= 98 ? { districtId: domains.player.districtId, score: 46 + 100 - currentDistrict.servicesIndex } : undefined;
    case 'district_local_sale': {
      const definition = organizationDefinitions
        .filter((entry) => entry.kind === 'commerce' && getLocationById(entry.locationId)?.districtId === domains.player.districtId)
        .filter((entry) => {
          const state = domains.organizations.organizations[String(entry.id)];
          return state?.status === 'strained' || state?.status === 'critical' || (state?.closedUntilDay ?? 0) > day;
        })
        .sort((left, right) => String(left.id).localeCompare(String(right.id)))[0];
      return definition ? { organizationId: definition.id, districtId: domains.player.districtId, score: 74 } : undefined;
    }
    default:
      return undefined;
  }
}

function formatStoryText(text: string, context: StoryContext, domains: ContextualStoryDomains): string {
  const npc = context.npcId ? domains.population.npcs.find((entry) => entry.id === context.npcId) : undefined;
  const organization = context.organizationId ? organizationDefinitions.find((entry) => entry.id === context.organizationId) : undefined;
  const district = context.districtId ? getDistrictById(context.districtId) : undefined;
  return text
    .split('{npc}').join(npc ? `${npc.firstName} ${npc.lastName}` : 'Знакомый')
    .split('{organization}').join(organization?.name ?? 'Организация')
    .split('{district}').join(district?.name ?? 'Район');
}

function createActiveStory(input: { definition: ContextualStoryDefinition; context: StoryContext; day: number; seed: number; domains: ContextualStoryDomains; source: ActiveContextualStory['source'] }): ActiveContextualStory {
  const serial = stringHash(`${input.seed}:${input.definition.id}:${input.day}:${input.source}:${input.context.npcId ?? ''}`);
  return {
    id: `context_story_${input.definition.id}_${input.day}_${serial.toString(36)}`,
    templateId: input.definition.id,
    category: input.definition.category,
    tone: input.definition.tone,
    source: input.source,
    title: formatStoryText(input.definition.title, input.context, input.domains),
    text: formatStoryText(input.definition.text, input.context, input.domains),
    startedDay: input.day,
    dueDay: input.day + Math.max(1, input.definition.responseDays),
    defaultChoiceId: input.definition.defaultChoiceId,
    choices: input.definition.choices,
    npcId: input.context.npcId,
    organizationId: input.context.organizationId,
    districtId: input.context.districtId,
    jobId: input.context.jobId
  };
}

export function createInitialContextualStoryState(seed: number, day: number): ContextualStoryState {
  return { version: 1, seed: Math.max(1, Math.floor(seed)), lastProcessedDay: Math.max(1, Math.floor(day)), activeEvents: [], scheduledEvents: [], cooldowns: {}, history: [] };
}

export function normalizeContextualStoryState(value: unknown, seed: number, day: number): ContextualStoryState {
  const initial = createInitialContextualStoryState(seed, day);
  if (!value || typeof value !== 'object') return initial;
  const candidate = value as Partial<ContextualStoryState>;
  return {
    version: 1,
    seed: typeof candidate.seed === 'number' ? Math.max(1, Math.floor(candidate.seed)) : initial.seed,
    lastProcessedDay: typeof candidate.lastProcessedDay === 'number' ? Math.min(day, Math.max(1, Math.floor(candidate.lastProcessedDay))) : day,
    activeEvents: Array.isArray(candidate.activeEvents) ? candidate.activeEvents.filter(Boolean).slice(0, MAX_ACTIVE_EVENTS) : [],
    scheduledEvents: Array.isArray(candidate.scheduledEvents) ? candidate.scheduledEvents.filter(Boolean).slice(0, MAX_SCHEDULED) : [],
    cooldowns: candidate.cooldowns && typeof candidate.cooldowns === 'object'
      ? Object.fromEntries(Object.entries(candidate.cooldowns).filter(([, value]) => typeof value === 'number').slice(-MAX_COOLDOWNS))
      : {},
    history: Array.isArray(candidate.history) ? candidate.history.filter(Boolean).slice(0, MAX_HISTORY) : []
  };
}

function updateBill(bill: HouseholdBillState, amount: number): HouseholdBillState {
  if (amount >= 0) return { ...bill, debt: Math.max(0, Math.round(bill.debt + amount)) };
  let remaining = Math.abs(amount);
  const debtReduction = Math.min(bill.debt, remaining);
  remaining -= debtReduction;
  const accruedReduction = Math.min(bill.accrued, remaining);
  return { ...bill, debt: Math.max(0, Math.round(bill.debt - debtReduction)), accrued: Math.max(0, Math.round(bill.accrued - accruedReduction)) };
}

function applyChoiceEffects(domains: ContextualStoryDomains, event: ActiveContextualStory, choice: ContextualStoryChoice, day: number): ContextualStoryDomains {
  let next = domains;
  for (const effect of choice.effects) {
    if (effect.kind === 'money') {
      next = { ...next, player: { ...next.player, money: Math.max(0, Math.round(next.player.money + effect.amount)) } };
    } else if (effect.kind === 'needs') {
      next = { ...next, player: { ...next.player, needs: applyNeedsDelta(next.player.needs, effect.delta) } };
    } else if (effect.kind === 'job_experience' && next.player.currentJobId) {
      const jobId = next.player.currentJobId;
      next = { ...next, player: { ...next.player, jobExperience: { ...next.player.jobExperience, [jobId]: Math.max(0, (next.player.jobExperience[jobId] ?? 0) + effect.amount) } } };
    } else if (effect.kind === 'university_load' && next.university.enrollment) {
      next = { ...next, university: { ...next.university, enrollment: { ...next.university.enrollment, studyLoad: clamp(next.university.enrollment.studyLoad + effect.amount, 0, 100) } } };
    } else if (effect.kind === 'university_knowledge' && next.university.enrollment) {
      const enrollment = next.university.enrollment;
      const program = getDegreeProgramById(enrollment.programId);
      const subjectIds = program?.subjectIds ?? Object.keys(enrollment.subjectProgress) as UniversitySubjectId[];
      const targetId = [...subjectIds].sort((left, right) => (enrollment.subjectProgress[left]?.knowledge ?? 0) - (enrollment.subjectProgress[right]?.knowledge ?? 0))[0];
      if (targetId) {
        const current: UniversitySubjectProgress = enrollment.subjectProgress[targetId] ?? { classesAttended: 0, classesMissed: 0, assignmentsCompleted: 0, knowledge: 0 };
        next = { ...next, university: { ...next.university, enrollment: { ...enrollment, subjectProgress: { ...enrollment.subjectProgress, [targetId]: { ...current, knowledge: clamp(current.knowledge + effect.amount, 0, 100) } } } } };
      }
    } else if (effect.kind === 'household_cleanliness') {
      next = { ...next, household: { ...next.household, cleanliness: clamp(next.household.cleanliness + effect.amount, 0, 100) } };
    } else if (effect.kind === 'household_condition') {
      next = { ...next, household: { ...next.household, condition: clamp(next.household.condition + effect.amount, 0, 100), activeBreakdown: effect.clearBreakdown ? undefined : next.household.activeBreakdown } };
    } else if (effect.kind === 'household_food') {
      next = { ...next, household: { ...next.household, pantry: [{ id: `story_food_${event.id}_${day}_${next.household.pantry.length}`, productId: effect.productId, units: Math.max(1, Math.round(effect.units)), storedDay: day, expiresDay: day + Math.max(1, Math.round(effect.shelfLifeDays)) }, ...next.household.pantry].slice(0, 40) } };
    } else if (effect.kind === 'household_bill') {
      next = { ...next, household: { ...next.household, bills: next.household.bills.map((bill) => bill.kind === effect.billKind ? updateBill(bill, effect.amount) : bill) } };
    } else if (effect.kind === 'relationship' && event.npcId) {
      const current = getNpcRelationship(next.social, event.npcId);
      const changed = addNpcMemory({ ...applyRelationshipDelta(current, effect.delta), interactionCount: current.interactionCount + 1, firstMetDay: current.firstMetDay ?? day, lastInteractionDay: day }, { key: `${effect.memoryKey}:${event.templateId}`, day, text: effect.memoryText, tone: effect.memoryTone });
      next = { ...next, social: { ...next.social, relationships: { ...next.social.relationships, [String(event.npcId)]: changed } } };
    } else if (effect.kind === 'organization' && event.organizationId) {
      const key = String(event.organizationId);
      const current = next.organizations.organizations[key];
      if (current) {
        next = { ...next, organizations: { ...next.organizations, organizations: { ...next.organizations.organizations, [key]: { ...current, budget: clamp(current.budget + (effect.budgetDelta ?? 0), -500_000, 2_000_000), reputation: clamp(current.reputation + (effect.reputationDelta ?? 0), 0, 100), demandIndex: clamp(current.demandIndex + (effect.demandDelta ?? 0), 55, 150) } } } };
      }
    } else if (effect.kind === 'district' && event.districtId) {
      const key = String(event.districtId);
      const current = next.districtEcosystem.districts[key];
      if (current) {
        const updated: DistrictRuntimeState = { ...current, servicesIndex: clamp(current.servicesIndex + (effect.servicesDelta ?? 0), 55, 150), popularityIndex: clamp(current.popularityIndex + (effect.popularityDelta ?? 0), 55, 150), transportLoadIndex: clamp(current.transportLoadIndex + (effect.transportDelta ?? 0), 55, 150), revision: current.revision + 1 };
        next = { ...next, districtEcosystem: { ...next.districtEcosystem, districts: { ...next.districtEcosystem.districts, [key]: updated } } };
      }
    }
  }
  return next;
}

function requiredMoney(choice: ContextualStoryChoice): number {
  return choice.effects.reduce((sum, effect) => effect.kind === 'money' && effect.amount < 0 ? sum + Math.abs(effect.amount) : sum, 0);
}

export type ResolveContextualStoryResult = ContextualStoryDomains & { state: ContextualStoryState; historyEntry: ContextualStoryHistoryEntry; choice: ContextualStoryChoice; message: string; durationMinutes: number; moneyDelta: number };

export function resolveContextualStoryEvent(input: ContextualStoryDomains & { state: ContextualStoryState; eventId: string; choiceId: string; day: number; expired?: boolean }): ResolveContextualStoryResult | { failure: string } | undefined {
  const event = input.state.activeEvents.find((entry) => entry.id === input.eventId);
  if (!event) return undefined;
  const choice = event.choices.find((entry) => entry.id === input.choiceId);
  if (!choice || (choice.expiryOnly && !input.expired)) return { failure: 'Этот вариант уже недоступен.' };
  const moneyNeeded = requiredMoney(choice);
  if (!input.expired && moneyNeeded > input.player.money) return { failure: `Нужно ${moneyNeeded} ₽. Сейчас доступно ${input.player.money} ₽.` };

  const domains = applyChoiceEffects(input, event, choice, input.day);
  const scheduledEvents = choice.followUp ? [{ id: `context_followup_${event.id}_${choice.followUp.templateId}`, templateId: choice.followUp.templateId, dueDay: input.day + Math.max(1, choice.followUp.delayDays), npcId: event.npcId, organizationId: event.organizationId, districtId: event.districtId, jobId: event.jobId }, ...input.state.scheduledEvents].slice(0, MAX_SCHEDULED) : input.state.scheduledEvents;
  const historyEntry: ContextualStoryHistoryEntry = { id: `context_history_${event.id}_${input.day}_${choice.id}`, eventId: event.id, templateId: event.templateId, category: event.category, title: event.title, text: choice.resultText, startedDay: event.startedDay, resolvedDay: input.day, choiceId: choice.id, expired: Boolean(input.expired), npcId: event.npcId };
  return {
    ...domains,
    state: { ...input.state, activeEvents: input.state.activeEvents.filter((entry) => entry.id !== event.id), scheduledEvents, history: [historyEntry, ...input.state.history].slice(0, MAX_HISTORY) },
    historyEntry,
    choice,
    message: choice.resultText,
    durationMinutes: Math.max(0, Math.round(choice.durationMinutes ?? 0)),
    moneyDelta: domains.player.money - input.player.money
  };
}

function activateScheduled(state: ContextualStoryState, domains: ContextualStoryDomains, day: number): { state: ContextualStoryState; started: ActiveContextualStory[] } {
  let next = state;
  const started: ActiveContextualStory[] = [];
  const due = [...state.scheduledEvents].filter((entry) => entry.dueDay <= day).sort((left, right) => left.dueDay - right.dueDay);
  for (const scheduled of due) {
    if (next.activeEvents.length >= MAX_ACTIVE_EVENTS || started.length >= 2) break;
    next = { ...next, scheduledEvents: next.scheduledEvents.filter((entry) => entry.id !== scheduled.id) };
    const definition = getContextualStoryDefinition(scheduled.templateId);
    if (!definition) continue;
    const event = createActiveStory({ definition, context: { npcId: scheduled.npcId, organizationId: scheduled.organizationId, districtId: scheduled.districtId, jobId: scheduled.jobId, score: 100 }, day, seed: next.seed, domains, source: 'follow_up' });
    next = { ...next, activeEvents: [...next.activeEvents, event] };
    started.push(event);
  }
  return { state: next, started };
}

function selectRootCandidate(state: ContextualStoryState, domains: ContextualStoryDomains, day: number): StoryCandidate | undefined {
  const candidates = contextualStoryDefinitions
    .filter((definition) => definition.trigger !== 'follow_up')
    .filter((definition) => !state.activeEvents.some((event) => event.templateId === definition.id))
    .filter((definition) => !state.scheduledEvents.some((event) => event.templateId === definition.id))
    .filter((definition) => state.cooldowns[definition.id] === undefined || day - state.cooldowns[definition.id] >= definition.cooldownDays)
    .map((definition) => {
      const context = triggerContext(definition.trigger, domains, day, state.seed);
      return context ? { definition, context } : undefined;
    })
    .filter((entry): entry is StoryCandidate => Boolean(entry));
  if (!candidates.length) return undefined;
  const critical = candidates.filter((entry) => entry.definition.tone === 'critical');
  const pool = critical.length ? critical : candidates;
  if (!critical.length && deterministicUnit(`${state.seed}:${day}:contextual_story_roll`) > 0.72) return undefined;
  const top = [...pool].sort((left, right) => right.context.score - left.context.score || left.definition.id.localeCompare(right.definition.id)).slice(0, 4);
  return top[Math.floor(deterministicUnit(`${state.seed}:${day}:contextual_story_pick`) * top.length)] ?? top[0];
}

export type ProcessContextualStoryResult = ContextualStoryDomains & { state: ContextualStoryState; startedEvents: ActiveContextualStory[]; resolvedEntries: ContextualStoryHistoryEntry[] };

export function processContextualStoryTime(input: ContextualStoryDomains & { state: ContextualStoryState; fromDay: number; toDay: number }): ProcessContextualStoryResult {
  if (input.toDay <= input.state.lastProcessedDay) return { ...input, startedEvents: [], resolvedEntries: [] };
  let domains: ContextualStoryDomains = input;
  let state = input.state;
  const startedEvents: ActiveContextualStory[] = [];
  const resolvedEntries: ContextualStoryHistoryEntry[] = [];
  const startDay = Math.max(input.fromDay + 1, state.lastProcessedDay + 1);
  for (let day = startDay; day <= input.toDay; day += 1) {
    const expiredIds = state.activeEvents.filter((event) => day > event.dueDay).map((event) => event.id);
    for (const eventId of expiredIds) {
      const event = state.activeEvents.find((entry) => entry.id === eventId);
      if (!event) continue;
      const resolved = resolveContextualStoryEvent({ ...domains, state, eventId, choiceId: event.defaultChoiceId, day, expired: true });
      if (!resolved || 'failure' in resolved) continue;
      domains = resolved;
      state = resolved.state;
      resolvedEntries.push(resolved.historyEntry);
    }
    const scheduled = activateScheduled(state, domains, day);
    state = scheduled.state;
    startedEvents.push(...scheduled.started);
    const rootAlreadyStarted = state.activeEvents.some((event) => event.source === 'world' && event.startedDay === day);
    if (state.activeEvents.length < MAX_ACTIVE_EVENTS && !rootAlreadyStarted) {
      const candidate = selectRootCandidate(state, domains, day);
      if (candidate) {
        const event = createActiveStory({ definition: candidate.definition, context: candidate.context, day, seed: state.seed, domains, source: 'world' });
        state = { ...state, activeEvents: [...state.activeEvents, event], cooldowns: { ...state.cooldowns, [candidate.definition.id]: day } };
        startedEvents.push(event);
      }
    }
    state = { ...state, lastProcessedDay: day };
  }
  return { ...domains, state, startedEvents, resolvedEntries };
}

export function createContextualStoryPanelState(state: ContextualStoryState): ContextualStoryPanelState {
  return { activeEvents: [...state.activeEvents].sort((left, right) => left.dueDay - right.dueDay), recentHistory: state.history.slice(0, 8) };
}
