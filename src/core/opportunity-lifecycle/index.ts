import type { Job } from '../../types/job';
import type { CityId, JobId, NpcId, NpcRoleId } from '../../types/ids';
import type { Npc, NpcEmployment } from '../../types/npc';
import type {
  JobOpportunityListing,
  OpportunityHistoryEntry,
  OpportunityJobView,
  OpportunityPanelState,
  OpportunityWorldState
} from '../../types/opportunity';
import type { Weekday } from '../../types/time';

export type OpportunityLifecycleRules = {
  minOpenDays: number;
  maxOpenDays: number;
  minClosedDays: number;
  maxClosedDays: number;
  npcFillChancePercent: number;
  maxHistoryEntries: number;
};

const DEFAULT_WORKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rangeFromHash(key: string, min: number, max: number): number {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return low + (hashString(key) % Math.max(1, high - low + 1));
}

function createOpenListing(input: {
  job: Job;
  cityId: CityId;
  day: number;
  seed: number;
  rules: OpportunityLifecycleRules;
  openDaysDelta?: number;
}): JobOpportunityListing {
  const openDays = Math.max(1, rangeFromHash(
    `${input.seed}:${String(input.job.id)}:${input.day}:open`,
    input.rules.minOpenDays,
    input.rules.maxOpenDays
  ) + (input.openDaysDelta ?? 0));
  return {
    jobId: input.job.id,
    cityId: input.cityId,
    status: 'open',
    openedDay: input.day,
    closesDay: input.day + openDays
  };
}

export function createInitialOpportunityState(input: {
  seed: number;
  day: number;
  jobs: Job[];
  getJobCityId: (job: Job) => CityId | undefined;
  rules: OpportunityLifecycleRules;
}): OpportunityWorldState {
  const jobListings: Record<string, JobOpportunityListing> = {};
  for (const job of input.jobs) {
    const cityId = input.getJobCityId(job);
    if (!cityId) continue;
    jobListings[String(job.id)] = createOpenListing({
      job,
      cityId,
      day: input.day,
      seed: input.seed,
      rules: input.rules
    });
  }
  return {
    version: 1,
    seed: Math.max(1, Math.floor(input.seed)),
    lastProcessedDay: Math.max(1, Math.floor(input.day)),
    jobListings,
    history: []
  };
}

export function normalizeOpportunityState(input: {
  value: unknown;
  seed: number;
  day: number;
  jobs: Job[];
  getJobCityId: (job: Job) => CityId | undefined;
  rules: OpportunityLifecycleRules;
}): OpportunityWorldState {
  const initial = createInitialOpportunityState(input);
  if (!input.value || typeof input.value !== 'object') return initial;
  const candidate = input.value as Partial<OpportunityWorldState>;
  const rawListings = candidate.jobListings && typeof candidate.jobListings === 'object'
    ? candidate.jobListings
    : {};
  const jobListings: Record<string, JobOpportunityListing> = {};

  for (const job of input.jobs) {
    const cityId = input.getJobCityId(job);
    if (!cityId) continue;
    const raw = rawListings[String(job.id)];
    if (!raw || typeof raw !== 'object') {
      jobListings[String(job.id)] = initial.jobListings[String(job.id)];
      continue;
    }
    const status = raw.status === 'filled' || raw.status === 'closed' ? raw.status : 'open';
    const openedDay = Math.max(1, Math.floor(Number(raw.openedDay ?? input.day)));
    const closesDay = Math.max(openedDay + 1, Math.floor(Number(raw.closesDay ?? openedDay + input.rules.minOpenDays)));
    jobListings[String(job.id)] = {
      jobId: job.id,
      cityId,
      status,
      openedDay,
      closesDay,
      reopenDay: typeof raw.reopenDay === 'number' ? Math.max(openedDay + 1, Math.floor(raw.reopenDay)) : undefined,
      resolvedDay: typeof raw.resolvedDay === 'number' ? Math.max(openedDay, Math.floor(raw.resolvedDay)) : undefined,
      filledByNpcId: raw.filledByNpcId
    };
  }

  return {
    version: 1,
    seed: typeof candidate.seed === 'number' ? Math.max(1, Math.floor(candidate.seed)) : initial.seed,
    lastProcessedDay: typeof candidate.lastProcessedDay === 'number'
      ? Math.min(input.day, Math.max(1, Math.floor(candidate.lastProcessedDay)))
      : input.day,
    jobListings,
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, input.rules.maxHistoryEntries) : []
  };
}

