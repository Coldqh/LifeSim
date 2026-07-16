import { describe, expect, it } from 'vitest';
import { LIFE_ACTION_IDS } from '../../data/lifeActions';
import type { LocationId } from '../../types/ids';
import { getActionsForLocation, isActionAvailableAtLocation } from './index';

const locationId = (value: string) => value as LocationId;

describe('default location interactions', () => {
  it('adds household actions to every home without removing explicit recovery actions', () => {
    const actions = getActionsForLocation(locationId('msk_danilovsky_home'));
    const ids = actions.map((action) => action.id);

    expect(ids).toContain(LIFE_ACTION_IDS.sleepEightHours);
    expect(ids).toContain(LIFE_ACTION_IDS.restOneHour);
    expect(ids).toContain(LIFE_ACTION_IDS.cookSimpleMeal);
    expect(ids).toContain(LIFE_ACTION_IDS.cleanHome);
  });

  it('adds cafe interactions from the location type data mapping', () => {
    const cafeId = locationId('msk_danilovsky_metro_cafe');

    expect(isActionAvailableAtLocation(cafeId, LIFE_ACTION_IDS.cafeCoffeeBreak)).toBe(true);
    expect(isActionAvailableAtLocation(cafeId, LIFE_ACTION_IDS.cafeLaptopSession)).toBe(true);
  });

  it('keeps the existing park walk and adds a jog without duplicates', () => {
    const actions = getActionsForLocation(locationId('msk_tverskoy_walking_zone'));
    const ids = actions.map((action) => action.id);

    expect(ids).toContain(LIFE_ACTION_IDS.walkOneHour);
    expect(ids).toContain(LIFE_ACTION_IDS.parkJog);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
