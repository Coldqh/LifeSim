import type { LocationId, NpcRoleId } from './ids';
import type { LocationType } from './location';
import type { KnownNpcIdentity, Npc } from './npc';

export type PopulationRange = readonly [number, number];

export type LocationStaffRequirement = {
  roleId: NpcRoleId;
  count: number;
};

export type VisitorDemandProfile = {
  quiet: PopulationRange;
  normal: PopulationRange;
  peak: PopulationRange;
  peakWindows: Array<{ startMinute: number; endMinute: number }>;
};

export type LocationPopulationProfile = {
  staff: LocationStaffRequirement[];
  visitors: VisitorDemandProfile;
  preferredVisitorTypes?: LocationType[];
};


export type PopulationDataSource = {
  firstNames: readonly string[];
  lastNames: readonly string[];
  getLocationProfile: (location: import('./location').Location) => LocationPopulationProfile;
  getKnownIdentity: (locationId: LocationId, roleId: NpcRoleId, roleIndex: number) => KnownNpcIdentity | undefined;
};

export type PopulationState = {
  seed: number;
  generatedAtDay: number;
  lastSimulatedTotalMinutes: number;
  npcs: Npc[];
};

export type LocationPopulationPresence = {
  locationId: LocationId;
  staff: Npc[];
  visitors: Npc[];
  total: number;
};

export type PopulationSummary = {
  total: number;
  employed: number;
  activeResidents: number;
  inactiveResidents: number;
  travelling: number;
  atHome: number;
  inPublicLocations: number;
};
