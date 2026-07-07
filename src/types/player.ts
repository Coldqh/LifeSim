import type { CityId, DistrictId, JobId, LocationId, PlayerId } from './ids';
import type { HousingId } from './housing';
import type { InventoryItem } from './inventory';
import type { NeedsState } from './needs';

export type PlayerSkills = Record<string, number>;

export type Player = {
  id: PlayerId;
  name: string;
  age: number;
  money: number;
  cityId: CityId;
  districtId: DistrictId;
  locationId?: LocationId;
  needs: NeedsState;
  skills: PlayerSkills;
  inventory: InventoryItem[];
  currentJobId?: JobId;
  completedShifts: Partial<Record<JobId, number>>;
  jobExperience: Partial<Record<JobId, number>>;
  housingId: HousingId;
  rentDebt: number;
  daysUntilRent: number;
};
