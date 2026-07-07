import type { Job } from '../../types/job';
import type { JobId, LocationId } from '../../types/ids';

function jobId(value: string): JobId {
  return value as JobId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}

export const basicJobs: Job[] = [
  {
    id: jobId('job_barista_trainee'),
    title: 'Бариста-стажёр',
    category: 'service',
    locationId: locationId('msk_presnya_coffee_spot'),
    description: 'Короткие смены в кофейне. Денег немного, зато вход простой.',
    wagePerShift: 1800,
    shiftDurationMinutes: 240,
    requirements: {
      minEnergy: 20
    },
    effects: {
      moneyDelta: 1800,
      needsDelta: {
        energy: -22,
        hunger: -18,
        thirst: -18,
        mood: -1
      }
    }
  },
  {
    id: jobId('job_office_part_time_assistant'),
    title: 'Офисный помощник на подработке',
    category: 'office',
    locationId: locationId('msk_presnya_part_time_office'),
    description: 'Базовая офисная подработка. Нормальный стартовый доход за смену.',
    wagePerShift: 2500,
    shiftDurationMinutes: 240,
    requirements: {
      minEnergy: 25
    },
    effects: {
      moneyDelta: 2500,
      needsDelta: {
        energy: -30,
        hunger: -22,
        thirst: -22,
        mood: -3
      }
    }
  },
  {
    id: jobId('job_business_center_helper'),
    title: 'Помощник в бизнес-центре',
    category: 'assistant',
    locationId: locationId('msk_presnya_business_center'),
    description: 'Длиннее и тяжелее, но доход выше. Нужны силы на смену.',
    wagePerShift: 4200,
    shiftDurationMinutes: 360,
    requirements: {
      minEnergy: 45
    },
    effects: {
      moneyDelta: 4200,
      needsDelta: {
        energy: -45,
        hunger: -30,
        thirst: -30,
        mood: -5
      }
    }
  }
];

export function getJobById(jobId: JobId | undefined): Job | undefined {
  if (!jobId) return undefined;

  return basicJobs.find((job) => job.id === jobId);
}

export function getJobsForLocation(locationId: LocationId | undefined): Job[] {
  if (!locationId) return [];

  return basicJobs.filter((job) => job.locationId === locationId);
}
