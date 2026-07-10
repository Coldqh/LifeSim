import type { PopulationDataSource } from '../../types/population';
import { NPC_FIRST_NAMES, NPC_LAST_NAMES } from './namePools';
import { getKnownNpcIdentity } from './knownNpcIdentities';
import { getLocationPopulationProfile } from './locationPopulationProfiles';

export const populationDataSource: PopulationDataSource = {
  firstNames: NPC_FIRST_NAMES,
  lastNames: NPC_LAST_NAMES,
  getLocationProfile: getLocationPopulationProfile,
  getKnownIdentity: getKnownNpcIdentity
};
