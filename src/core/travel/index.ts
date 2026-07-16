import { adjustActivityNeedsDelta, getNeedsRequirementFailure } from '../needs';
import type { District, Location } from '../../types/location';
import type { NeedsState } from '../../types/needs';
import type { DistrictTravelOption, LocationTravelOption, TransportOption, TravelResult } from '../../types/travel';
import type { TravelModeId } from '../../types/transport';

const SAME_LOCATION_DURATION_MINUTES = 0;
const SAME_DISTRICT_FALLBACK_MINUTES = 20;
const CROSS_DISTRICT_DURATION_MINUTES = 45;

const TRANSPORT_LABELS: Record<TravelModeId, { name: string; description: string }> = {
  walk: {
    name: 'Пешком',
    description: 'Бесплатно, но тратит энергию.'
  },
  bus: {
    name: 'Автобус',
    description: 'Основной транспорт внутри района.'
  },
  metro: {
    name: 'Метро',
    description: 'Быстрый способ добраться между районами.'
  },
  taxi: {
    name: 'Такси',
    description: 'Быстро, но дорого.'
  },
  car: {
    name: 'Личный автомобиль',
    description: 'Доступен после покупки автомобиля.'
  }
};

type TravelContext = {
  playerMoney: number;
  playerNeeds: NeedsState;
  publicTransportDurationMultiplier?: number;
  districtDurationMultiplier?: number;
  getDistrictDurationMultiplier?: (fromDistrictId: District['id'], toDistrictId: District['id']) => number;
};

function getSameDistrictDuration(fromLocation: Location, toLocation: Location): number {
  if (fromLocation.id === toLocation.id) return SAME_LOCATION_DURATION_MINUTES;

  const pairKey = [fromLocation.type, toLocation.type].sort().join(':');

  const pairDurations: Record<string, number> = {
    'home:shop': 15,
    'cafe:home': 20,
    'cafe:shop': 10,
    'business_center:workplace': 12,
    'park:sport_ground': 18
  };

  if (pairDurations[pairKey] !== undefined) {
    return pairDurations[pairKey];
  }

  if (fromLocation.type === 'park' || toLocation.type === 'park') return 25;
  if (fromLocation.type === 'sport_ground' || toLocation.type === 'sport_ground') return 25;
  if (fromLocation.type === 'workplace' || toLocation.type === 'workplace') return 18;
  if (fromLocation.type === 'business_center' || toLocation.type === 'business_center') return 18;

  return SAME_DISTRICT_FALLBACK_MINUTES;
}

export function getTravelDurationMinutes(fromLocation: Location, toLocation: Location): number {
  if (fromLocation.id === toLocation.id) return SAME_LOCATION_DURATION_MINUTES;

  if (fromLocation.districtId !== toLocation.districtId) {
    return CROSS_DISTRICT_DURATION_MINUTES;
  }

  return getSameDistrictDuration(fromLocation, toLocation);
}

function getWalkEnergyCost(baseDurationMinutes: number, isCrossDistrict: boolean): number {
  if (isCrossDistrict) {
    return Math.max(18, Math.round(baseDurationMinutes * 0.55));
  }

  return Math.max(3, Math.round(baseDurationMinutes * 0.25));
}

function getBusDuration(baseDurationMinutes: number, isCrossDistrict: boolean): number {
  const multiplier = isCrossDistrict ? 0.9 : 0.62;
  return Math.max(isCrossDistrict ? 30 : 7, Math.round(baseDurationMinutes * multiplier));
}

function getMetroDuration(baseDurationMinutes: number): number {
  return Math.max(18, Math.round(baseDurationMinutes * 0.58));
}

function getTaxiDuration(baseDurationMinutes: number, isCrossDistrict: boolean): number {
  const multiplier = isCrossDistrict ? 0.48 : 0.45;
  return Math.max(isCrossDistrict ? 14 : 5, Math.round(baseDurationMinutes * multiplier));
}

function getTaxiCost(baseDurationMinutes: number, isCrossDistrict: boolean): number {
  const baseCost = isCrossDistrict ? 520 : 230;
  const perMinuteCost = isCrossDistrict ? 9 : 8;
  return baseCost + baseDurationMinutes * perMinuteCost;
}

function withAvailability(option: Omit<TransportOption, 'available' | 'unavailableReason'>, context: TravelContext): TransportOption {
  const energyCost = Math.abs(option.needsDelta?.energy ?? 0);

  if (option.moneyCost > context.playerMoney) {
    return {
      ...option,
      available: false,
      unavailableReason: `Деньги: ${context.playerMoney}/${option.moneyCost} ₽.`
    };
  }

  if (option.modeId === 'walk') {
    const needsFailure = getNeedsRequirementFailure(context.playerNeeds, {
      minEnergy: energyCost,
      minHealth: 15
    });

    if (needsFailure) {
      return {
        ...option,
        available: false,
        unavailableReason: needsFailure
      };
    }
  }

  return {
    ...option,
    available: true
  };
}

