import { describe, expect, it } from 'vitest';
import { createInitialSocialState } from '../relationships';
import { applySocialEventChoice, expireActiveSocialEvent } from '../events';
import { createSocialGroupView, getSocialGroupAcceptance, maybeActivateSocialGroupEvent } from './index';
import { socialGroupDefinitions, socialGroupEventTemplates } from '../../data/social/socialGroups';
import type { Npc } from '../../types/npc';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';

function npc(id: string, profile: Npc['activityProfile'] = 'student'): Npc {
  return {
    id: id as Npc['id'],
    firstName: id,
    lastName: 'Test',
    age: 20,
    homeDistrictId: 'district' as Npc['homeDistrictId'],
    activityProfile: profile,
    activationDay: 1,
    preferredLocationTypes: [],
    personality: { sociability: 50, temperament: 50, reliability: 50, ambition: 50, generosity: 50, interests: [] },
    life: { energy: 80, health: 90, money: 10000, reliability: 50, studyProgress: 0, missedCommitments: 0, warningCount: 0, jobSearchDays: profile === 'unemployed' ? 1 : 0, lastProcessedDay: 1 },
    worldState: { kind: 'home', sinceTotalMinutes: 0 }
  };
}

const player = {
  money: 5000,
  needs: { hunger: 80, thirst: 80, energy: 80, health: 80, mood: 60 }
} as Player;
const time = { day: 1, hour: 10, minute: 0 } as GameTime;

describe('social groups', () => {
  it('maps reputation to acceptance levels', () => {
    expect(getSocialGroupAcceptance(10)).toBe('outsider');
    expect(getSocialGroupAcceptance(50)).toBe('accepted');
    expect(getSocialGroupAcceptance(90)).toBe('core');
  });

  it('derives group reputation from member relationships', () => {
    const member = npc('student');
    const social = createInitialSocialState(0);
    social.relationships[String(member.id)] = {
      npcId: member.id,
      familiarity: 60,
      affinity: 50,
      trust: 40,
      tension: 0,
      romance: 0,
      romanceStatus: 'none',
      interactionCount: 4,
      memories: []
    };
    const view = createSocialGroupView({ definition: socialGroupDefinitions[0], social, members: [member] });
    expect(view.reputation).toBeGreaterThan(65);
    expect(view.knownMemberCount).toBe(1);
  });

  it('activates a group event and applies the result to all members', () => {
    const first = npc('first');
    const second = npc('second');
    const social = maybeActivateSocialGroupEvent({
      social: createInitialSocialState(0),
      currentTotalMinutes: 600,
      definitions: [socialGroupDefinitions[0]],
      templates: socialGroupEventTemplates,
      membersByGroup: {
        university_group: [first, second],
        work_team: [],
        boxing_gym: []
      }
    });
    expect(social.activeEvent?.source).toBe('group');
    expect(social.activeEvent?.groupMemberIds).toHaveLength(2);

    const applied = applySocialEventChoice({
      player,
      time,
      social,
      npc: first,
      choiceId: 'group_university_organize'
    });
    expect(applied.result.ok).toBe(true);
    expect(applied.social.relationships[String(first.id)]?.memories[0]?.key).toBe('university_group_organized_study');
    expect(applied.social.relationships[String(second.id)]?.trust).toBeGreaterThan(0);
  });

  it('spreads an expired group request to every member', () => {
    const first = npc('first');
    const second = npc('second');
    const social = maybeActivateSocialGroupEvent({
      social: createInitialSocialState(0),
      currentTotalMinutes: 600,
      definitions: [socialGroupDefinitions[0]],
      templates: socialGroupEventTemplates,
      membersByGroup: {
        university_group: [first, second],
        work_team: [],
        boxing_gym: []
      }
    });
    const expired = expireActiveSocialEvent({
      social,
      currentTotalMinutes: social.activeEvent?.expiresAtTotalMinutes ?? 2000,
      npcs: [first, second]
    });
    expect(expired.social.activeEvent).toBeUndefined();
    expect(expired.social.relationships[String(first.id)]?.memories[0]?.key).toBe('university_group_ignored_group_request');
    expect(expired.social.relationships[String(second.id)]?.tension).toBeGreaterThan(0);
  });

});
