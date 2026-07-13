import { getIntercityCarQuote, getTicketBoardFailure, getUpcomingDepartures } from '../../core/intercity';
import { getCityById, getLocationById } from '../../core/location';
import { intercityRoutes, temporaryAccommodations, getIntercityRouteById } from '../../data/intercity/routes';
import { getVehicleModelById } from '../../data/vehicles/vehicleModels';
import type { CityId, LocationId } from '../../types/ids';
import type { IntercityTravelState } from '../../types/intercity';
import type { GameTime } from '../../types/time';
import type { VehicleWorldState } from '../../types/vehicle';
import { getTotalMinutes } from '../../core/time';

export type IntercityStateSelectorInput = {
  time: GameTime;
  player: {
    cityId: CityId;
    locationId?: LocationId;
    money: number;
  };
  world: {
    intercity: IntercityTravelState;
    vehicles: VehicleWorldState;
  };
};

export function selectIntercityState(gameState: IntercityStateSelectorInput) {
  const now = getTotalMinutes(gameState.time);
  const routes = intercityRoutes
    .filter((route) => route.originCityId === gameState.player.cityId)
    .map((route) => ({
      route,
      originTerminal: getLocationById(route.originTerminalLocationId),
      destinationTerminal: getLocationById(route.destinationTerminalLocationId),
      originCity: getCityById(route.originCityId),
      destinationCity: getCityById(route.destinationCityId),
      departures: getUpcomingDepartures({ route, currentTotalMinutes: now, days: 3 })
    }));
  const tickets = gameState.world.intercity.tickets.map((ticket) => {
    const route = getIntercityRouteById(ticket.routeId);
    return {
      ticket,
      route,
      originTerminal: getLocationById(route?.originTerminalLocationId),
      destinationTerminal: getLocationById(route?.destinationTerminalLocationId),
      boardFailure: getTicketBoardFailure({
        ticket,
        route,
        currentLocationId: gameState.player.locationId,
        currentTotalMinutes: now
      })
    };
  });
  const accommodations = temporaryAccommodations
    .filter((entry) => entry.cityId === gameState.player.cityId)
    .map((entry) => ({
      accommodation: entry,
      location: getLocationById(entry.locationId),
      active: gameState.world.intercity.activeStay?.accommodationId === entry.id,
      canAffordNight: gameState.player.money >= entry.nightlyPrice
    }));
  const destinationCityId = (gameState.player.cityId === ('moscow' as CityId) ? 'yaroslavl' : 'moscow') as CityId;
  const destinationArrivalLocation = getLocationById(destinationCityId === ('yaroslavl' as CityId)
    ? ('yar_leninsky_main_station' as LocationId)
    : ('msk_tverskoy_yaroslavsky_station' as LocationId));
  const ownedModel = getVehicleModelById(gameState.world.vehicles.ownedVehicle?.modelId);
  const carQuote = getIntercityCarQuote({
    world: gameState.world.vehicles,
    model: ownedModel,
    currentLocationId: gameState.player.locationId
  });
  return {
    state: gameState.world.intercity,
    routes,
    tickets,
    accommodations,
    activeStay: gameState.world.intercity.activeStay,
    currentCity: getCityById(gameState.player.cityId),
    destinationCity: getCityById(destinationCityId),
    destinationCityId,
    destinationArrivalLocation,
    carQuote,
    ownedModel
  };
}
