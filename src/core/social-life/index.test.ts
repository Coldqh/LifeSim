import { describe, expect, it } from 'vitest';
import { createInitialGameState } from '../../state/gameState';
import { allLocations } from '../../data/locations';
import { socialMeetingTypes } from '../../data/social/meetingTypes';
import { getMeetingInviteFailure } from './index';

const MINUTES_IN_DAY = 24 * 60;

describe('NPC schedule in social life', () => {
  it('does not allow a meeting during a student commitment', () => {
    const state = createInitialGameState();
    const npc = state.world.population.npcs.find((entry) => entry.activityProfile === 'student');
    const meetingType = socialMeetingTypes.find((entry) => entry.locationTypes.includes('cafe'))!;
    const location = allLocations.find((entry) => entry.type === 'cafe')!;
    expect(npc).toBeDefined();

    const social = {
      ...state.world.social,
      contacts: {
        ...state.world.social.contacts,
        [String(npc!.id)]: { npcId: npc!.id, exchangedAtTotalMinutes: 0 }
      },
      relationships: {
        ...state.world.social.relationships,
        [String(npc!.id)]: {
          npcId: npc!.id,
          familiarity: 60,
          affinity: 40,
          trust: 30,
          tension: 0,
          romance: 0,
          romanceStatus: 'none' as const,
          interactionCount: 4,
          memories: []
        }
      }
    };

    const startsAt = (state.time.day - 1) * MINUTES_IN_DAY + 10 * 60;
    const failure = getMeetingInviteFailure({
      player: { ...state.player, money: 10_000 },
      social,
      npc: npc!,
      meetingType,
      location,
      startsAtTotalMinutes: startsAt,
      currentTotalMinutes: 0
    });

    expect(failure).toContain('учёбе');
  });
});
