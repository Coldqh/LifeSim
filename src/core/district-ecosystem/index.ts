import type { Housing } from '../../types/housing';
import type { Job } from '../../types/job';
import type { District, Location } from '../../types/location';
import type { Npc } from '../../types/npc';
import type { OpportunityWorldState } from '../../types/opportunity';
import type { OrganizationDefinition, OrganizationWorldState } from '../../types/organization';
import type { WorldAtlasState } from '../../types/worldAtlas';
import type {
  DistrictEcosystemModifiers,
  DistrictEcosystemPanelState,
  DistrictEcosystemState,
  DistrictEcosystemView,
  DistrictHistoryEntry,
  DistrictHistoryKind,
  DistrictRuntimeState,
  DistrictTrend
} from '../../types/districtEcosystem';
import type { CityId, DistrictId } from '../../types/ids';
import { districtEcosystemRules } from '../../data/districtEcosystem';

function clamp(value: number, minimum: number = districtEcosystemRules.minimumIndex, maximum: number = districtEcosystemRules.maximumIndex): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicDelta(seed: number, key: string, magnitude: number): number {
  const unit = ((hashString(key) ^ seed) >>> 0) / 4294967295;
  return Math.round((unit * 2 - 1) * magnitude);
}

function approach(previous: number, target: number, seed: number, key: string): number {
  const rawDelta = Math.round((target - previous) * 0.28) + deterministicDelta(seed, key, 1);
  const limited = Math.max(-districtEcosystemRules.maximumWeeklyDelta, Math.min(districtEcosystemRules.maximumWeeklyDelta, rawDelta));
  return Math.round(clamp(previous + limited));
}

function createBaseState(input: {
  district: District;
  day: number;
  seed: number;
  locations: readonly Location[];
  jobs: readonly Job[];
  housing: readonly Housing[];
  npcs: readonly Npc[];
}): DistrictRuntimeState {
  const districtLocations = input.locations.filter((location) => location.districtId === input.district.id);
  const jobCount = input.jobs.filter((job) => districtLocations.some((location) => location.id === job.locationId)).length;
  const housingCount = input.housing.filter((entry) => entry.districtId === input.district.id).length;
  const residents = input.npcs.filter((npc) => npc.homeDistrictId === input.district.id).length;
  const services = districtLocations.filter((location) => location.shopId || ['clinic', 'pharmacy', 'university', 'bank', 'cafe', 'restaurant', 'mall'].includes(location.type)).length;
  const key = String(input.district.id);

  return {
    districtId: input.district.id,
    cityId: input.district.cityId,
    costOfLivingIndex: clamp(84 + housingCount * 4 + services * 2 + deterministicDelta(input.seed, `${key}:cost`, 5)),
    housingDemandIndex: clamp(82 + residents * 2 - housingCount * 3 + deterministicDelta(input.seed, `${key}:housing`, 6)),
    jobAccessIndex: clamp(78 + jobCount * 7 + deterministicDelta(input.seed, `${key}:jobs`, 6)),
    popularityIndex: clamp(80 + districtLocations.length * 3 + services * 2 + deterministicDelta(input.seed, `${key}:popularity`, 6)),
    transportLoadIndex: clamp(72 + residents * 2 + districtLocations.length * 2 + deterministicDelta(input.seed, `${key}:transport`, 5)),
    servicesIndex: clamp(72 + services * 7 + deterministicDelta(input.seed, `${key}:services`, 5)),
    trend: 'stable',
    lastProcessedDay: input.day,
    revision: 0
  };
}

export function createInitialDistrictEcosystemState(input: {
  seed: number;
  day: number;
  districts: readonly District[];
  locations: readonly Location[];
  jobs: readonly Job[];
  housing: readonly Housing[];
  npcs: readonly Npc[];
}): DistrictEcosystemState {
  return {
    version: 1,
    seed: Math.max(1, Math.floor(input.seed)),
    lastProcessedDay: Math.max(1, Math.floor(input.day)),
    districts: Object.fromEntries(input.districts.map((district) => [String(district.id), createBaseState({ ...input, district })])),
    history: []
  };
}

