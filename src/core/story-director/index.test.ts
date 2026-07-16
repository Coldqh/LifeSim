import { describe, expect, it } from 'vitest';
import { contextualStoryDefinitions, getContextualStoryDefinition } from '../../data/contextualStories';
import { getHouseholdFoodUnits } from '../household';
import { createInitialGameState } from '../../state/gameState';
import type { ActiveContextualStory, ContextualStoryState } from '../../types/contextualStory';
import type { NpcId } from '../../types/ids';
import { createInitialRelationship } from '../relationships';
import { createInitialContextualStoryState, processContextualStoryTime, resolveContextualStoryEvent } from './index';

function domainsFromInitial() {
  const game = createInitialGameState();
  return {
    game,
    domains: {
      player: game.player,
      university: game.world.university,
      household: game.world.household,
      social: game.world.social,
      organizations: game.world.organizations,
      districtEcosystem: game.world.districtEcosystem,
      population: game.world.population
    }
  };
}

function activeFromTemplate(templateId: string, day: number, extra: Partial<ActiveContextualStory> = {}): ActiveContextualStory {
  const definition = getContextualStoryDefinition(templateId);
  if (!definition) throw new Error(`Missing template ${templateId}`);
  return {
    id: `event_${templateId}_${day}`,
    templateId,
    category: definition.category,
    tone: definition.tone,
    source: 'world',
    title: definition.title,
    text: definition.text,
    startedDay: day,
    dueDay: day + definition.responseDays,
    defaultChoiceId: definition.defaultChoiceId,
    choices: definition.choices,
    ...extra
  };
}

function isolateTemplate(state: ContextualStoryState, templateId: string, day: number): ContextualStoryState {
  const cooldowns = Object.fromEntries(
    contextualStoryDefinitions
      .filter((entry) => entry.trigger !== 'follow_up' && entry.id !== templateId)
      .map((entry) => [entry.id, day])
  );
  return { ...state, cooldowns };
}

describe('contextual story director', () => {
  it('creates a real pantry story from an empty household state', () => {
    const { game, domains } = domainsFromInitial();
    const state = isolateTemplate(createInitialContextualStoryState(1, game.time.day), 'story_housing_empty_pantry', game.time.day);
    const applied = processContextualStoryTime({ ...domains, household: { ...domains.household, pantry: [] }, state, fromDay: game.time.day, toDay: game.time.day + 1 });

    expect(applied.startedEvents).toHaveLength(1);
    expect(applied.startedEvents[0].templateId).toBe('story_housing_empty_pantry');
    expect(applied.state.activeEvents).toHaveLength(1);
  });

  it('applies money, household supplies and history through a choice', () => {
    const { game, domains } = domainsFromInitial();
    const event = activeFromTemplate('story_housing_empty_pantry', game.time.day, { districtId: game.player.districtId });
    const state = { ...createInitialContextualStoryState(21, game.time.day), activeEvents: [event] };
    const applied = resolveContextualStoryEvent({ ...domains, household: { ...domains.household, pantry: [] }, state, eventId: event.id, choiceId: 'bulk_buy', day: game.time.day });

    expect(applied && !('failure' in applied)).toBe(true);
    if (!applied || 'failure' in applied) return;
    expect(applied.player.money).toBe(game.player.money - 1100);
    expect(getHouseholdFoodUnits(applied.household, game.time.day)).toBe(5);
    expect(applied.state.activeEvents).toHaveLength(0);
    expect(applied.state.history[0]).toMatchObject({ templateId: 'story_housing_empty_pantry', choiceId: 'bulk_buy', expired: false });
  });

  it('stores NPC memory and schedules a follow-up after lending money', () => {
    const { game, domains } = domainsFromInitial();
    const npcId = domains.population.npcs[0].id as NpcId;
    const event = activeFromTemplate('story_social_friend_loan', game.time.day, { npcId });
    const state = { ...createInitialContextualStoryState(31, game.time.day), activeEvents: [event] };
    const social = { ...domains.social, relationships: { [String(npcId)]: { ...createInitialRelationship(npcId), familiarity: 30, trust: 25 } } };
    const applied = resolveContextualStoryEvent({ ...domains, social, state, eventId: event.id, choiceId: 'lend', day: game.time.day });

    expect(applied && !('failure' in applied)).toBe(true);
    if (!applied || 'failure' in applied) return;
    expect(applied.player.money).toBe(game.player.money - 1500);
    expect(applied.social.relationships[String(npcId)].memories[0].text).toContain('помог деньгами');
    expect(applied.state.scheduledEvents[0]).toMatchObject({ templateId: 'story_social_loan_followup', dueDay: game.time.day + 7, npcId });
  });

  it('resolves an ignored deadline automatically and preserves the consequence', () => {
    const { game, domains } = domainsFromInitial();
    const event = activeFromTemplate('story_finance_debt_call', game.time.day, { dueDay: game.time.day + 1 });
    const state = { ...createInitialContextualStoryState(41, game.time.day), activeEvents: [event] };
    const beforeDebt = domains.household.bills.find((bill) => bill.kind === 'water')?.debt ?? 0;
    const applied = processContextualStoryTime({ ...domains, state, fromDay: game.time.day, toDay: game.time.day + 2 });

    const afterDebt = applied.household.bills.find((bill) => bill.kind === 'water')?.debt ?? 0;
    expect(afterDebt).toBe(beforeDebt + 450);
    expect(applied.resolvedEntries[0]).toMatchObject({ templateId: 'story_finance_debt_call', choiceId: 'ignore', expired: true });
    expect(applied.state.activeEvents.some((entry) => entry.id === event.id)).toBe(false);
  });

  it('starts no more than one new root story per processed day', () => {
    const { game, domains } = domainsFromInitial();
    const applied = processContextualStoryTime({ ...domains, household: { ...domains.household, pantry: [], cleanliness: 20 }, state: createInitialContextualStoryState(57, game.time.day), fromDay: game.time.day, toDay: game.time.day + 1 });

    expect(applied.startedEvents.filter((entry) => entry.source === 'world').length).toBeLessThanOrEqual(1);
    expect(applied.state.activeEvents.length).toBeLessThanOrEqual(2);
  });
});
