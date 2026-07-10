import type { LocationId } from '../../types/ids';
import type { LocationPopulationPresence, PopulationState, PopulationSummary } from '../../types/population';

export function getLocationPopulationPresence(population: PopulationState, locationId: LocationId | undefined): LocationPopulationPresence | undefined {
  if (!locationId) return undefined;
  const present = population.npcs.filter((npc) => npc.worldState.kind === 'at_location' && npc.worldState.locationId === locationId);
  const staff = present.filter((npc) => npc.worldState.kind === 'at_location' && npc.worldState.purpose === 'work');
  const visitors = present.filter((npc) => npc.worldState.kind === 'at_location' && npc.worldState.purpose === 'visit');

  return {
    locationId,
    staff,
    visitors,
    total: present.length
  };
}

export function getPopulationSummary(population: PopulationState, currentDay: number): PopulationSummary {
  return population.npcs.reduce<PopulationSummary>((summary, npc) => {
    summary.total += 1;
    if (npc.employment) summary.employed += 1;
    if (npc.activationDay <= currentDay) summary.activeResidents += 1;
    else summary.inactiveResidents += 1;

    if (npc.worldState.kind === 'travelling') summary.travelling += 1;
    else if (npc.worldState.kind === 'home') summary.atHome += 1;
    else summary.inPublicLocations += 1;

    return summary;
  }, {
    total: 0,
    employed: 0,
    activeResidents: 0,
    inactiveResidents: 0,
    travelling: 0,
    atHome: 0,
    inPublicLocations: 0
  });
}
