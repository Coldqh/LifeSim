import type { Location, LocationType } from '../../types/location';
import type { LocationPopulationProfile } from '../../types/population';
import { NPC_ROLE_IDS } from './npcRoles';

const EMPTY: LocationPopulationProfile = {
  staff: [],
  visitors: { quiet: [0, 0], normal: [0, 0], peak: [0, 0], peakWindows: [] }
};

const PROFILES: Record<LocationType, LocationPopulationProfile> = {
  home: EMPTY,
  shop: {
    staff: [
      { roleId: NPC_ROLE_IDS.manager, count: 1 },
      { roleId: NPC_ROLE_IDS.seller, count: 2 }
    ],
    visitors: { quiet: [0, 2], normal: [2, 5], peak: [5, 10], peakWindows: [{ startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  cafe: {
    staff: [
      { roleId: NPC_ROLE_IDS.manager, count: 1 },
      { roleId: NPC_ROLE_IDS.barista, count: 1 },
      { roleId: NPC_ROLE_IDS.cook, count: 1 }
    ],
    visitors: { quiet: [1, 3], normal: [3, 7], peak: [7, 12], peakWindows: [{ startMinute: 8 * 60, endMinute: 10 * 60 }, { startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  workplace: {
    staff: [
      { roleId: NPC_ROLE_IDS.manager, count: 1 },
      { roleId: NPC_ROLE_IDS.officeWorker, count: 3 }
    ],
    visitors: { quiet: [0, 0], normal: [0, 2], peak: [1, 3], peakWindows: [{ startMinute: 11 * 60, endMinute: 16 * 60 }] }
  },
  business_center: {
    staff: [
      { roleId: NPC_ROLE_IDS.manager, count: 1 },
      { roleId: NPC_ROLE_IDS.officeWorker, count: 5 },
      { roleId: NPC_ROLE_IDS.security, count: 1 },
      { roleId: NPC_ROLE_IDS.cleaner, count: 1 }
    ],
    visitors: { quiet: [1, 3], normal: [4, 8], peak: [8, 16], peakWindows: [{ startMinute: 8 * 60, endMinute: 10 * 60 }, { startMinute: 17 * 60, endMinute: 19 * 60 }] }
  },
  park: {
    staff: [{ roleId: NPC_ROLE_IDS.maintenance, count: 1 }],
    visitors: { quiet: [1, 4], normal: [6, 14], peak: [14, 24], peakWindows: [{ startMinute: 8 * 60, endMinute: 10 * 60 }, { startMinute: 17 * 60, endMinute: 22 * 60 }] }
  },
  sport_ground: {
    staff: [{ roleId: NPC_ROLE_IDS.maintenance, count: 1 }, { roleId: NPC_ROLE_IDS.trainer, count: 1 }],
    visitors: { quiet: [0, 2], normal: [3, 8], peak: [8, 15], peakWindows: [{ startMinute: 17 * 60, endMinute: 22 * 60 }] }
  },
  service: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.operator, count: 1 }],
    visitors: { quiet: [0, 1], normal: [1, 4], peak: [4, 7], peakWindows: [{ startMinute: 12 * 60, endMinute: 15 * 60 }, { startMinute: 17 * 60, endMinute: 19 * 60 }] }
  },
  warehouse: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.warehouseWorker, count: 4 }],
    visitors: { quiet: [0, 0], normal: [0, 1], peak: [1, 2], peakWindows: [{ startMinute: 9 * 60, endMinute: 18 * 60 }] }
  },
  fitness: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 1 }, { roleId: NPC_ROLE_IDS.trainer, count: 2 }],
    visitors: { quiet: [1, 4], normal: [4, 10], peak: [10, 18], peakWindows: [{ startMinute: 7 * 60, endMinute: 10 * 60 }, { startMinute: 18 * 60, endMinute: 23 * 60 }] }
  },
  coworking: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.officeWorker, count: 3 }],
    visitors: { quiet: [1, 3], normal: [4, 9], peak: [9, 14], peakWindows: [{ startMinute: 10 * 60, endMinute: 17 * 60 }] }
  },
  clinic: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 1 }, { roleId: NPC_ROLE_IDS.medicalWorker, count: 3 }],
    visitors: { quiet: [0, 2], normal: [2, 6], peak: [6, 10], peakWindows: [{ startMinute: 9 * 60, endMinute: 12 * 60 }, { startMinute: 16 * 60, endMinute: 19 * 60 }] }
  },
  pharmacy: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.pharmacist, count: 2 }],
    visitors: { quiet: [0, 2], normal: [2, 5], peak: [5, 8], peakWindows: [{ startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  restaurant: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.waiter, count: 1 }, { roleId: NPC_ROLE_IDS.cook, count: 2 }],
    visitors: { quiet: [1, 3], normal: [4, 9], peak: [9, 16], peakWindows: [{ startMinute: 12 * 60, endMinute: 15 * 60 }, { startMinute: 18 * 60, endMinute: 22 * 60 }] }
  },
  food_court: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.cashier, count: 2 }, { roleId: NPC_ROLE_IDS.cook, count: 2 }],
    visitors: { quiet: [2, 5], normal: [6, 12], peak: [12, 22], peakWindows: [{ startMinute: 12 * 60, endMinute: 15 * 60 }, { startMinute: 18 * 60, endMinute: 21 * 60 }] }
  },
  pickup_point: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.operator, count: 2 }],
    visitors: { quiet: [0, 2], normal: [2, 5], peak: [5, 9], peakWindows: [{ startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  mall: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.seller, count: 2 }, { roleId: NPC_ROLE_IDS.security, count: 1 }, { roleId: NPC_ROLE_IDS.cleaner, count: 1 }],
    visitors: { quiet: [2, 6], normal: [8, 18], peak: [18, 30], peakWindows: [{ startMinute: 16 * 60, endMinute: 22 * 60 }] }
  },
  electronics_store: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.seller, count: 3 }],
    visitors: { quiet: [0, 2], normal: [2, 6], peak: [6, 11], peakWindows: [{ startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  clothing_store: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.seller, count: 3 }],
    visitors: { quiet: [1, 3], normal: [3, 8], peak: [8, 14], peakWindows: [{ startMinute: 16 * 60, endMinute: 21 * 60 }] }
  },
  bank: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.bankEmployee, count: 4 }, { roleId: NPC_ROLE_IDS.security, count: 1 }],
    visitors: { quiet: [0, 2], normal: [2, 7], peak: [7, 12], peakWindows: [{ startMinute: 11 * 60, endMinute: 15 * 60 }] }
  },
  education_center: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 1 }, { roleId: NPC_ROLE_IDS.teacher, count: 3 }],
    visitors: { quiet: [0, 2], normal: [3, 8], peak: [8, 14], peakWindows: [{ startMinute: 10 * 60, endMinute: 13 * 60 }, { startMinute: 17 * 60, endMinute: 20 * 60 }] }
  },
  university: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 2 }, { roleId: NPC_ROLE_IDS.teacher, count: 8 }],
    visitors: { quiet: [2, 8], normal: [12, 30], peak: [30, 55], peakWindows: [{ startMinute: 8 * 60, endMinute: 11 * 60 }, { startMinute: 13 * 60, endMinute: 17 * 60 }] }
  },
  sports_store: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.seller, count: 2 }],
    visitors: { quiet: [0, 2], normal: [2, 5], peak: [5, 9], peakWindows: [{ startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  boxing_gym: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 1 }, { roleId: NPC_ROLE_IDS.boxingCoach, count: 3 }],
    visitors: { quiet: [1, 3], normal: [5, 10], peak: [10, 16], peakWindows: [{ startMinute: 17 * 60, endMinute: 22 * 60 }] }
  },
  pool: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 1 }, { roleId: NPC_ROLE_IDS.trainer, count: 2 }, { roleId: NPC_ROLE_IDS.cleaner, count: 1 }],
    visitors: { quiet: [1, 4], normal: [4, 10], peak: [10, 18], peakWindows: [{ startMinute: 7 * 60, endMinute: 10 * 60 }, { startMinute: 18 * 60, endMinute: 22 * 60 }] }
  },
  car_dealer: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.seller, count: 3 }, { roleId: NPC_ROLE_IDS.security, count: 1 }],
    visitors: { quiet: [0, 2], normal: [2, 5], peak: [5, 8], peakWindows: [{ startMinute: 12 * 60, endMinute: 18 * 60 }] }
  },
  gas_station: {
    staff: [{ roleId: NPC_ROLE_IDS.cashier, count: 1 }, { roleId: NPC_ROLE_IDS.operator, count: 1 }],
    visitors: { quiet: [0, 2], normal: [2, 5], peak: [5, 9], peakWindows: [{ startMinute: 7 * 60, endMinute: 10 * 60 }, { startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  service_center: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.operator, count: 3 }],
    visitors: { quiet: [0, 1], normal: [1, 4], peak: [4, 7], peakWindows: [{ startMinute: 10 * 60, endMinute: 17 * 60 }] }
  },
  auto_market: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.seller, count: 3 }],
    visitors: { quiet: [0, 2], normal: [2, 6], peak: [6, 10], peakWindows: [{ startMinute: 11 * 60, endMinute: 18 * 60 }] }
  },
  train_station: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.operator, count: 3 }, { roleId: NPC_ROLE_IDS.security, count: 2 }],
    visitors: { quiet: [4, 10], normal: [10, 24], peak: [24, 40], peakWindows: [{ startMinute: 6 * 60, endMinute: 9 * 60 }, { startMinute: 17 * 60, endMinute: 21 * 60 }] }
  },
  bus_station: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.operator, count: 2 }, { roleId: NPC_ROLE_IDS.security, count: 1 }],
    visitors: { quiet: [2, 6], normal: [6, 15], peak: [15, 26], peakWindows: [{ startMinute: 7 * 60, endMinute: 10 * 60 }, { startMinute: 16 * 60, endMinute: 20 * 60 }] }
  },
  hotel: {
    staff: [{ roleId: NPC_ROLE_IDS.manager, count: 1 }, { roleId: NPC_ROLE_IDS.administrator, count: 2 }, { roleId: NPC_ROLE_IDS.cleaner, count: 2 }],
    visitors: { quiet: [1, 4], normal: [4, 10], peak: [10, 16], peakWindows: [{ startMinute: 18 * 60, endMinute: 23 * 60 }] }
  },
  hostel: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 1 }, { roleId: NPC_ROLE_IDS.cleaner, count: 1 }],
    visitors: { quiet: [1, 3], normal: [3, 8], peak: [8, 13], peakWindows: [{ startMinute: 18 * 60, endMinute: 23 * 60 }] }
  },
  other: EMPTY
};

const LOCATION_OVERRIDES: Record<string, Partial<LocationPopulationProfile>> = {
  msk_tverskoy_night_store: {
    visitors: { quiet: [1, 3], normal: [3, 6], peak: [6, 10], peakWindows: [{ startMinute: 21 * 60, endMinute: 24 * 60 }, { startMinute: 0, endMinute: 2 * 60 }] }
  },
  msk_khamovniki_boxing_gym: {
    staff: [{ roleId: NPC_ROLE_IDS.administrator, count: 1 }, { roleId: NPC_ROLE_IDS.boxingCoach, count: 3 }]
  }
};

export function getLocationPopulationProfile(location: Location): LocationPopulationProfile {
  const base = PROFILES[location.type] ?? EMPTY;
  const override = LOCATION_OVERRIDES[String(location.id)];
  if (!override) return base;

  return {
    ...base,
    ...override,
    staff: override.staff ?? base.staff,
    visitors: override.visitors ?? base.visitors
  };
}
