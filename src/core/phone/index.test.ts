import { describe, expect, it } from 'vitest';
import { getAllJobs } from '../../data/cities/contentSelectors';
import { createInitialPhoneState, processPhoneTime, submitPhoneJobApplication } from './index';

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

  it('closes a pending application when the world fills the vacancy first', () => {
    const job = getAllJobs()[0];
    const submitted = submitPhoneJobApplication({
      state: createInitialPhoneState(600),
      job,
      currentTotalMinutes: 600,
      employerName: 'Работодатель'
    }).state;
    const processed = processPhoneTime({
      state: submitted,
      currentTotalMinutes: 660,
      jobs: [job],
      getEmployerName: () => 'Работодатель',
      isJobAvailable: () => false
    });

    expect(processed.applications[0].status).toBe('rejected');
    expect(processed.messages[0].subject).toBe('Вакансия закрыта');
    expect(processed.notifications[0].title).toBe('Возможность упущена');
  });

});
