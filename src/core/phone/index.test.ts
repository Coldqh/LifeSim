import { describe, expect, it } from 'vitest';
import { getAllJobs } from '../../data/cities/contentSelectors';
import { createInitialPhoneState, submitPhoneJobApplication } from './index';

describe('phone job applications under world conditions', () => {
  it('stores the hiring climate and changes response time for a new application', () => {
    const job = getAllJobs()[0];
    const currentTotalMinutes = 600;
    const normal = submitPhoneJobApplication({
      state: createInitialPhoneState(currentTotalMinutes),
      job,
      currentTotalMinutes,
      employerName: 'Работодатель'
    });
    const slowdown = submitPhoneJobApplication({
      state: createInitialPhoneState(currentTotalMinutes),
      job,
      currentTotalMinutes,
      employerName: 'Работодатель',
      responseDelayMultiplier: 1.4,
      inviteChanceDelta: -20
    });

    expect(slowdown.state.applications[0].responseAtTotalMinutes)
      .toBeGreaterThan(normal.state.applications[0].responseAtTotalMinutes);
    expect(slowdown.state.applications[0].inviteChanceDelta).toBe(-20);
  });
});
