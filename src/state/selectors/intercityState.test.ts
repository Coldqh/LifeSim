import { describe, expect, it } from 'vitest';
import type { CityId, IntercityRouteId, IntercityTicketId, LocationId, VehicleModelId } from '../../types/ids';
import type { IntercityTravelState } from '../../types/intercity';
import type { VehicleWorldState } from '../../types/vehicle';
import { createInitialTime } from '../../core/time';
import { selectIntercityState, type IntercityStateSelectorInput } from './intercityState';

const cityId = (value: string) => value as CityId;
const locationId = (value: string) => value as LocationId;
const routeId = (value: string) => value as IntercityRouteId;
const ticketId = (value: string) => value as IntercityTicketId;
const vehicleModelId = (value: string) => value as VehicleModelId;

function createIntercityState(): IntercityTravelState {
  return {
    tickets: [],
    history: [],
    lastProcessedTotalMinutes: 420
  };
}

function createVehicleWorld(): VehicleWorldState {
  return {
    seed: 1,
    lastMarketRefreshDay: 1,
    usedListings: [],
    inspectedListingIds: []
  };
}

function createInput(overrides: Partial<IntercityStateSelectorInput> = {}): IntercityStateSelectorInput {
  return {
    time: createInitialTime(),
    player: {
      cityId: cityId('moscow'),
      locationId: locationId('msk_tverskoy_yaroslavsky_station'),
      money: 5_000
    },
    world: {
      intercity: createIntercityState(),
      vehicles: createVehicleWorld()
    },
    ...overrides
  };
}

describe('selectIntercityState', () => {
  it('builds the current Moscow route, ticket and owned-car view state', () => {
    const intercity = createIntercityState();
    intercity.tickets = [{
      id: ticketId('ticket_test'),
      routeId: routeId('route_moscow_yaroslavl_train'),
      departureTotalMinutes: 455,
      arrivalTotalMinutes: 665,
      purchasedAtTotalMinutes: 400,
      price: 1_250,
      status: 'booked'
    }];
    const vehicles: VehicleWorldState = {
      ...createVehicleWorld(),
      ownedVehicle: {
        modelId: vehicleModelId('lada_granta_2018'),
        source: 'used_market',
        purchasePrice: 500_000,
        purchaseDay: 1,
        year: 2018,
        odometerKm: 80_000,
        fuelLiters: 40,
        conditionPercent: 80,
        reliabilityPercent: 76,
        parkedLocationId: locationId('msk_tverskoy_yaroslavsky_station'),
        nextServiceOdometerKm: 90_000,
        knownDefectIds: []
      }
    };

    const result = selectIntercityState(createInput({
      world: { intercity, vehicles }
    }));

    expect(result.routes.map((entry) => entry.route.id)).toEqual([
      'route_moscow_yaroslavl_train',
      'route_moscow_yaroslavl_bus',
      'route_moscow_rybinsk_bus'
    ]);
    expect(result.tickets).toHaveLength(1);
    expect(result.tickets[0].route?.id).toBe('route_moscow_yaroslavl_train');
    expect(result.tickets[0].originTerminal?.id).toBe('msk_tverskoy_yaroslavsky_station');
    expect(result.tickets[0].destinationTerminal?.id).toBe('yar_leninsky_main_station');
    expect(result.tickets[0].boardFailure).toBeUndefined();
    expect(result.accommodations).toEqual([]);
    expect(result.currentCity?.id).toBe('moscow');
    expect(result.roadDestinations).toHaveLength(2);
    expect(result.roadDestinations[0].connection.destinationCityId).toBe('yaroslavl');
    expect(result.roadDestinations[0].city?.id).toBe('yaroslavl');
    expect(result.roadDestinations[1].city?.id).toBe('rybinsk');
    expect(result.roadDestinations[0].arrivalLocation?.id).toBe('yar_leninsky_main_station');
    expect(result.ownedModel?.id).toBe('lada_granta_2018');
    expect(result.roadDestinations[0].carQuote).toEqual({
      durationMinutes: 255,
      distanceKm: 270,
      fuelLiters: 18.9,
      roadCost: 650,
      available: true
    });
  });

  it('preserves the Yaroslavl destination and accommodation behavior', () => {
    const result = selectIntercityState(createInput({
      player: {
        cityId: cityId('yaroslavl'),
        locationId: locationId('yar_leninsky_hostel'),
        money: 1_500
      }
    }));

    expect(result.routes.map((entry) => entry.route.id)).toEqual([
      'route_yaroslavl_moscow_train',
      'route_yaroslavl_moscow_bus',
      'route_yaroslavl_rybinsk_train',
      'route_yaroslavl_rybinsk_bus'
    ]);
    expect(result.accommodations.map((entry) => ({
      id: entry.accommodation.id,
      active: entry.active,
      canAffordNight: entry.canAffordNight
    }))).toEqual([
      { id: 'stay_yar_hostel_station', active: false, canAffordNight: true },
      { id: 'stay_yar_ibis_center', active: false, canAffordNight: false },
      { id: 'stay_yar_daily_apartment', active: false, canAffordNight: false }
    ]);
    expect(result.currentCity?.id).toBe('yaroslavl');
    expect(result.roadDestinations).toHaveLength(2);
    expect(result.roadDestinations[0].connection.destinationCityId).toBe('moscow');
    expect(result.roadDestinations[0].city?.id).toBe('moscow');
    expect(result.roadDestinations[1].city?.id).toBe('rybinsk');
    expect(result.roadDestinations[0].arrivalLocation?.id).toBe('msk_tverskoy_yaroslavsky_station');
    expect(result.ownedModel).toBeUndefined();
    expect(result.roadDestinations[0].carQuote.available).toBe(false);
    expect(result.roadDestinations[0].carQuote.unavailableReason).toBe('Нет личного автомобиля.');
  });

  it('builds Rybinsk routes, stays and road destinations from the registry', () => {
    const result = selectIntercityState(createInput({
      player: {
        cityId: cityId('rybinsk'),
        locationId: locationId('ryb_center_station'),
        money: 3_000
      }
    }));

    expect(result.routes.map((entry) => entry.route.id)).toEqual([
      'route_rybinsk_yaroslavl_train',
      'route_rybinsk_yaroslavl_bus',
      'route_rybinsk_moscow_bus'
    ]);
    expect(result.accommodations.map((entry) => entry.accommodation.id)).toEqual([
      'stay_ryb_hostel_station',
      'stay_ryb_hotel_volga',
      'stay_ryb_daily_apartment'
    ]);
    expect(result.currentCity?.id).toBe('rybinsk');
    expect(result.roadDestinations.map((entry) => entry.city?.id)).toEqual(['yaroslavl', 'moscow']);
  });

});
