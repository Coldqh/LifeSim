import type { ActionId } from '../../types/ids';
import type { LocationType } from '../../types/location';
import { LIFE_ACTION_IDS } from '../lifeActions';

const DEFAULT_ACTION_IDS_BY_LOCATION_TYPE: Partial<Record<LocationType, ActionId[]>> = {
  home: [
    LIFE_ACTION_IDS.cookSimpleMeal,
    LIFE_ACTION_IDS.cleanHome,
    LIFE_ACTION_IDS.orderMealDelivery,
    LIFE_ACTION_IDS.repairHome
  ],
  cafe: [
    LIFE_ACTION_IDS.cafeCoffeeBreak,
    LIFE_ACTION_IDS.cafeLaptopSession
  ],
  park: [
    LIFE_ACTION_IDS.walkOneHour,
    LIFE_ACTION_IDS.parkJog
  ]
};

export function getDefaultActionIdsForLocationType(locationType: LocationType): ActionId[] {
  return DEFAULT_ACTION_IDS_BY_LOCATION_TYPE[locationType] ?? [];
}