export function normalizeDistrictEcosystemState(input: {
  value: unknown;
  seed: number;
  day: number;
  districts: readonly District[];
  locations: readonly Location[];
  jobs: readonly Job[];
  housing: readonly Housing[];
  npcs: readonly Npc[];
}): DistrictEcosystemState {
  const initial = createInitialDistrictEcosystemState(input);
  if (!input.value || typeof input.value !== 'object') return initial;
  const candidate = input.value as Partial<DistrictEcosystemState>;
  const rawDistricts = candidate.districts && typeof candidate.districts === 'object' ? candidate.districts : {};
  const districts: Record<string, DistrictRuntimeState> = {};

  for (const district of input.districts) {
    const fallback = initial.districts[String(district.id)];
    const raw = rawDistricts[String(district.id)];
    if (!raw || typeof raw !== 'object') {
      districts[String(district.id)] = fallback;
      continue;
    }
    const trend: DistrictTrend = raw.trend === 'rising' || raw.trend === 'declining' ? raw.trend : 'stable';
    districts[String(district.id)] = {
      districtId: district.id,
      cityId: district.cityId,
      costOfLivingIndex: clamp(Number(raw.costOfLivingIndex ?? fallback.costOfLivingIndex)),
      housingDemandIndex: clamp(Number(raw.housingDemandIndex ?? fallback.housingDemandIndex)),
      jobAccessIndex: clamp(Number(raw.jobAccessIndex ?? fallback.jobAccessIndex)),
      popularityIndex: clamp(Number(raw.popularityIndex ?? fallback.popularityIndex)),
      transportLoadIndex: clamp(Number(raw.transportLoadIndex ?? fallback.transportLoadIndex)),
      servicesIndex: clamp(Number(raw.servicesIndex ?? fallback.servicesIndex)),
      trend,
      lastProcessedDay: Math.min(input.day, Math.max(1, Math.floor(Number(raw.lastProcessedDay ?? input.day)))),
      revision: Math.max(0, Math.floor(Number(raw.revision ?? 0)))
    };
  }

  return {
    version: 1,
    seed: typeof candidate.seed === 'number' ? Math.max(1, Math.floor(candidate.seed)) : initial.seed,
    lastProcessedDay: typeof candidate.lastProcessedDay === 'number'
      ? Math.min(input.day, Math.max(1, Math.floor(candidate.lastProcessedDay)))
      : input.day,
    districts,
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, districtEcosystemRules.maximumHistoryEntries) : []
  };
}

function classifyTrend(input: { previous: DistrictRuntimeState; next: Omit<DistrictRuntimeState, 'trend'> }): DistrictTrend {
  const developmentDelta =
    (input.next.jobAccessIndex - input.previous.jobAccessIndex)
    + (input.next.popularityIndex - input.previous.popularityIndex)
    + (input.next.servicesIndex - input.previous.servicesIndex)
    + (input.next.housingDemandIndex - input.previous.housingDemandIndex) * 0.35
    - (input.next.transportLoadIndex - input.previous.transportLoadIndex) * 0.45;
  if (developmentDelta >= 5) return 'rising';
  if (developmentDelta <= -5) return 'declining';
  return 'stable';
}

function createHistoryEntry(input: Omit<DistrictHistoryEntry, 'id'>): DistrictHistoryEntry {
  return { ...input, id: `district_${input.kind}_${String(input.districtId)}_${input.day}` };
}