function getEmploymentSchedule(job: Job): Pick<NpcEmployment, 'workdays' | 'startMinute' | 'endMinute'> {
  if (job.shiftSchedule?.kind === 'weekly') {
    const entries = Object.entries(job.shiftSchedule.days)
      .filter((entry): entry is [Weekday, NonNullable<typeof entry[1]>] => Boolean(entry[1]?.length));
    const firstWindow = entries[0]?.[1]?.[0];
    if (firstWindow) {
      return {
        workdays: entries.map(([weekday]) => weekday),
        startMinute: firstWindow.startMinute,
        endMinute: firstWindow.endMinute
      };
    }
  }
  return { workdays: DEFAULT_WORKDAYS, startMinute: 9 * 60, endMinute: 17 * 60 };
}

function selectNpcCandidate(input: {
  npcs: Npc[];
  cityId: CityId;
  day: number;
  job: Job;
  seed: number;
  getNpcCityId: (npc: Npc) => CityId | undefined;
}): Npc | undefined {
  const candidates = input.npcs.filter((npc) => (
    npc.activationDay <= input.day
    && !npc.employment
    && npc.activityProfile === 'unemployed'
    && input.getNpcCityId(npc) === input.cityId
  ));
  if (candidates.length === 0) return undefined;
  return [...candidates].sort((first, second) => {
    const searchDelta = second.life.jobSearchDays - first.life.jobSearchDays;
    if (searchDelta !== 0) return searchDelta;
    const reliabilityDelta = second.life.reliability - first.life.reliability;
    if (reliabilityDelta !== 0) return reliabilityDelta;
    const firstRoll = hashString(`${input.seed}:${String(input.job.id)}:${input.day}:${String(first.id)}`);
    const secondRoll = hashString(`${input.seed}:${String(input.job.id)}:${input.day}:${String(second.id)}`);
    return secondRoll - firstRoll;
  })[0];
}

function employNpc(input: { npc: Npc; job: Job; roleId: NpcRoleId; day: number }): Npc {
  const schedule = getEmploymentSchedule(input.job);
  return {
    ...input.npc,
    activityProfile: 'worker',
    employment: {
      locationId: input.job.locationId,
      roleId: input.roleId,
      ...schedule
    },
    life: {
      ...input.npc.life,
      jobSearchDays: 0,
      warningCount: 0,
      lastOutcome: {
        day: input.day,
        kind: 'worked',
        text: `Получил работу: ${input.job.title}.`
      }
    }
  };
}

function historyEntry(input: Omit<OpportunityHistoryEntry, 'id'>): OpportunityHistoryEntry {
  return {
    ...input,
    id: `opportunity_${input.kind}_${String(input.jobId)}_${input.day}`
  };
}

export function processOpportunityLifecycle(input: {
  state: OpportunityWorldState;
  fromDay: number;
  toDay: number;
  jobs: Job[];
  npcs: Npc[];
  protectedJobIds?: JobId[];
  getJobCityId: (job: Job) => CityId | undefined;
  getNpcCityId: (npc: Npc) => CityId | undefined;
  getNpcRoleId: (job: Job) => NpcRoleId;
  getJobLifecycleModifier?: (job: Job) => { openDaysDelta?: number; closedDaysDelta?: number; npcFillChanceDelta?: number };
  rules: OpportunityLifecycleRules;
}): { state: OpportunityWorldState; npcs: Npc[]; events: OpportunityHistoryEntry[] } {
  if (input.toDay <= input.state.lastProcessedDay) {
    return { state: input.state, npcs: input.npcs, events: [] };
  }

  const jobsById = new Map(input.jobs.map((job) => [String(job.id), job]));
  const protectedIds = new Set((input.protectedJobIds ?? []).map(String));
  let npcs = input.npcs;
  let listings = { ...input.state.jobListings };
  const events: OpportunityHistoryEntry[] = [];
  const startDay = Math.max(input.fromDay + 1, input.state.lastProcessedDay + 1);

  for (let day = startDay; day <= input.toDay; day += 1) {
    for (const [key, listing] of Object.entries(listings)) {
      const job = jobsById.get(key);
      if (!job) continue;

      if (listing.status !== 'open' && listing.reopenDay !== undefined && day >= listing.reopenDay) {
        const lifecycleModifier = input.getJobLifecycleModifier?.(job);
        const reopened = createOpenListing({ job, cityId: listing.cityId, day, seed: input.state.seed, rules: input.rules, openDaysDelta: lifecycleModifier?.openDaysDelta });
        listings[key] = reopened;
        events.push(historyEntry({
          day,
          kind: 'job_opened',
          jobId: job.id,
          cityId: listing.cityId,
          title: 'Появилась вакансия',
          text: `Работодатель снова ищет сотрудника: «${job.title}».`
        }));
        continue;
      }

      if (listing.status !== 'open' || day < listing.closesDay) continue;
      if (protectedIds.has(key)) {
        listings[key] = { ...listing, closesDay: day + 1 };
        continue;
      }

      const lifecycleModifier = input.getJobLifecycleModifier?.(job);
      const fillChance = Math.max(0, Math.min(100, input.rules.npcFillChancePercent + (lifecycleModifier?.npcFillChanceDelta ?? 0)));
      const fillRoll = hashString(`${input.state.seed}:${key}:${day}:fill`) % 100;
      const candidate = fillRoll < fillChance
        ? selectNpcCandidate({
            npcs,
            cityId: listing.cityId,
            day,
            job,
            seed: input.state.seed,
            getNpcCityId: input.getNpcCityId
          })
        : undefined;
      const closedDays = rangeFromHash(
        `${input.state.seed}:${key}:${day}:closed`,
        input.rules.minClosedDays,
        input.rules.maxClosedDays
      ) + (lifecycleModifier?.closedDaysDelta ?? 0);

      if (candidate) {
        const nextNpc = employNpc({ npc: candidate, job, roleId: input.getNpcRoleId(job), day });
        npcs = npcs.map((npc) => npc.id === candidate.id ? nextNpc : npc);
        listings[key] = {
          ...listing,
          status: 'filled',
          resolvedDay: day,
          reopenDay: day + Math.max(1, closedDays),
          filledByNpcId: candidate.id
        };
        events.push(historyEntry({
          day,
          kind: 'job_filled',
          jobId: job.id,
          cityId: listing.cityId,
          npcId: candidate.id,
          title: 'Вакансия занята',
          text: `${candidate.firstName} ${candidate.lastName} получил работу: «${job.title}».`
        }));
      } else {
        listings[key] = {
          ...listing,
          status: 'closed',
          resolvedDay: day,
          reopenDay: day + Math.max(1, closedDays),
          filledByNpcId: undefined
        };
        events.push(historyEntry({
          day,
          kind: 'job_closed',
          jobId: job.id,
          cityId: listing.cityId,
          title: 'Поиск сотрудника завершён',
          text: `Вакансия «${job.title}» больше не принимает отклики.`
        }));
      }
    }
  }

  const recentEvents = [...events].reverse();
  return {
    state: {
      ...input.state,
      lastProcessedDay: input.toDay,
      jobListings: listings,
      history: [...recentEvents, ...input.state.history].slice(0, input.rules.maxHistoryEntries)
    },
    npcs,
    events
  };
}

