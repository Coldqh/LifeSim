import { describe, expect, it } from 'vitest';
import type { JobId } from '../types/ids';
import { createInitialGameState } from './gameState';
import { applyLifeProgression } from './lifeProgression';

describe('life progression state integration', () => {
  it('records a new status once when real career activity crosses a threshold', () => {
    const state = createInitialGameState();
    const jobId = 'job_progression_test' as JobId;
    const progressed = applyLifeProgression({
      ...state,
      player: {
        ...state.player,
        completedShifts: { ...state.player.completedShifts, [jobId]: 5 }
      }
    });
    const repeated = applyLifeProgression(progressed);

    expect(progressed.progression.tracks.career).toMatchObject({ xp: 50, level: 1 });
    expect(progressed.lifeLog.filter((entry) => entry.title === 'Развитие')).toHaveLength(1);
    expect(repeated.lifeLog.filter((entry) => entry.title === 'Развитие')).toHaveLength(1);
  });

  it('turns missed interviews into a lasting state visible outside the phone event', () => {
    const state = createInitialGameState();
    const progressed = applyLifeProgression({
      ...state,
      world: {
        ...state.world,
        phone: {
          ...state.world.phone,
          applications: [{
            id: 'application_progression_test' as typeof state.world.phone.applications[number]['id'],
            jobId: 'job_progression_test' as JobId,
            status: 'missed',
            submittedAtTotalMinutes: 0,
            responseAtTotalMinutes: 60
          }]
        }
      }
    });

    expect(progressed.progression.consequences[0]?.kind).toBe('career_unreliable');
    expect(progressed.lifeLog[0]?.title).toBe('Ненадёжный кандидат');
  });
});