export function createTransportOptions(input: {
  baseDurationMinutes: number;
  isCrossDistrict: boolean;
  context: TravelContext;
}): TransportOption[] {
  const { baseDurationMinutes, isCrossDistrict, context } = input;

  if (baseDurationMinutes <= 0) return [];
  const effectiveBaseDurationMinutes = Math.max(1, Math.round(baseDurationMinutes * Math.max(0.75, Math.min(1.3, context.districtDurationMultiplier ?? 1))));

  const walkEnergyCost = getWalkEnergyCost(effectiveBaseDurationMinutes, isCrossDistrict);
  const walkNeedsDelta = adjustActivityNeedsDelta(
    context.playerNeeds,
    { energy: -walkEnergyCost },
    { scaleEnergyCost: true }
  );

  const publicTransportDurationMultiplier = Math.max(1, Math.min(1.75, context.publicTransportDurationMultiplier ?? 1));
  const applyPublicTransportDelay = (modeId: TravelModeId, durationMinutes: number): number => (
    modeId === 'bus' || modeId === 'metro' || modeId === 'taxi'
      ? Math.max(1, Math.round(durationMinutes * publicTransportDurationMultiplier))
      : durationMinutes
  );

  const rawOptions: Omit<TransportOption, 'available' | 'unavailableReason'>[] = [
    {
      modeId: 'walk',
      name: TRANSPORT_LABELS.walk.name,
      description: TRANSPORT_LABELS.walk.description,
      durationMinutes: isCrossDistrict ? effectiveBaseDurationMinutes * 2 : effectiveBaseDurationMinutes,
      moneyCost: 0,
      needsDelta: walkNeedsDelta
    },
    ...(!isCrossDistrict
      ? [{
          modeId: 'bus' as const,
          name: TRANSPORT_LABELS.bus.name,
          description: TRANSPORT_LABELS.bus.description,
          durationMinutes: applyPublicTransportDelay('bus', getBusDuration(effectiveBaseDurationMinutes, false)),
          moneyCost: 60
        }]
      : [{
          modeId: 'metro' as const,
          name: TRANSPORT_LABELS.metro.name,
          description: TRANSPORT_LABELS.metro.description,
          durationMinutes: applyPublicTransportDelay('metro', getMetroDuration(effectiveBaseDurationMinutes)),
          moneyCost: 65
        }, {
          modeId: 'bus' as const,
          name: TRANSPORT_LABELS.bus.name,
          description: 'Дешевле такси, но медленнее метро.',
          durationMinutes: applyPublicTransportDelay('bus', getBusDuration(effectiveBaseDurationMinutes, true)),
          moneyCost: 75
        }]),
    {
      modeId: 'taxi',
      name: TRANSPORT_LABELS.taxi.name,
      description: TRANSPORT_LABELS.taxi.description,
      durationMinutes: applyPublicTransportDelay('taxi', getTaxiDuration(effectiveBaseDurationMinutes, isCrossDistrict)),
      moneyCost: getTaxiCost(effectiveBaseDurationMinutes, isCrossDistrict)
    }
  ];

  return rawOptions.map((option) => withAvailability(option, context));
}

function getTransportOption(input: {
  fromLocation: Location;
  toLocation: Location;
  modeId: TravelModeId;
  context: TravelContext;
}): TransportOption | undefined {
  const { fromLocation, toLocation, modeId, context } = input;
  const baseDurationMinutes = getTravelDurationMinutes(fromLocation, toLocation);
  const options = createTransportOptions({
    baseDurationMinutes,
    isCrossDistrict: fromLocation.districtId !== toLocation.districtId,
    context
  });

  return options.find((option) => option.modeId === modeId);
}

export function calculateLocationTravel(input: {
  fromLocation: Location | undefined;
  toLocation: Location | undefined;
  modeId: TravelModeId;
  context: TravelContext;
}): TravelResult {
  const { fromLocation, toLocation, modeId, context } = input;

  if (!fromLocation || !toLocation) {
    return {
      ok: false,
      kind: 'location',
      durationMinutes: 0,
      message: 'Маршрут не найден.'
    };
  }

  if (fromLocation.id === toLocation.id) {
    return {
      ok: false,
      kind: 'location',
      durationMinutes: 0,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toLocation.districtId,
      message: 'Ты уже находишься в этом месте.'
    };
  }

  const option = getTransportOption({ fromLocation, toLocation, modeId, context });

  if (!option) {
    return {
      ok: false,
      kind: 'location',
      durationMinutes: 0,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toLocation.districtId,
      message: 'Способ перемещения не найден.'
    };
  }

  if (!option.available) {
    return {
      ok: false,
      kind: 'location',
      modeId: option.modeId,
      modeName: option.name,
      durationMinutes: 0,
      moneyCost: option.moneyCost,
      needsDelta: option.needsDelta,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toLocation.districtId,
      message: option.unavailableReason ?? 'Этот способ перемещения недоступен.'
    };
  }

  return {
    ok: true,
    kind: 'location',
    modeId: option.modeId,
    modeName: option.name,
    durationMinutes: option.durationMinutes,
    moneyCost: option.moneyCost,
    needsDelta: option.needsDelta,
    fromLocationId: fromLocation.id,
    toLocationId: toLocation.id,
    fromDistrictId: fromLocation.districtId,
    toDistrictId: toLocation.districtId,
    message: `Ты добрался до места «${toLocation.name}». Способ: ${option.name}. Потрачено ${option.durationMinutes} мин${option.moneyCost > 0 ? ` и ${option.moneyCost} ₽` : ''}.`
  };
}

