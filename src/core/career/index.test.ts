import { describe, expect, it } from 'vitest';
import { createInitialPlayer } from '../../state/gameState';
import { professionalJobs } from '../../data/career/professionalJobs';
import { getDegreeProgramById, getUniversityById } from '../../data/cities/contentSelectors';
import { createInitialTime } from '../time';
import {
  getCareerApplicationFailure,
  getCareerResume,
  issueDegreeQualification,
  processCareerTime,
  resignCareerEmployment,
  startCareerEmployment
} from './index';

describe('career foundation', () => {
  it('requires the phone flow and a matching diploma for professional vacancies', () => {
    const player = createInitialPlayer();
    const job = professionalJobs[0];

    expect(getCareerApplicationFailure(player, job, 'direct')).toContain('приложение');
    expect(getCareerApplicationFailure(player, job, 'phone')).toContain('диплом');
  });

  it('issues one degree qualification and unlocks a matching vacancy', () => {
    const player = createInitialPlayer();
    const job = professionalJobs[0];
    const programId = job.requirements?.acceptedDegreeProgramIds?.[0];
    const program = getDegreeProgramById(programId);
    const university = getUniversityById(program?.universityId);
    expect(program).toBeDefined();
    expect(university).toBeDefined();

    const issued = issueDegreeQualification({
      player,
      program: program!,
      university: university!,
      time: createInitialTime()
    });
    const duplicate = issueDegreeQualification({
      player: issued.player,
      program: program!,
      university: university!,
      time: createInitialTime()
    });

    expect(issued.created).toBe(true);
    expect(issued.player.qualifications).toHaveLength(1);
    expect(duplicate.created).toBe(false);
    expect(duplicate.player.qualifications).toHaveLength(1);
    expect(getCareerApplicationFailure(issued.player, job, 'phone')).toBeUndefined();
  });

  it('tracks probation, completion and resignation in employment history', () => {
    const job = professionalJobs[0];
    const started = startCareerEmployment({ player: createInitialPlayer(), job, currentDay: 10 });

    expect(started.currentJobId).toBe(job.id);
    expect(started.career?.activeEmployment?.status).toBe('probation');
    expect(started.career?.activeEmployment?.probationEndsDay).toBe(40);

    const beforeEnd = processCareerTime({ player: started, currentDay: 39 });
    expect(beforeEnd.player.career?.activeEmployment?.status).toBe('probation');

    const completed = processCareerTime({ player: beforeEnd.player, currentDay: 40 });
    expect(completed.completedProbationJobId).toBe(job.id);
    expect(completed.player.career?.activeEmployment?.status).toBe('active');

    const resigned = resignCareerEmployment({ player: completed.player, currentDay: 45 });
    expect(resigned.player.currentJobId).toBeUndefined();
    expect(resigned.player.career?.activeEmployment).toBeUndefined();
    expect(resigned.player.career?.employmentHistory[0]).toMatchObject({
      jobId: job.id,
      status: 'ended',
      endReason: 'resigned',
      endedDay: 45
    });
  });

  it('builds a resume from qualifications, employment and completed shifts', () => {
    const job = professionalJobs[0];
    const player = startCareerEmployment({
      player: { ...createInitialPlayer(), completedShifts: { [job.id]: 7 } },
      job,
      currentDay: 3
    });
    const resume = getCareerResume(player);

    expect(resume.activeEmployment?.jobId).toBe(job.id);
    expect(resume.employmentHistory).toHaveLength(1);
    expect(resume.completedShiftCount).toBe(7);
  });
});
