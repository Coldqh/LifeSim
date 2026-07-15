import { describe, expect, it } from 'vitest';
import { issueDegreeQualification } from '../../core/career';
import { professionalJobs } from '../../data/career/professionalJobs';
import { getAllJobs, getDegreeProgramById, getUniversityById } from '../../data/cities/contentSelectors';
import type { PlayerSkills } from '../../types/skill';
import { createInitialGameState, type GameState } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { createGameCommands } from './createGameCommands';

function createHarness(initialState = createInitialGameState()) {
  let state: GameState = initialState;
  const setGameState: GameStateSetter = (update) => {
    state = typeof update === 'function' ? update(state) : update;
  };
  return {
    getState: () => state,
    setState: (nextState: GameState) => { state = nextState; },
    commands: createGameCommands(setGameState)
  };
}

describe('career commands', () => {
  it('blocks professional applications without a diploma and accepts a qualified resume', () => {
    const harness = createHarness();
    const job = professionalJobs[0];

    harness.commands.submitJobApplication(job.id);
    expect(harness.getState().lastResult?.ok).toBe(false);
    expect(harness.getState().world.phone.applications).toHaveLength(0);

    const program = getDegreeProgramById(job.requirements?.acceptedDegreeProgramIds?.[0]);
    const university = getUniversityById(program?.universityId);
    expect(program).toBeDefined();
    expect(university).toBeDefined();
    const qualified = issueDegreeQualification({
      player: harness.getState().player,
      program: program!,
      university: university!,
      time: harness.getState().time
    }).player;
    const skills: PlayerSkills = { ...qualified.skills };
    for (const requirement of job.requirements?.skills ?? []) {
      skills[requirement.skillId] = { level: requirement.minLevel, experience: 0 };
    }
    harness.setState({ ...harness.getState(), player: { ...qualified, skills } });

    harness.commands.submitJobApplication(job.id);
    expect(harness.getState().lastResult?.ok).toBe(true);
    expect(harness.getState().world.phone.applications[0]).toMatchObject({ jobId: job.id, status: 'submitted' });
  });

  it('keeps ordinary direct jobs and records them in career history', () => {
    const harness = createHarness();
    const job = getAllJobs().find((entry) => entry.applicationMode !== 'interview');
    expect(job).toBeDefined();

    harness.commands.applyForJob(job!.id);

    expect(harness.getState().player.currentJobId).toBe(job!.id);
    expect(harness.getState().player.career?.activeEmployment).toMatchObject({
      jobId: job!.id,
      employmentType: 'casual',
      status: 'active'
    });
  });
});
