import { describe, expect, it } from 'vitest';
import type { CityId, CountryId, DistrictId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';
import type { PopulationState } from '../../types/population';
import type { GameTime } from '../../types/time';
import { getCalendarDateForDay, getWeekdayForDay } from '../time';
import {
  createInitialWorldAtlasState,
  processWorldAtlasTime
} from './index';

const cityId = (value: string) => value as CityId;
const countryId = (value: string) => value as CountryId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;

function createWorld(size: number) {
  const cities: City[] = [];
  const districts: District[] = [];
  const locations: Location[] = [];

  for (let index = 0; index < size; index += 1) {
    const currentCityId = cityId(`city_${index}`);
    const currentDistrictId = districtId(`city_${index}_center`);
    const currentLocationId = locationId(`city_${index}_station`);
    cities.push({
      id: currentCityId,
      countryId: countryId('test_country'),
      name: `City ${index}`,
      description: 'Test city',
      districtIds: [currentDistrictId]
    });
    districts.push({
      id: currentDistrictId,
      cityId: currentCityId,
      name: 'Center',
      description: 'Test district',
      locationIds: [currentLocationId]
    });
    locations.push({
      id: currentLocationId,
      cityId: currentCityId,
      districtId: currentDistrictId,
      name: 'Station',
      address: 'Test address',
      type: 'train_station',
      description: 'Test location',
      availableActionIds: []
    });
  }

  return { cities, districts, locations };
}

const population: PopulationState = {
  seed: 421337,
  generatedAtDay: 1,
  lastSimulatedTotalMinutes: 7 * 60,
  npcs: []
};

const time = (day: number, hour = 7): GameTime => ({
  day,
  hour,
  minute: 0,
  weekday: getWeekdayForDay(day),
  calendar: getCalendarDateForDay(day)
});

describe('world atlas runtime', () => {
  it('indexes one hundred cities and assigns active, regional and remote tiers', () => {
    const world = createWorld(100);
    const atlas = createInitialWorldAtlasState({
      ...world,
      population,
      activeCityId: cityId('city_0'),
      regionalCityIds: [cityId('city_1'), cityId('city_2')],
      time: time(1)
    });

    expect(Object.keys(atlas.cityStates)).toHaveLength(100);
    expect(atlas.cityStates.city_0.tier).toBe('active');
    expect(atlas.cityStates.city_1.tier).toBe('regional');
    expect(atlas.cityStates.city_99.tier).toBe('remote');
  });

  it('processes active cities immediately, regional cities daily and remote cities weekly', () => {
    const world = createWorld(100);
    const initial = createInitialWorldAtlasState({
      ...world,
      population,
      activeCityId: cityId('city_0'),
      regionalCityIds: [cityId('city_1')],
      time: time(1)
    });

    const sameDay = processWorldAtlasTime({
      atlas: initial,
      ...world,
      population,
      activeCityId: cityId('city_0'),
      regionalCityIds: [cityId('city_1')],
      toTime: time(1, 8)
    });
    expect(sameDay.processedCityIds).toEqual([cityId('city_0')]);
    expect(sameDay.atlas.cityStates.city_99.lastProcessedDay).toBe(1);

    const nextDay = processWorldAtlasTime({
      atlas: sameDay.atlas,
      ...world,
      population,
      activeCityId: cityId('city_0'),
      regionalCityIds: [cityId('city_1')],
      toTime: time(2)
    });
    expect(nextDay.processedCityIds).toEqual([cityId('city_0'), cityId('city_1')]);
    expect(nextDay.atlas.cityStates.city_1.lastProcessedDay).toBe(2);
    expect(nextDay.atlas.cityStates.city_99.lastProcessedDay).toBe(1);

    const weekLater = processWorldAtlasTime({
      atlas: nextDay.atlas,
      ...world,
      population,
      activeCityId: cityId('city_0'),
      regionalCityIds: [cityId('city_1')],
      toTime: time(8)
    });
    expect(weekLater.processedCityIds).toHaveLength(100);
    expect(weekLater.atlas.cityStates.city_99.lastProcessedDay).toBe(8);
    expect(weekLater.atlas.cityStates.city_99.aggregate.revision).toBe(1);
  });
});
