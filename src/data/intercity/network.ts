import type { CityId, IntercityRouteId, LocationId, TemporaryAccommodationId } from '../../types/ids';
import type {
  IntercityRoadConnection,
  IntercityRoute,
  TemporaryAccommodation
} from '../../types/intercity';
import type { CityRegistry } from '../cities/registry';

const routeId = (value: string) => value as IntercityRouteId;

export type ScheduledRoutePairDefinition = {
  mode: IntercityRoute['mode'];
  cityA: { id: CityId; name: string; terminalLocationId: LocationId; departureMinutes: number[] };
  cityB: { id: CityId; name: string; terminalLocationId: LocationId; departureMinutes: number[] };
  durationMinutes: number;
  distanceKm: number;
  fare: number;
  operatorName: string;
};

export type BidirectionalRoadDefinition = {
  cityAId: CityId;
  cityBId: CityId;
  distanceKm: number;
  durationMinutes: number;
  roadCost: number;
};

export type IntercityNetwork = {
  routes: readonly IntercityRoute[];
  roadConnections: readonly IntercityRoadConnection[];
  accommodations: readonly TemporaryAccommodation[];
  getRouteById: (id: IntercityRouteId | undefined) => IntercityRoute | undefined;
  getAccommodationById: (id: TemporaryAccommodationId | undefined) => TemporaryAccommodation | undefined;
  getRoadConnection: (originCityId: CityId, destinationCityId: CityId) => IntercityRoadConnection | undefined;
  getRoutesFromCity: (originCityId: CityId) => IntercityRoute[];
  getRoadConnectionsFromCity: (originCityId: CityId) => IntercityRoadConnection[];
};

export function createScheduledRoutePair(definition: ScheduledRoutePairDefinition): IntercityRoute[] {
  const createRoute = (
    origin: ScheduledRoutePairDefinition['cityA'],
    destination: ScheduledRoutePairDefinition['cityB']
  ): IntercityRoute => ({
    id: routeId(`route_${String(origin.id)}_${String(destination.id)}_${definition.mode}`),
    mode: definition.mode,
    originCityId: origin.id,
    destinationCityId: destination.id,
    originTerminalLocationId: origin.terminalLocationId,
    destinationTerminalLocationId: destination.terminalLocationId,
    departureMinutes: [...origin.departureMinutes],
    durationMinutes: definition.durationMinutes,
    distanceKm: definition.distanceKm,
    fare: definition.fare,
    operatorName: definition.operatorName,
    title: `${origin.name} — ${destination.name}`
  });

  return [
    createRoute(definition.cityA, definition.cityB),
    createRoute(definition.cityB, definition.cityA)
  ];
}

export function createBidirectionalRoadConnections(definition: BidirectionalRoadDefinition): IntercityRoadConnection[] {
  const shared = {
    distanceKm: definition.distanceKm,
    durationMinutes: definition.durationMinutes,
    roadCost: definition.roadCost
  };

  return [
    { originCityId: definition.cityAId, destinationCityId: definition.cityBId, ...shared },
    { originCityId: definition.cityBId, destinationCityId: definition.cityAId, ...shared }
  ];
}

function connectionKey(originCityId: CityId, destinationCityId: CityId): string {
  return `${String(originCityId)}>${String(destinationCityId)}`;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be greater than zero.`);
}

export function createIntercityNetwork(input: {
  cityRegistry: CityRegistry;
  routes: readonly IntercityRoute[];
  roadConnections: readonly IntercityRoadConnection[];
  accommodations: readonly TemporaryAccommodation[];
}): IntercityNetwork {
  const routeIds = new Set<string>();
  for (const route of input.routes) {
    const id = String(route.id);
    if (routeIds.has(id)) throw new Error(`Duplicate intercity route id: ${id}`);
    routeIds.add(id);

    if (!input.cityRegistry.getCity(route.originCityId) || !input.cityRegistry.getCity(route.destinationCityId)) {
      throw new Error(`Route ${id} points to an unknown city.`);
    }
    if (route.originCityId === route.destinationCityId) throw new Error(`Route ${id} cannot connect a city to itself.`);

    const originTerminal = input.cityRegistry.getLocation(route.originTerminalLocationId);
    const destinationTerminal = input.cityRegistry.getLocation(route.destinationTerminalLocationId);
    if (!originTerminal || originTerminal.cityId !== route.originCityId) {
      throw new Error(`Route ${id} has an invalid origin terminal.`);
    }
    if (!destinationTerminal || destinationTerminal.cityId !== route.destinationCityId) {
      throw new Error(`Route ${id} has an invalid destination terminal.`);
    }

    assertPositive(route.durationMinutes, `Route ${id} duration`);
    assertPositive(route.distanceKm, `Route ${id} distance`);
    assertPositive(route.fare, `Route ${id} fare`);
  }

  const roadByKey = new Map<string, IntercityRoadConnection>();
  for (const connection of input.roadConnections) {
    const key = connectionKey(connection.originCityId, connection.destinationCityId);
    if (roadByKey.has(key)) throw new Error(`Duplicate road connection: ${key}`);
    if (!input.cityRegistry.getCity(connection.originCityId) || !input.cityRegistry.getCity(connection.destinationCityId)) {
      throw new Error(`Road connection ${key} points to an unknown city.`);
    }
    if (connection.originCityId === connection.destinationCityId) throw new Error(`Road connection ${key} cannot connect a city to itself.`);
    assertPositive(connection.durationMinutes, `Road connection ${key} duration`);
    assertPositive(connection.distanceKm, `Road connection ${key} distance`);
    if (!Number.isFinite(connection.roadCost) || connection.roadCost < 0) throw new Error(`Road connection ${key} cost cannot be negative.`);
    roadByKey.set(key, connection);
  }

  const accommodationIds = new Set<string>();
  for (const accommodation of input.accommodations) {
    const id = String(accommodation.id);
    if (accommodationIds.has(id)) throw new Error(`Duplicate accommodation id: ${id}`);
    accommodationIds.add(id);
    const location = input.cityRegistry.getLocation(accommodation.locationId);
    if (!location || location.cityId !== accommodation.cityId || location.districtId !== accommodation.districtId) {
      throw new Error(`Accommodation ${id} has an invalid location.`);
    }
  }

  const routeById = new Map(input.routes.map((route) => [route.id, route]));
  const accommodationById = new Map(input.accommodations.map((entry) => [entry.id, entry]));
  const routesByOriginCityId = new Map(input.cityRegistry.cities.map((city) => [
    city.id,
    input.routes.filter((route) => route.originCityId === city.id)
  ]));
  const roadsByOriginCityId = new Map(input.cityRegistry.cities.map((city) => [
    city.id,
    input.roadConnections.filter((entry) => entry.originCityId === city.id)
  ]));

  return {
    routes: [...input.routes],
    roadConnections: [...input.roadConnections],
    accommodations: [...input.accommodations],
    getRouteById: (id) => id ? routeById.get(id) : undefined,
    getAccommodationById: (id) => id ? accommodationById.get(id) : undefined,
    getRoadConnection: (originCityId, destinationCityId) => roadByKey.get(connectionKey(originCityId, destinationCityId)),
    getRoutesFromCity: (originCityId) => [...(routesByOriginCityId.get(originCityId) ?? [])],
    getRoadConnectionsFromCity: (originCityId) => [...(roadsByOriginCityId.get(originCityId) ?? [])]
  };
}
