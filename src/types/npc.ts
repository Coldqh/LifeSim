import type { DistrictId, LocationId, NpcId, NpcRoleId } from './ids';
import type { LocationType } from './location';
import type { Weekday } from './time';


export type KnownNpcIdentity = {
  firstName: string;
  lastName: string;
  age: number;
};

export type NpcActivityProfile = 'worker' | 'student' | 'unemployed' | 'remote_worker' | 'retired';

export type NpcEmployment = {
  locationId: LocationId;
  roleId: NpcRoleId;
  workdays: Weekday[];
  startMinute: number;
  endMinute: number;
};

export type NpcWorldState =
  | { kind: 'home'; sinceTotalMinutes: number }
  | { kind: 'at_location'; locationId: LocationId; purpose: 'work' | 'visit'; sinceTotalMinutes: number }
  | {
      kind: 'travelling';
      destinationKind: 'home' | 'location';
      destinationLocationId?: LocationId;
      purpose: 'work' | 'visit' | 'home';
      arrivalTotalMinutes: number;
      sinceTotalMinutes: number;
    };

export type Npc = {
  id: NpcId;
  firstName: string;
  lastName: string;
  age: number;
  homeDistrictId: DistrictId;
  activityProfile: NpcActivityProfile;
  activationDay: number;
  preferredLocationTypes: LocationType[];
  employment?: NpcEmployment;
  worldState: NpcWorldState;
};

export type NpcRoleDefinition = {
  id: NpcRoleId;
  name: string;
  category: 'management' | 'service' | 'sales' | 'security' | 'office' | 'health' | 'sport' | 'operations' | 'education';
};