function chooseDistrictEvent(input: {
  previous: DistrictRuntimeState;
  next: DistrictRuntimeState;
  district: District;
  day: number;
  closedOrganizations: number;
}): DistrictHistoryEntry | undefined {
  const base = { day: input.day, districtId: input.district.id, cityId: input.district.cityId };
  if (input.closedOrganizations > 0 && input.next.servicesIndex < input.previous.servicesIndex - 2) {
    return createHistoryEntry({ ...base, kind: 'services_declined', title: `${input.district.name}: меньше доступных услуг`, text: `Закрытия заведений снизили качество повседневной инфраструктуры района.` });
  }
  if (input.next.transportLoadIndex >= 120 && input.previous.transportLoadIndex < 120) {
    return createHistoryEntry({ ...base, kind: 'transport_overloaded', title: `${input.district.name}: транспорт перегружен`, text: `Рост потока людей увеличил время поездок через район.` });
  }
  if (input.next.housingDemandIndex >= 115 && input.previous.housingDemandIndex < 115) {
    return createHistoryEntry({ ...base, kind: 'housing_tightened', title: `${input.district.name}: жильё дорожает`, text: `Спрос на аренду вырос. Новые договоры и регулярные платежи стали дороже.` });
  }
  if (input.next.housingDemandIndex <= 88 && input.previous.housingDemandIndex > 88) {
    return createHistoryEntry({ ...base, kind: 'housing_eased', title: `${input.district.name}: аренда стала доступнее`, text: `Спрос на жильё снизился, и район стал дешевле для арендаторов.` });
  }
  if (input.next.jobAccessIndex >= input.previous.jobAccessIndex + 5) {
    return createHistoryEntry({ ...base, kind: 'jobs_improved', title: `${input.district.name}: рынок труда растёт`, text: `Организации района чаще открывают вакансии и быстрее возвращаются к найму.` });
  }
  if (input.next.jobAccessIndex <= input.previous.jobAccessIndex - 5) {
    return createHistoryEntry({ ...base, kind: 'jobs_declined', title: `${input.district.name}: вакансий стало меньше`, text: `Слабый спрос и проблемы организаций сократили количество возможностей.` });
  }
  if (input.next.trend === 'rising' && input.previous.trend !== 'rising') {
    return createHistoryEntry({ ...base, kind: 'district_rising', title: `${input.district.name}: район развивается`, text: `Работа, сервисы и популярность района показывают устойчивый рост.` });
  }
  if (input.next.trend === 'declining' && input.previous.trend !== 'declining') {
    return createHistoryEntry({ ...base, kind: 'district_declining', title: `${input.district.name}: район теряет позиции`, text: `Сервисы, работа и привлекательность района ухудшились.` });
  }
  return undefined;
}

export function getDistrictEcosystemModifiers(state: DistrictEcosystemState, districtId: DistrictId | undefined): DistrictEcosystemModifiers {
  const district = districtId ? state.districts[String(districtId)] : undefined;
  if (!district) {
    return { rentMultiplier: 1, travelDurationMultiplier: 1, businessDemandMultiplier: 1, opportunityOpenDaysDelta: 0, opportunityClosedDaysDelta: 0, npcFillChanceDelta: 0, attractiveness: 100 };
  }
  const rentPressure = district.costOfLivingIndex * 0.52 + district.housingDemandIndex * 0.48;
  const businessStrength = district.popularityIndex * 0.5 + district.servicesIndex * 0.25 + district.jobAccessIndex * 0.25;
  const attractiveness = district.jobAccessIndex * 0.35 + district.servicesIndex * 0.25 + district.popularityIndex * 0.3 - district.costOfLivingIndex * 0.1;
  return {
    rentMultiplier: Math.round(clamp(rentPressure / 100, 0.78, 1.32) * 1000) / 1000,
    travelDurationMultiplier: Math.round(clamp(1 + (district.transportLoadIndex - 100) / 260, 0.84, 1.22) * 1000) / 1000,
    businessDemandMultiplier: Math.round(clamp(businessStrength / 100, 0.75, 1.3) * 1000) / 1000,
    opportunityOpenDaysDelta: Math.max(-2, Math.min(3, Math.round((district.jobAccessIndex - 100) / 22))),
    opportunityClosedDaysDelta: Math.max(-4, Math.min(4, -Math.round((district.jobAccessIndex - 100) / 16))),
    npcFillChanceDelta: Math.max(-15, Math.min(15, Math.round((district.popularityIndex - 100) / 4))),
    attractiveness: Math.round(attractiveness)
  };
}

export function getRouteDistrictDurationMultiplier(state: DistrictEcosystemState, fromDistrictId?: DistrictId, toDistrictId?: DistrictId): number {
  const from = getDistrictEcosystemModifiers(state, fromDistrictId).travelDurationMultiplier;
  const to = getDistrictEcosystemModifiers(state, toDistrictId).travelDurationMultiplier;
  return Math.round(((from + to) / 2) * 1000) / 1000;
}