export function calculateDistrictTravel(input: {
  fromLocation: Location | undefined;
  toDistrict: District | undefined;
  toLocation: Location | undefined;
  modeId: TravelModeId;
  context: TravelContext;
}): TravelResult {
  const { fromLocation, toDistrict, toLocation, modeId, context } = input;

  if (!fromLocation || !toDistrict || !toLocation) {
    return {
      ok: false,
      kind: 'district',
      durationMinutes: 0,
      message: 'Район или точка прибытия не найдены.'
    };
  }

  if (fromLocation.districtId === toDistrict.id) {
    return {
      ok: false,
      kind: 'district',
      durationMinutes: 0,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toDistrict.id,
      message: 'Ты уже находишься в этом районе.'
    };
  }

  const option = getTransportOption({ fromLocation, toLocation, modeId, context });

  if (!option) {
    return {
      ok: false,
      kind: 'district',
      durationMinutes: 0,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toDistrict.id,
      message: 'Способ перемещения не найден.'
    };
  }

  if (!option.available) {
    return {
      ok: false,
      kind: 'district',
      modeId: option.modeId,
      modeName: option.name,
      durationMinutes: 0,
      moneyCost: option.moneyCost,
      needsDelta: option.needsDelta,
      fromLocationId: fromLocation.id,
      toLocationId: toLocation.id,
      fromDistrictId: fromLocation.districtId,
      toDistrictId: toDistrict.id,
      message: option.unavailableReason ?? 'Этот способ перемещения недоступен.'
    };
  }

  return {
    ok: true,
    kind: 'district',
    modeId: option.modeId,
    modeName: option.name,
    durationMinutes: option.durationMinutes,
    moneyCost: option.moneyCost,
    needsDelta: option.needsDelta,
    fromLocationId: fromLocation.id,
    toLocationId: toLocation.id,
    fromDistrictId: fromLocation.districtId,
    toDistrictId: toDistrict.id,
    message: `Ты добрался в район «${toDistrict.name}» и оказался в месте «${toLocation.name}». Способ: ${option.name}. Потрачено ${option.durationMinutes} мин${option.moneyCost > 0 ? ` и ${option.moneyCost} ₽` : ''}.`
  };
}

export function createLocationTravelOptions(
  currentLocation: Location | undefined,
  locations: Location[],
  context: TravelContext
): LocationTravelOption[] {
  return locations.map((location) => {
    const baseDurationMinutes = currentLocation ? getTravelDurationMinutes(currentLocation, location) : 0;
    const districtDurationMultiplier = currentLocation
      ? context.getDistrictDurationMultiplier?.(currentLocation.districtId, location.districtId) ?? context.districtDurationMultiplier ?? 1
      : 1;
    const durationMinutes = Math.max(0, Math.round(baseDurationMinutes * districtDurationMultiplier));

    return {
      location,
      durationMinutes,
      isCurrent: currentLocation?.id === location.id,
      transportOptions: currentLocation
        ? createTransportOptions({
            baseDurationMinutes,
            isCrossDistrict: currentLocation.districtId !== location.districtId,
            context: { ...context, districtDurationMultiplier }
          })
        : []
    };
  });
}

export function createDistrictTravelOption(input: {
  currentLocation: Location | undefined;
  district: District;
  defaultLocation?: Location;
  context: TravelContext;
}): DistrictTravelOption {
  const { currentLocation, district, defaultLocation, context } = input;
  const baseDurationMinutes = currentLocation && defaultLocation ? getTravelDurationMinutes(currentLocation, defaultLocation) : 0;
  const districtDurationMultiplier = currentLocation && defaultLocation
    ? context.getDistrictDurationMultiplier?.(currentLocation.districtId, defaultLocation.districtId) ?? context.districtDurationMultiplier ?? 1
    : 1;
  const durationMinutes = Math.max(0, Math.round(baseDurationMinutes * districtDurationMultiplier));

  return {
    district,
    defaultLocation,
    durationMinutes,
    isCurrent: currentLocation?.districtId === district.id,
    transportOptions:
      currentLocation && defaultLocation
        ? createTransportOptions({
            baseDurationMinutes,
            isCrossDistrict: currentLocation.districtId !== defaultLocation.districtId,
            context: { ...context, districtDurationMultiplier }
          })
        : []
  };
}
