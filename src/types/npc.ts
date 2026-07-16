import type { DistrictId, LocationId, NpcId, NpcRoleId } from './ids';
import type { LocationType } from './location';
import type { Weekday } from './time';
import type { NpcPersonality } from './relationship';


export type KnownNpcIdentity = {
  firstName: string;
  lastName: string;
  age: number;
};

export type NpcActivityProfile = 'worker' | 'student' | 'unemployed' | 'remote_worker' | 'retired';

export type NpcDailyOutcomeKind =
  | 'worked'
  | 'missed_work'
  | 'studied'
  | 'missed_study'
  | 'searched_job'
  | 'rested'
  | 'sick'
  | 'lost_job';

export type NpcDailyOutcome = {
  day: number;
  kind: NpcDailyOutcomeKind;
  text: string;
};

export type NpcLifeState = {
  energy: number;
  health: number;
  money: number;
  reliability: number;
  studyProgress: number;
  missedCommitments: number;
  warningCount: number;
  jobSearchDays: number;
  lastProcessedDay: number;
  sickUntilDay?: number;
  lastOutcome?: NpcDailyOutcome;
};

export type NpcLocationPurpose = 'work' | 'study' | 'job_search' | 'shopping' | 'leisure' | 'visit';

export type NpcEmployment = {
  locationId: LocationId;
  roleId: NpcRoleId;
  workdays: Weekday[];
  startMinute: number;
  endMinute: number;
};

export type NpcWorldState =
  | { kind: 'home'; sinceTotalMinutes: number }
  | { kind: 'at_location'; locationId: LocationId; purpose: NpcLocationPurpose; sinceTotalMinutes: number }
  | {
      kind: 'travelling';
      destinationKind: 'home' | 'location';
      destinationLocationId?: LocationId;
      purpose: NpcLocationPurpose | 'home';
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
  personality: NpcPersonality;
  life: NpcLifeState;
  worldState: NpcWorldState;
};

export type NpcRoleDefinition = {
  id: NpcRoleId;
  name: string;
  category: 'management' | 'service' | 'sales' | 'security' | 'office' | 'health' | 'sport' | 'operations' | 'education';
};