export function processDistrictEcosystemTime(input: {
  state: DistrictEcosystemState;
  fromDay: number;
  toDay: number;
  districts: readonly District[];
  locations: readonly Location[];
  jobs: readonly Job[];
  housing: readonly Housing[];
  population: readonly Npc[];
  opportunities: OpportunityWorldState;
  organizations: OrganizationWorldState;
  organizationDefinitions: readonly OrganizationDefinition[];
  atlas: WorldAtlasState;
}): { state: DistrictEcosystemState; npcs: Npc[]; events: DistrictHistoryEntry[] } {
  if (input.toDay <= input.state.lastProcessedDay) return { state: input.state, npcs: [...input.population], events: [] };
  let states = { ...input.state.districts };
  let npcs = [...input.population];
  const events: DistrictHistoryEntry[] = [];
  const startDay = Math.max(input.fromDay + 1, input.state.lastProcessedDay + 1);

  for (let day = startDay; day <= input.toDay; day += 1) {
    if ((day - 1) % districtEcosystemRules.processIntervalDays !== 0 || day === 1) continue;
    for (const district of input.districts) {
      const previous = states[String(district.id)] ?? createBaseState({ ...input, district, day, seed: input.state.seed, npcs });
      const districtLocations = input.locations.filter((location) => location.districtId === district.id);
      const districtLocationIds = new Set(districtLocations.map((location) => String(location.id)));
      const districtJobs = input.jobs.filter((job) => districtLocationIds.has(String(job.locationId)));
      const openJobs = districtJobs.filter((job) => input.opportunities.jobListings[String(job.id)]?.status === 'open').length;
      const districtHousing = input.housing.filter((entry) => entry.districtId === district.id);
      const residents = npcs.filter((npc) => npc.homeDistrictId === district.id).length;
      const definitions = input.organizationDefinitions.filter((definition) => districtLocationIds.has(String(definition.locationId)));
      const runtime = definitions.map((definition) => input.organizations.organizations[String(definition.id)]).filter(Boolean);
      const growing = runtime.filter((entry) => entry.status === 'growing').length;
      const critical = runtime.filter((entry) => entry.status === 'critical').length;
      const closed = runtime.filter((entry) => entry.closedUntilDay !== undefined && day < (entry.closedUntilDay ?? day)).length;
      const averageDemand = runtime.length ? runtime.reduce((sum, entry) => sum + entry.demandIndex, 0) / runtime.length : 100;
      const cityAggregate = input.atlas.cityStates[String(district.cityId)]?.aggregate;
      const economyIndex = cityAggregate?.economyIndex ?? 100;
      const housingPressure = cityAggregate?.housingPressure ?? 100;
      const jobMarketIndex = cityAggregate?.jobMarketIndex ?? 100;
      const serviceLocations = districtLocations.filter((location) => location.shopId || ['clinic', 'pharmacy', 'university', 'bank', 'cafe', 'restaurant', 'mall'].includes(location.type)).length;

      const popularityTarget = clamp(64 + economyIndex * 0.16 + averageDemand * 0.16 + serviceLocations * 4 + growing * 4 - critical * 7 - closed * 8);
      const jobTarget = clamp(58 + jobMarketIndex * 0.25 + openJobs * 8 + growing * 5 - critical * 8);
      const servicesTarget = clamp(66 + serviceLocations * 6 + growing * 3 - critical * 7 - closed * 12);
      const housingTarget = clamp(62 + housingPressure * 0.28 + residents * 1.5 + popularityTarget * 0.15 - districtHousing.length * 5);
      const costTarget = clamp(58 + economyIndex * 0.22 + housingTarget * 0.27 + popularityTarget * 0.18 + averageDemand * 0.08);
      const transportTarget = clamp(58 + residents * 2.2 + districtLocations.length * 2.4 + popularityTarget * 0.18 + jobTarget * 0.1);

      const partial = {
        districtId: district.id,
        cityId: district.cityId,
        costOfLivingIndex: approach(previous.costOfLivingIndex, costTarget, input.state.seed, `${String(district.id)}:${day}:cost`),
        housingDemandIndex: approach(previous.housingDemandIndex, housingTarget, input.state.seed, `${String(district.id)}:${day}:housing`),
        jobAccessIndex: approach(previous.jobAccessIndex, jobTarget, input.state.seed, `${String(district.id)}:${day}:jobs`),
        popularityIndex: approach(previous.popularityIndex, popularityTarget, input.state.seed, `${String(district.id)}:${day}:popularity`),
        transportLoadIndex: approach(previous.transportLoadIndex, transportTarget, input.state.seed, `${String(district.id)}:${day}:transport`),
        servicesIndex: approach(previous.servicesIndex, servicesTarget, input.state.seed, `${String(district.id)}:${day}:services`),
        lastProcessedDay: day,
        revision: previous.revision + 1
      };
      const next: DistrictRuntimeState = { ...partial, trend: classifyTrend({ previous, next: partial }) };
      states[String(district.id)] = next;
      const event = chooseDistrictEvent({ previous, next, district, day, closedOrganizations: closed });
      if (event) events.push(event);
    }

    const districtsByCity = new Map<CityId, District[]>();
    for (const district of input.districts) {
      const rows = districtsByCity.get(district.cityId) ?? [];
      rows.push(district);
      districtsByCity.set(district.cityId, rows);
    }
    for (const [cityId, cityDistricts] of districtsByCity) {
      const ranked = cityDistricts
        .map((district) => ({ district, score: getDistrictEcosystemModifiers({ ...input.state, districts: states }, district.id).attractiveness }))
        .sort((left, right) => right.score - left.score);
      const destination = ranked[0];
      if (!destination) continue;
      const candidates = npcs.filter((npc) => {
        const currentDistrict = states[String(npc.homeDistrictId)];
        return currentDistrict?.cityId === cityId
          && npc.homeDistrictId !== destination.district.id
          && getDistrictEcosystemModifiers({ ...input.state, districts: states }, npc.homeDistrictId).attractiveness <= destination.score - districtEcosystemRules.migrationAttractivenessGap
          && (npc.activityProfile === 'unemployed' || npc.life.jobSearchDays >= 5 || Boolean(npc.employment));
      });
      const candidate = [...candidates].sort((left, right) => hashString(`${input.state.seed}:${day}:${String(left.id)}`) - hashString(`${input.state.seed}:${day}:${String(right.id)}`))[0];
      if (!candidate || hashString(`${input.state.seed}:${day}:${String(candidate.id)}:move`) % 100 >= districtEcosystemRules.migrationChancePercent) continue;
      npcs = npcs.map((npc) => npc.id === candidate.id ? { ...npc, homeDistrictId: destination.district.id } : npc);
      events.push(createHistoryEntry({ day, kind: 'npc_moved', districtId: destination.district.id, cityId, npcId: candidate.id, title: 'Житель сменил район', text: `${candidate.firstName} ${candidate.lastName} переехал в район «${destination.district.name}» ради работы и более удобной жизни.` }));
    }
  }

  return {
    state: {
      ...input.state,
      lastProcessedDay: input.toDay,
      districts: states,
      history: [...events].reverse().concat(input.state.history).slice(0, districtEcosystemRules.maximumHistoryEntries)
    },
    npcs,
    events
  };
}

