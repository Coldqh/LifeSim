import { describe, expect, it } from 'vitest';
import { applySocialEventChoice, expireActiveSocialEvent } from '../events';
import { createInitialSocialState } from '../relationships';
import { createInitialBoxingProfile } from '../sport';
import { npcStoryChains, npcStoryEventTemplates, NPC_STORY_EVENT_IDS } from '../../data/social/npcStoryChains';
import type { CityId, DegreeProgramId, DistrictId, LocationId, NpcId, PlayerId, SkillId, UniversitySubjectId } from '../../types/ids';
import type { HousingId } from '../../types/housing';
import type { Npc } from '../../types/npc';
import type { Player } from '../../types/player';
import type { UniversityState, UniversitySubjectDefinition } from '../../types/university';
import { applyNpcStoryEffect, maybeActivateNpcStory } from './index';

const asId = <T>(value: string) => value as T;

function npc(id: string, activityProfile: Npc['activityProfile'] = 'student'): Npc {
  return {
    id: asId<NpcId>(id),
    firstName: 'Илья',
    lastName: 'Тестов',
    age: 20,
    homeDistrictId: asId<DistrictId>('district'),
    activityProfile,
    activationDay: 1,
    preferredLocationTypes: ['university'],
    personality: { sociability: 50, temperament: 50, reliability: 50, ambition: 50, generosity: 50, interests: ['education'] },
    life: { energy: 80, health: 90, money: 10000, reliability: 50, studyProgress: 0, missedCommitments: 0, warningCount: 0, jobSearchDays: 0, lastProcessedDay: 1 },
    worldState: { kind: 'home', sinceTotalMinutes: 0 }
  };
}

function player(): Player {
  return {
    id: asId<PlayerId>('player'),
    name: 'Игрок',
    age: 19,
    birthDate: { year: 2007, month: 1, dayOfMonth: 1 },
    money: 1000,
    cityId: asId<CityId>('city'),
    districtId: asId<DistrictId>('district'),
    locationId: asId<LocationId>('home'),
    needs: { hunger: 60, thirst: 60, energy: 80, health: 90, mood: 50 },
    skills: {},
    inventory: [],
    completedShifts: {},
    jobExperience: {},
    jobLevels: {},
    qualifications: [],
    housingId: asId<HousingId>('housing'),
    rentDebt: 0,
    daysUntilRent: 10,
    rentalContract: { housingId: asId<HousingId>('housing'), startedDay: 1, nextPaymentDay: 10, depositPaid: 0 },
    boxing: createInitialBoxingProfile()
  };
}

function universityState(subjectId: UniversitySubjectId): UniversityState {
  return {
    applications: [],
    enrollment: {
      programId: asId<DegreeProgramId>('program'),
      startedDay: 1,
      semester: 1,
      tuitionPaidThroughSemester: 1,
      studyLoad: 20,
      subjectProgress: {
        [subjectId]: { classesAttended: 0, classesMissed: 0, assignmentsCompleted: 0, knowledge: 12 }
      },
      assignments: [],
      attendedSessionKeys: [],
      missedSessionKeys: [],
      examsPassed: 0,
      completed: false
    },
    history: [],
    lastProcessedTotalMinutes: 0
  };
}

describe('NPC story chains', () => {
  it('activates one eligible root story with a response deadline', () => {
    const student = npc('student');
    const social = maybeActivateNpcStory({
      social: createInitialSocialState(0),
      currentTotalMinutes: 420,
      templates: npcStoryEventTemplates,
      chains: npcStoryChains,
      universityCandidates: [student],
      workCandidates: [npc('worker', 'worker')],
      boxingCandidates: []
    });

    expect(social.activeEvent).toMatchObject({
      templateId: NPC_STORY_EVENT_IDS.universityRoot,
      npcId: student.id,
      source: 'story',
      storyChainId: 'university_peer',
      storyStep: 1,
      expiresAtTotalMinutes: 1140
    });
  });

  it('stores the choice in NPC memory and schedules the next step', () => {
    const student = npc('student');
    const social = maybeActivateNpcStory({
      social: createInitialSocialState(0),
      currentTotalMinutes: 420,
      templates: npcStoryEventTemplates,
      chains: npcStoryChains,
      universityCandidates: [student],
      workCandidates: [],
      boxingCandidates: []
    });
    const result = applySocialEventChoice({
      player: player(),
      time: { day: 1, hour: 7, minute: 0, weekday: 'monday', calendar: { year: 2026, month: 9, dayOfMonth: 7, season: 'autumn' } },
      social,
      npc: student,
      choiceId: 'npc_story_university_help'
    });

    expect(result.result.ok).toBe(true);
    expect(result.social.relationships[String(student.id)]?.memories[0]?.key).toBe('npc_story_university_helped');
    expect(result.social.scheduledEvents[0]).toMatchObject({
      templateId: NPC_STORY_EVENT_IDS.universityFollowUp,
      npcId: student.id,
      dueDay: 2
    });
  });

  it('applies the hidden expiry consequence when the deadline passes', () => {
    const student = npc('student');
    const social = maybeActivateNpcStory({
      social: createInitialSocialState(0),
      currentTotalMinutes: 420,
      templates: npcStoryEventTemplates,
      chains: npcStoryChains,
      universityCandidates: [student],
      workCandidates: [],
      boxingCandidates: []
    });
    const expired = expireActiveSocialEvent({ social, currentTotalMinutes: 1140, npcs: [student] });

    expect(expired.social.activeEvent).toBeUndefined();
    expect(expired.social.relationships[String(student.id)]?.memories[0]?.key).toBe('npc_story_university_ignored');
    expect(expired.social.history[0]?.text).toContain('не ответил');
  });

  it('applies university and boxing story effects through their domain systems', () => {
    const subjectId = asId<UniversitySubjectId>('subject');
    const subjects: UniversitySubjectDefinition[] = [{
      id: subjectId,
      title: 'Алгоритмы',
      skillId: asId<SkillId>('skill'),
      weekday: 'monday',
      startMinute: 600,
      durationMinutes: 90,
      experienceReward: 10
    }];
    const basePlayer = player();
    const study = applyNpcStoryEffect({
      effect: { kind: 'university_knowledge', knowledgeDelta: 8, studyLoadDelta: 4 },
      player: basePlayer,
      university: universityState(subjectId),
      universitySubjects: subjects,
      currentTotalMinutes: 500
    });
    const boxing = applyNpcStoryEffect({
      effect: { kind: 'boxing_progress', stat: 'defense', statDelta: 1, formDelta: 2, fatigueDelta: 7 },
      player: study.player,
      university: study.university,
      universitySubjects: subjects,
      currentTotalMinutes: 500
    });

    expect(study.university.enrollment?.subjectProgress[subjectId]?.knowledge).toBe(20);
    expect(study.university.enrollment?.studyLoad).toBe(24);
    expect(boxing.player.boxing.stats.defense).toBe(basePlayer.boxing.stats.defense + 1);
    expect(boxing.player.boxing.fatigue).toBe(7);
  });
});
