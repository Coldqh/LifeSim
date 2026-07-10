import type { DistrictId } from '../../types/ids';
import type { Housing, HousingId, HousingMarketState } from '../../types/housing';

export const HOUSING_MARKET_REFRESH_DAYS = 4;
export const HOUSING_LISTINGS_PER_DISTRICT = 3;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getCycle(day: number): number {
  return Math.floor(Math.max(0, day - 1) / HOUSING_MARKET_REFRESH_DAYS);
}

function selectActiveHousingIds(input: {
  seed: number;
  day: number;
  currentHousingId: HousingId;
  catalogue: Housing[];
}): HousingId[] {
  const cycle = getCycle(input.day);
  const byDistrict = new Map<DistrictId, Housing[]>();

  input.catalogue.forEach((housing) => {
    if (housing.id === input.currentHousingId) return;
    const group = byDistrict.get(housing.districtId) ?? [];
    group.push(housing);
    byDistrict.set(housing.districtId, group);
  });

  return [...byDistrict.entries()]
    .flatMap(([districtId, housing]) => [...housing]
      .sort((left, right) => (
        hashString(`${input.seed}:${cycle}:${districtId}:${left.id}`)
        - hashString(`${input.seed}:${cycle}:${districtId}:${right.id}`)
      ))
      .slice(0, HOUSING_LISTINGS_PER_DISTRICT)
      .map((entry) => entry.id));
}

export function createHousingMarket(input: {
  seed: number;
  day: number;
  currentHousingId: HousingId;
  catalogue: Housing[];
}): HousingMarketState {
  return {
    seed: input.seed,
    lastRefreshDay: input.day,
    activeHousingIds: selectActiveHousingIds(input),
    viewedHousingIds: []
  };
}

export function refreshHousingMarket(input: {
  market: HousingMarketState;
  day: number;
  currentHousingId: HousingId;
  catalogue: Housing[];
}): HousingMarketState {
  const currentCycle = getCycle(input.market.lastRefreshDay);
  const nextCycle = getCycle(input.day);
  if (nextCycle <= currentCycle) return input.market;

  const activeHousingIds = selectActiveHousingIds({
    seed: input.market.seed,
    day: input.day,
    currentHousingId: input.currentHousingId,
    catalogue: input.catalogue
  });
  const activeSet = new Set(activeHousingIds);

  return {
    ...input.market,
    lastRefreshDay: input.day,
    activeHousingIds,
    viewedHousingIds: input.market.viewedHousingIds.filter((id) => activeSet.has(id)),
    scheduledViewingHousingId: input.market.scheduledViewingHousingId
      && activeSet.has(input.market.scheduledViewingHousingId)
      ? input.market.scheduledViewingHousingId
      : undefined
  };
}

export function scheduleHousingViewing(
  market: HousingMarketState,
  housingId: HousingId
): { market: HousingMarketState; ok: boolean; message: string } {
  if (!market.activeHousingIds.includes(housingId)) {
    return { market, ok: false, message: 'Объявление больше не активно.' };
  }

  return {
    market: { ...market, scheduledViewingHousingId: housingId },
    ok: true,
    message: 'Просмотр назначен. Доберись до адреса объявления.'
  };
}

export function markHousingViewed(
  market: HousingMarketState,
  housingId: HousingId
): HousingMarketState {
  return {
    ...market,
    scheduledViewingHousingId: market.scheduledViewingHousingId === housingId
      ? undefined
      : market.scheduledViewingHousingId,
    viewedHousingIds: market.viewedHousingIds.includes(housingId)
      ? market.viewedHousingIds
      : [...market.viewedHousingIds, housingId]
  };
}

export function isHousingListingActive(market: HousingMarketState, housingId: HousingId): boolean {
  return market.activeHousingIds.includes(housingId);
}

export function isHousingViewed(market: HousingMarketState, housingId: HousingId): boolean {
  return market.viewedHousingIds.includes(housingId);
}