const TREND_LABELS: Record<DistrictTrend, string> = { rising: 'Развивается', stable: 'Стабильно', declining: 'Снижается' };
const TREND_DESCRIPTIONS: Record<DistrictTrend, string> = {
  rising: 'Работа, сервисы и привлекательность района растут.',
  stable: 'Район меняется медленно и сохраняет текущий уровень.',
  declining: 'Возможностей и доступных сервисов становится меньше.'
};

function createView(state: DistrictRuntimeState, districtName: string, world: DistrictEcosystemState): DistrictEcosystemView {
  return { state, districtName, trendLabel: TREND_LABELS[state.trend], trendDescription: TREND_DESCRIPTIONS[state.trend], modifiers: getDistrictEcosystemModifiers(world, state.districtId) };
}

export function createDistrictEcosystemPanelState(input: {
  state: DistrictEcosystemState;
  cityId: CityId;
  currentDistrictId?: DistrictId;
  districts: readonly District[];
}): DistrictEcosystemPanelState {
  const districtNames = new Map(input.districts.map((district) => [String(district.id), district.name]));
  const districts = Object.values(input.state.districts)
    .filter((entry) => entry.cityId === input.cityId)
    .map((entry) => createView(entry, districtNames.get(String(entry.districtId)) ?? 'Район', input.state))
    .sort((left, right) => right.modifiers.attractiveness - left.modifiers.attractiveness);
  return {
    current: input.currentDistrictId ? districts.find((entry) => entry.state.districtId === input.currentDistrictId) : undefined,
    districts,
    recentChanges: input.state.history.filter((entry) => entry.cityId === input.cityId).slice(0, 10)
  };
}
