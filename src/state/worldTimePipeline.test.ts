import { describe, expect, it } from 'vitest';
import { addMinutes, getTotalMinutes } from '../core/time';
import { professionalJobs } from '../data/career/professionalJobs';
import { startCareerEmployment } from '../core/career';
import { createInitialGameState } from './gameState';
import { submitPhoneJobApplication } from '../core/phone';
import { getAllJobs, getCareerCompanyById } from '../data/cities/contentSelectors';
import { getLocationById } from '../core/location';
import { getContextualStoryDefinition } from '../data/contextualStories';
import { advanceWorldTime } from './worldTimePipeline';

describe('advanceWorldTime', () => {
  it('processes every time-driven world system in one advancement', () => {
    const state = createInitialGameState();
    const nextTime = addMinutes(state.time, 120);
    const currentTotalMinutes = getTotalMinutes(nextTime);

    const result = advanceWorldTime({
      state,
      player: state.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });

    expect(result.world.phone.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.social.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.university.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.medical.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.intercity.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.atlas.lastProcessedTotalMinutes).toBe(currentTotalMinutes);
    expect(result.world.atlas.cityStates.moscow.tier).toBe('active');
    expect(result.world.atlas.cityStates.yaroslavl.tier).toBe('regional');
    expect(result.world.atlas.cityStates.rybinsk.tier).toBe('regional');
    expect(result.player.needs.hunger).toBeLessThan(state.player.needs.hunger);
  });


  it('advances autonomous NPC daily state when a day passes', () => {
    const state = createInitialGameState();
    const trackedNpc = state.world.population.npcs.find((npc) => npc.activityProfile === 'student' || npc.activityProfile === 'unemployed');
    expect(trackedNpc).toBeDefined();

    const nextTime = addMinutes(state.time, 24 * 60);
    const result = advanceWorldTime({
      state,
      player: state.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });
    const updated = result.world.population.npcs.find((npc) => npc.id === trackedNpc?.id);

    expect(updated?.life.lastProcessedDay).toBe(nextTime.day);
    expect(updated?.life.lastOutcome?.day).toBe(nextTime.day);
  });

  it('creates visible autonomous world news when several days pass', () => {
    const state = createInitialGameState();
    const nextTime = addMinutes(state.time, 5 * 24 * 60);
    const result = advanceWorldTime({
      state,
      player: state.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });

    expect(result.world.dynamics.lastProcessedDay).toBe(nextTime.day);
    expect(result.world.dynamics.history.length).toBeGreaterThan(0);
    expect(result.world.phone.notifications.some((entry) => Boolean(entry.worldNewsId))).toBe(true);
    expect(result.lifeLogEntries.some((entry) => result.world.dynamics.history.some((news) => news.title === entry.title))).toBe(true);
  });

  it('expires contextual stories through the shared world time pipeline', () => {
    const state = createInitialGameState();
    const definition = getContextualStoryDefinition('story_finance_short_gig');
    if (!definition) throw new Error('Missing contextual story definition');
    state.world.contextualStories.activeEvents = [{
      id: 'context_story_pipeline_test', templateId: definition.id, category: definition.category, tone: definition.tone,
      source: 'world', title: definition.title, text: definition.text, startedDay: state.time.day,
      dueDay: state.time.day, defaultChoiceId: definition.defaultChoiceId, choices: definition.choices,
      districtId: state.player.districtId
    }];

    const nextTime = addMinutes(state.time, 24 * 60);
    const result = advanceWorldTime({ state, player: state.player, nextTime, decayProfile: 'resting', actionTitle: 'Ожидание' });

    expect(result.world.contextualStories.activeEvents.some((entry) => entry.id === 'context_story_pipeline_test')).toBe(false);
    expect(result.world.contextualStories.history.some((entry) => entry.eventId === 'context_story_pipeline_test' && entry.expired)).toBe(true);
    expect(result.lifeLogEntries.some((entry) => entry.title === definition.title && entry.text.includes('Срок ответа истёк'))).toBe(true);
    expect(result.world.phone.notifications.some((entry) => entry.title === 'История продолжилась без тебя')).toBe(true);
  });

  it('accrues household bills after a day passes and does not apply them twice', () => {
    const state = createInitialGameState();
    const nextTime = addMinutes(state.time, 24 * 60);
    const initialOutstanding = state.world.household.bills.reduce((sum, bill) => sum + bill.accrued + bill.debt, 0);

    const first = advanceWorldTime({
      state,
      player: state.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });
    const firstOutstanding = first.world.household.bills.reduce((sum, bill) => sum + bill.accrued + bill.debt, 0);

    expect(first.world.finance.lastProcessedDay).toBe(nextTime.day);
    expect(first.world.household.lastProcessedDay).toBe(nextTime.day);
    expect(firstOutstanding).toBeGreaterThan(initialOutstanding);

    const committedState = {
      ...state,
      player: first.player,
      time: nextTime,
      world: first.world
    };
    const second = advanceWorldTime({
      state: committedState,
      player: committedState.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });
    const secondOutstanding = second.world.household.bills.reduce((sum, bill) => sum + bill.accrued + bill.debt, 0);

    expect(second.player.money).toBe(first.player.money);
    expect(secondOutstanding).toBe(firstOutstanding);
    expect(second.world.finance.transactions).toHaveLength(first.world.finance.transactions.length);
    expect(second.world.phone.lastProcessedTotalMinutes).toBe(getTotalMinutes(nextTime));
  });

  it('advances player age exactly on the stored birthday', () => {
    const state = createInitialGameState();
    const beforeBirthday = {
      ...state,
      time: { ...state.time, day: 347, calendar: { year: 2027, month: 8, dayOfMonth: 19, season: 'summer' as const } },
      player: { ...state.player, age: 18 }
    };
    const nextTime = addMinutes(beforeBirthday.time, 24 * 60);
    const result = advanceWorldTime({
      state: beforeBirthday,
      player: beforeBirthday.player,
      nextTime,
      decayProfile: 'resting',
      actionTitle: 'Ожидание'
    });

    expect(result.player.age).toBe(19);
    expect(result.lifeLogEntries.some((entry) => entry.title === 'День рождения')).toBe(true);
  });

  it('keeps non-active city NPC details frozen while the active city advances', () => {
    const state = createInitialGameState();
    const remoteNpc = state.world.population.npcs.find((npc) => String(npc.homeDistrictId).startsWith('yar_'));
    expect(remoteNpc).toBeDefined();

    const result = advanceWorldTime({
      state,
      player: state.player,
      nextTime: addMinutes(state.time, 180),
      decayProfile: 'active',
      actionTitle: 'Ожидание'
    });
    const remoteAfter = result.world.population.npcs.find((npc) => npc.id === remoteNpc?.id);

    expect(remoteAfter).toBe(remoteNpc);
    expect(result.world.atlas.cityStates.yaroslavl.lastProcessedDay).toBe(state.time.day);
  });

  it('completes a career probation period through the world time pipeline', () => {
    const state = createInitialGameState();
    const job = professionalJobs[0];
    const started = startCareerEmployment({ player: state.player, job, currentDay: state.time.day });
    const player = {
      ...started,
      career: started.career?.activeEmployment ? {
        ...started.career,
        activeEmployment: { ...started.career.activeEmployment, probationEndsDay: state.time.day + 1 },
        employmentHistory: started.career.employmentHistory.map((entry) => (
          entry.id === started.career?.activeEmployment?.id ? { ...entry, probationEndsDay: state.time.day + 1 } : entry
        ))
      } : started.career
    };
    const nextTime = addMinutes(state.time, 24 * 60);
    const result = advanceWorldTime({ state: { ...state, player }, player, nextTime, decayProfile: 'resting', actionTitle: 'Ожидание' });

    expect(result.player.career?.activeEmployment?.status).toBe('active');
    expect(result.lifeLogEntries.some((entry) => entry.title === 'Карьера')).toBe(true);
  });


  it('lets the job market close a vacancy and rejects a pending player application', () => {
    const state = createInitialGameState();
    const job = getAllJobs()[0];
    const submittedPhone = submitPhoneJobApplication({
      state: state.world.phone,
      job,
      currentTotalMinutes: getTotalMinutes(state.time),
      employerName: getCareerCompanyById(job.companyId)?.name ?? getLocationById(job.locationId)?.name ?? 'Работодатель'
    }).state;
    const listing = state.world.opportunities.jobListings[String(job.id)];
    const prepared = {
      ...state,
      world: {
        ...state.world,
        phone: submittedPhone,
        opportunities: {
          ...state.world.opportunities,
          jobListings: {
            ...state.world.opportunities.jobListings,
            [String(job.id)]: { ...listing, closesDay: state.time.day + 1 }
          }
        }
      }
    };
    const nextTime = addMinutes(state.time, 24 * 60);
    const result = advanceWorldTime({ state: prepared, player: prepared.player, nextTime, decayProfile: 'resting', actionTitle: 'Ожидание' });

    expect(result.world.opportunities.jobListings[String(job.id)].status).not.toBe('open');
    expect(result.world.phone.applications[0].status).toBe('rejected');
    expect(result.world.phone.messages.some((entry) => entry.subject === 'Вакансия закрыта')).toBe(true);
    expect(result.lifeLogEntries.some((entry) => entry.title === 'Вакансия занята' || entry.title === 'Поиск сотрудника завершён')).toBe(true);
  });

});