export function getJobOpportunityListing(state: OpportunityWorldState, jobId: JobId): JobOpportunityListing | undefined {
  return state.jobListings[String(jobId)];
}

export function isJobOpportunityOpen(state: OpportunityWorldState, jobId: JobId): boolean {
  return getJobOpportunityListing(state, jobId)?.status === 'open';
}

export function getJobOpportunityFailure(state: OpportunityWorldState, jobId: JobId): string | undefined {
  const listing = getJobOpportunityListing(state, jobId);
  if (!listing || listing.status === 'open') return undefined;
  return listing.status === 'filled'
    ? 'Вакансия уже занята другим кандидатом.'
    : 'Работодатель закрыл приём откликов.';
}

export function createOpportunityJobView(input: {
  state: OpportunityWorldState;
  jobId: JobId;
  currentDay: number;
  getNpcName?: (npcId: NpcId) => string | undefined;
}): OpportunityJobView {
  const listing = getJobOpportunityListing(input.state, input.jobId);
  if (!listing) {
    return { jobId: input.jobId, status: 'closed', available: false, label: 'Нет активной вакансии' };
  }
  if (listing.status === 'open') {
    const daysRemaining = Math.max(0, listing.closesDay - input.currentDay);
    return {
      jobId: input.jobId,
      status: 'open',
      available: true,
      label: daysRemaining <= 1 ? 'Закрывается сегодня' : `Открыта ещё ${daysRemaining} дн.`,
      daysRemaining
    };
  }
  const filledByNpcName = listing.filledByNpcId ? input.getNpcName?.(listing.filledByNpcId) : undefined;
  return {
    jobId: input.jobId,
    status: listing.status,
    available: false,
    label: listing.status === 'filled'
      ? filledByNpcName ? `Занята: ${filledByNpcName}` : 'Занята другим кандидатом'
      : 'Приём откликов закрыт',
    filledByNpcId: listing.filledByNpcId,
    filledByNpcName
  };
}

export function createOpportunityPanelState(input: {
  state: OpportunityWorldState;
  cityId: CityId;
}): OpportunityPanelState {
  const cityListings = Object.values(input.state.jobListings).filter((listing) => listing.cityId === input.cityId);
  return {
    openVacancyCount: cityListings.filter((listing) => listing.status === 'open').length,
    closedVacancyCount: cityListings.filter((listing) => listing.status !== 'open').length,
    recentChanges: input.state.history.filter((entry) => entry.cityId === input.cityId).slice(0, 6)
  };
}
