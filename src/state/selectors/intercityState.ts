import { getIntercityCarQuote, getTicketBoardFailure, getUpcomingDepartures } from '../../core/intercity';
import { getCityById, getDefaultArrivalLocationForCity, getLocationById } from '../../core/location';
import { getTotalMinutes } from '../../core/time';
import {
  getIntercityRoadConnectionsFromCity,
  getIntercityRouteById,
  getIntercityRoutesFromCity,
  temporaryAccommodations
} from '../../data/intercity/routes';
import { getVehicleModelById } from '../../data/vehicles/vehicleModels';
import type { CityId, LocationId } from '../../types/ids';
import type { IntercityTravelState } from '../../types/intercity';
import type { GameTime } from '../../types/time';
import type { VehicleWorldState } from '../../types/vehicle';

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
  const routes = getIntercityRoutesFromCity(gameState.player.cityId)
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
  const ownedModel = getVehicleModelById(gameState.world.vehicles.ownedVehicle?.modelId);
  const roadDestinations = getIntercityRoadConnectionsFromCity(gameState.player.cityId).map((connection) => ({
    connection,
    city: getCityById(connection.destinationCityId),
    arrivalLocation: getDefaultArrivalLocationForCity(connection.destinationCityId),
    carQuote: getIntercityCarQuote({
      connection,
      world: gameState.world.vehicles,
      model: ownedModel,
      currentLocationId: gameState.player.locationId
    })
  }));

  return {
    state: gameState.world.intercity,
    routes,
    tickets,
    accommodations,
    activeStay: gameState.world.intercity.activeStay,
    currentCity: getCityById(gameState.player.cityId),
    roadDestinations,
    ownedModel
  };
}
