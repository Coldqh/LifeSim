import type {
  BusinessEquipmentId,
  BusinessId,
  BusinessMenuItemId,
  BusinessPremisesId,
  BusinessSupplyId,
  BusinessTypeId,
  BusinessUpgradeId,
  DistrictId,
  LocationId,
  NpcId
} from './ids';
import type { WeeklySchedule } from './schedule';
import type { Weekday } from './time';

export type BusinessEmployeeRole = 'barista' | 'administrator' | 'cleaner';

export type BusinessPremises = {
  id: BusinessPremisesId;
  name: string;
  address: string;
  districtId: DistrictId;
  locationId: LocationId;
  areaSqm: number;
  rentPerWeek: number;
  deposit: number;
  dailyUtilities: number;
  footTraffic: number;
  allowedBusinessTypeIds: BusinessTypeId[];
};

export type BusinessEquipmentDefinition = {
  id: BusinessEquipmentId;
  name: string;
  description: string;
  price: number;
  capacityPerHour: number;
  qualityBonus: number;
};

export type BusinessSupplyDefinition = {
  id: BusinessSupplyId;
  name: string;
  unitCost: number;
  purchaseBatch: number;
};

export type BusinessIngredient = {
  supplyId: BusinessSupplyId;
  quantity: number;
};

export type BusinessMenuItemDefinition = {
  id: BusinessMenuItemId;
  name: string;
  recommendedPrice: number;
  ingredients: BusinessIngredient[];
  requiredEquipmentIds?: BusinessEquipmentId[];
  demandWeight: number;
};

export type BusinessStarterInventoryItem = {
  supplyId: BusinessSupplyId;
  quantity: number;
};

export type BusinessTypeDefinition = {
  id: BusinessTypeId;
  name: string;
  description: string;
  registrationCost: number;
  startingCashReserve: number;
  defaultSchedule: WeeklySchedule;
  starterEquipmentIds: BusinessEquipmentId[];
  starterInventory: BusinessStarterInventoryItem[];
  menuItemIds: BusinessMenuItemId[];
};

export type BusinessUpgradeEffect = {
  capacityBonus?: number;
  reputationBonus?: number;
  storageMultiplier?: number;
  demandMultiplier?: number;
};

export type BusinessUpgradeDefinition = {
  id: BusinessUpgradeId;
  name: string;
  description: string;
  price: number;
  effect: BusinessUpgradeEffect;
};

export type BusinessEmployee = {
  npcId: NpcId;
  role: BusinessEmployeeRole;
  wagePerShift: number;
  workDays: Weekday[];
  shiftStartMinute: number;
  shiftEndMinute: number;
  hiredDay: number;
};

export type BusinessInventory = Partial<Record<BusinessSupplyId, number>>;
export type BusinessMenuPrices = Partial<Record<BusinessMenuItemId, number>>;

export type BusinessDailyReport = {
  day: number;
  visitors: number;
  served: number;
  lostCustomers: number;
  revenue: number;
  costOfGoods: number;
  wages: number;
  utilities: number;
  rent: number;
  netProfit: number;
  stockouts: number;
  topMenuItemId?: BusinessMenuItemId;
  itemSales: Partial<Record<BusinessMenuItemId, number>>;
};

export type OwnedBusiness = {
  id: BusinessId;
  name: string;
  typeId: BusinessTypeId;
  premisesId: BusinessPremisesId;
  createdDay: number;
  balance: number;
  debt: number;
  reputation: number;
  schedule: WeeklySchedule;
  equipmentIds: BusinessEquipmentId[];
  inventory: BusinessInventory;
  menuPrices: BusinessMenuPrices;
  employees: BusinessEmployee[];
  upgradeIds: BusinessUpgradeId[];
  currentReport: BusinessDailyReport;
  reports: BusinessDailyReport[];
  nextRentDay: number;
  lastProcessedTotalMinutes: number;
  lastCustomerNpcIds: NpcId[];
};

export type BusinessWorldState = {
  seed: number;
  activePremisesIds: BusinessPremisesId[];
  ownedBusiness?: OwnedBusiness;
};

export type BusinessOperationResult = {
  ok: boolean;
  actionName: string;
  timeDeltaMinutes: number;
  playerMoneyDelta?: number;
  businessMoneyDelta?: number;
  messages: string[];
};

export type BusinessSimulationEvent = {
  title: string;
  text: string;
};
