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
    locationId: locationId('msk_danilovsky_metro_cafe'),
    description: 'Barista trainee.',
    wagePerShift: 1800,
    shiftDurationMinutes: 240,
    experiencePerShift: 12,
    promotionThreshold: 100,
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
    id: jobId('job_grocery_assistant'),
    title: 'Продавец продуктов',
    category: 'retail',
    locationId: locationId('msk_danilovsky_grocery'),
    description: 'Grocery retail assistant.',
    wagePerShift: 2000,
    shiftDurationMinutes: 240,
    experiencePerShift: 11,
    promotionThreshold: 100,
    requirements: {
      minEnergy: 24
    },
    effects: {
      moneyDelta: 2000,
      needsDelta: {
        energy: -26,
        hunger: -20,
        thirst: -22,
        mood: -2
      }
    }
  },
  {
    id: jobId('job_warehouse_helper'),
    title: 'Помощник на складе',
    category: 'warehouse',
    locationId: locationId('msk_danilovsky_small_warehouse'),
    description: 'Warehouse helper.',
    wagePerShift: 2800,
    shiftDurationMinutes: 300,
    experiencePerShift: 14,
    promotionThreshold: 110,
    requirements: {
      minEnergy: 40
    },
    effects: {
      moneyDelta: 2800,
      needsDelta: {
        energy: -42,
        hunger: -28,
        thirst: -30,
        mood: -4
      }
    }
  },
  {
    id: jobId('job_office_part_time_assistant'),
    title: 'Офисный помощник на подработке',
    category: 'office',
    locationId: locationId('msk_presnya_part_time_office'),
    description: 'Office part-time assistant.',
    wagePerShift: 2500,
    shiftDurationMinutes: 240,
    experiencePerShift: 12,
    promotionThreshold: 100,
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
    description: 'Business center helper.',
    wagePerShift: 4200,
    shiftDurationMinutes: 360,
    experiencePerShift: 16,
    promotionThreshold: 120,
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
  },
  {
    id: jobId('job_salon_administrator'),
    title: 'Администратор салона',
    category: 'service',
    locationId: locationId('msk_danilovsky_hair_salon'),
    description: 'Salon administrator.',
    wagePerShift: 2300,
    shiftDurationMinutes: 240,
    experiencePerShift: 12,
    promotionThreshold: 100,
    requirements: {
      minEnergy: 25
    },
    effects: {
      moneyDelta: 2300,
      needsDelta: {
        energy: -24,
        hunger: -18,
        thirst: -20,
        mood: -2
      }
    }
  },
  {
    id: jobId('job_phone_shop_consultant'),
    title: 'Продавец-консультант',
    category: 'retail',
    locationId: locationId('msk_presnya_phone_shop'),
    description: 'Retail consultant.',
    wagePerShift: 2600,
    shiftDurationMinutes: 300,
    experiencePerShift: 13,
    promotionThreshold: 110,
    requirements: {
      minEnergy: 30
    },
    effects: {
      moneyDelta: 2600,
      needsDelta: {
        energy: -32,
        hunger: -24,
        thirst: -24,
        mood: -3
      }
    }
  },
  {
    id: jobId('job_fitness_assistant'),
    title: 'Помощник в фитнес-зале',
    category: 'fitness',
    locationId: locationId('msk_khamovniki_fitness_club'),
    description: 'Fitness hall assistant.',
    wagePerShift: 2400,
    shiftDurationMinutes: 240,
    experiencePerShift: 13,
    promotionThreshold: 100,
    requirements: {
      minEnergy: 35
    },
    effects: {
      moneyDelta: 2400,
      needsDelta: {
        energy: -36,
        hunger: -25,
        thirst: -28,
        mood: -2
      }
    }
  },
  {
    id: jobId('job_coworking_assistant'),
    title: 'Ассистент в коворкинге',
    category: 'assistant',
    locationId: locationId('msk_presnya_coworking'),
    description: 'Coworking assistant.',
    wagePerShift: 3000,
    shiftDurationMinutes: 300,
    experiencePerShift: 14,
    promotionThreshold: 110,
    requirements: {
      minEnergy: 30
    },
    effects: {
      moneyDelta: 3000,
      needsDelta: {
        energy: -32,
        hunger: -24,
        thirst: -24,
        mood: -2
      }
    }
  },
  {
    id: jobId('job_bookstore_assistant'),
    title: 'Помощник в книжном магазине',
    category: 'retail',
    locationId: locationId('msk_tverskoy_bookstore'),
    description: 'Bookstore assistant.',
    wagePerShift: 2100,
    shiftDurationMinutes: 240,
    experiencePerShift: 11,
    promotionThreshold: 100,
    requirements: {
      minEnergy: 22
    },
    effects: {
      moneyDelta: 2100,
      needsDelta: {
        energy: -23,
        hunger: -18,
        thirst: -18,
        mood: -1
      }
    }
  },

  {
    id: jobId('job_pharmacy_counter_assistant'),
    title: 'Помощник в аптеке',
    category: 'retail',
    locationId: locationId('msk_danilovsky_pharmacy'),
    description: 'Pharmacy counter assistant.',
    wagePerShift: 2200,
    shiftDurationMinutes: 240,
    experiencePerShift: 12,
    promotionThreshold: 100,
    requirements: { minEnergy: 24 },
    effects: { moneyDelta: 2200, needsDelta: { energy: -24, hunger: -18, thirst: -18, mood: -1 } }
  },
  {
    id: jobId('job_canteen_cashier'),
    title: 'Кассир в столовой',
    category: 'service',
    locationId: locationId('msk_danilovsky_canteen'),
    description: 'Canteen cashier.',
    wagePerShift: 2100,
    shiftDurationMinutes: 240,
    experiencePerShift: 11,
    promotionThreshold: 100,
    requirements: { minEnergy: 24 },
    effects: { moneyDelta: 2100, needsDelta: { energy: -25, hunger: -18, thirst: -22, mood: -2 } }
  },
  {
    id: jobId('job_pickup_point_operator'),
    title: 'Сотрудник пункта выдачи',
    category: 'retail',
    locationId: locationId('msk_danilovsky_pickup_point'),
    description: 'Pickup point operator.',
    wagePerShift: 2300,
    shiftDurationMinutes: 300,
    experiencePerShift: 12,
    promotionThreshold: 105,
    requirements: { minEnergy: 28 },
    effects: { moneyDelta: 2300, needsDelta: { energy: -30, hunger: -22, thirst: -22, mood: -2 } }
  },
  {
    id: jobId('job_electronics_store_assistant'),
    title: 'Помощник в магазине техники',
    category: 'retail',
    locationId: locationId('msk_presnya_electronics_store'),
    description: 'Electronics store assistant.',
    wagePerShift: 2900,
    shiftDurationMinutes: 300,
    experiencePerShift: 14,
    promotionThreshold: 110,
    requirements: { minEnergy: 30 },
    effects: { moneyDelta: 2900, needsDelta: { energy: -32, hunger: -24, thirst: -24, mood: -2 } }
  },
  {
    id: jobId('job_food_court_cashier'),
    title: 'Кассир фудкорта',
    category: 'service',
    locationId: locationId('msk_presnya_food_court'),
    description: 'Food court cashier.',
    wagePerShift: 2400,
    shiftDurationMinutes: 300,
    experiencePerShift: 12,
    promotionThreshold: 100,
    requirements: { minEnergy: 28 },
    effects: { moneyDelta: 2400, needsDelta: { energy: -31, hunger: -24, thirst: -26, mood: -3 } }
  },
  {
    id: jobId('job_bank_lobby_assistant'),
    title: 'Помощник в банке',
    category: 'assistant',
    locationId: locationId('msk_presnya_bank'),
    description: 'Bank lobby assistant.',
    wagePerShift: 3300,
    shiftDurationMinutes: 300,
    experiencePerShift: 15,
    promotionThreshold: 120,
    requirements: { minEnergy: 32 },
    effects: { moneyDelta: 3300, needsDelta: { energy: -34, hunger: -24, thirst: -24, mood: -3 } }
  },
  {
    id: jobId('job_clothing_store_assistant'),
    title: 'Помощник в магазине одежды',
    category: 'retail',
    locationId: locationId('msk_presnya_clothing_store'),
    description: 'Clothing store assistant.',
    wagePerShift: 2500,
    shiftDurationMinutes: 300,
    experiencePerShift: 13,
    promotionThreshold: 105,
    requirements: { minEnergy: 28 },
    effects: { moneyDelta: 2500, needsDelta: { energy: -29, hunger: -22, thirst: -22, mood: -2 } }
  },
  {
    id: jobId('job_restaurant_runner'),
    title: 'Помощник в ресторане',
    category: 'service',
    locationId: locationId('msk_tverskoy_restaurant'),
    description: 'Restaurant floor runner.',
    wagePerShift: 3200,
    shiftDurationMinutes: 360,
    experiencePerShift: 16,
    promotionThreshold: 120,
    requirements: { minEnergy: 40 },
    effects: { moneyDelta: 3200, needsDelta: { energy: -42, hunger: -30, thirst: -30, mood: -4 } }
  },
  {
    id: jobId('job_night_store_cashier'),
    title: 'Кассир ночного магазина',
    category: 'retail',
    locationId: locationId('msk_tverskoy_night_store'),
    description: 'Night store cashier.',
    wagePerShift: 3000,
    shiftDurationMinutes: 360,
    experiencePerShift: 15,
    promotionThreshold: 115,
    requirements: { minEnergy: 38 },
    effects: { moneyDelta: 3000, needsDelta: { energy: -42, hunger: -28, thirst: -28, mood: -5 } }
  },
  {
    id: jobId('job_pool_attendant'),
    title: 'Администратор бассейна',
    category: 'fitness',
    locationId: locationId('msk_khamovniki_pool'),
    description: 'Pool attendant.',
    wagePerShift: 2500,
    shiftDurationMinutes: 300,
    experiencePerShift: 13,
    promotionThreshold: 105,
    requirements: { minEnergy: 30 },
    effects: { moneyDelta: 2500, needsDelta: { energy: -30, hunger: -22, thirst: -24, mood: -2 } }
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
