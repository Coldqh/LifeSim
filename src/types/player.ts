import type { CareerResume, PlayerCareerState, PlayerQualification } from './career';
import type { CityId, DistrictId, JobId, LocationId, PlayerId } from './ids';
import type { HousingId, RentalContract } from './housing';
import type { InventoryItem } from './inventory';
import type { NeedsState } from './needs';
import type { PlayerSkills } from './skill';
import type { BoxingProfile } from './boxing';
import type { CalendarDate } from './time';

export type Player = {
  id: PlayerId;
  name: string;
  age: number;
  birthDate: CalendarDate;
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
  jobLevels: Partial<Record<JobId, number>>;
  qualifications?: PlayerQualification[];
  career?: PlayerCareerState;
  housingId: HousingId;
  rentDebt: number;
  daysUntilRent: number;
  rentalContract: RentalContract;
  boxing: BoxingProfile;
};

export type PlayerCareerResume = CareerResume;
