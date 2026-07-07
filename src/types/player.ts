import type { CityId, DistrictId, LocationId, PlayerId } from './ids';
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
};
