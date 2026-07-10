import type { Job, JobLevel } from '../../types/job';
import type { JobId, LocationId } from '../../types/ids';

function jobId(value: string): JobId {
  return value as JobId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}


type CareerTitles = readonly [string, string, string];

function roundWage(value: number): number {
  return Math.round(value / 50) * 50;
}

function createJobLevels(
  titles: CareerTitles,
  baseWage: number,
  baseThreshold: number,
  baseMinEnergy: number
): JobLevel[] {
  return [
    {
      level: 1,
      title: titles[0],
      wagePerShift: baseWage,
      minEnergy: baseMinEnergy,
      promotionExperienceRequired: baseThreshold
    },
    {
      level: 2,
      title: titles[1],
      wagePerShift: roundWage(baseWage * 1.25),
      minEnergy: baseMinEnergy + 5,
      promotionExperienceRequired: baseThreshold + Math.round(baseThreshold * 1.8)
    },
    {
      level: 3,
      title: titles[2],
      wagePerShift: roundWage(baseWage * 1.6),
      minEnergy: baseMinEnergy + 10
    }
  ];
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
    levels: createJobLevels(
      ['Бариста-стажёр', 'Бариста', 'Старший бариста'],
      1800,
      100,
      20
    ),
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
    levels: createJobLevels(
      ['Продавец продуктов', 'Продавец', 'Старший продавец'],
      2000,
      100,
      24
    ),
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
    levels: createJobLevels(
      ['Помощник на складе', 'Кладовщик', 'Старший кладовщик'],
      2800,
      110,
      40
    ),
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
    levels: createJobLevels(
      ['Офисный помощник на подработке', 'Офисный ассистент', 'Координатор офиса'],
      2500,
      100,
      25
    ),
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
    levels: createJobLevels(
      ['Помощник в бизнес-центре', 'Администратор бизнес-центра', 'Старший администратор'],
      4200,
      120,
      45
    ),
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
    levels: createJobLevels(
      ['Администратор салона', 'Старший администратор салона', 'Управляющий сменой'],
      2300,
      100,
      25
    ),
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
    levels: createJobLevels(
      ['Продавец-консультант', 'Ведущий консультант', 'Старший специалист салона'],
      2600,
      110,
      30
    ),
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
    levels: createJobLevels(
      ['Помощник в фитнес-зале', 'Администратор фитнес-зала', 'Старший администратор клуба'],
      2400,
      100,
      35
    ),
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
    levels: createJobLevels(
      ['Ассистент в коворкинге', 'Координатор коворкинга', 'Старший координатор'],
      3000,
      110,
      30
    ),
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
    levels: createJobLevels(
      ['Помощник в книжном магазине', 'Продавец книг', 'Старший продавец книг'],
      2100,
      100,
      22
    ),
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
    levels: createJobLevels(
      ['Помощник в аптеке', 'Консультант аптеки', 'Старший консультант аптеки'],
      2200,
      100,
      24
    ),
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
    levels: createJobLevels(
      ['Кассир в столовой', 'Старший кассир', 'Администратор линии'],
      2100,
      100,
      24
    ),
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
    levels: createJobLevels(
      ['Сотрудник пункта выдачи', 'Оператор пункта выдачи', 'Старший оператор'],
      2300,
      105,
      28
    ),
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
    levels: createJobLevels(
      ['Помощник в магазине техники', 'Консультант по технике', 'Старший консультант'],
      2900,
      110,
      30
    ),
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
    levels: createJobLevels(
      ['Кассир фудкорта', 'Старший кассир фудкорта', 'Администратор точки'],
      2400,
      100,
      28
    ),
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
    levels: createJobLevels(
      ['Помощник в банке', 'Специалист клиентского зала', 'Старший специалист'],
      3300,
      120,
      32
    ),
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
    levels: createJobLevels(
      ['Помощник в магазине одежды', 'Продавец-консультант одежды', 'Старший консультант отдела'],
      2500,
      105,
      28
    ),
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
    levels: createJobLevels(
      ['Помощник в ресторане', 'Официант', 'Старший официант'],
      3200,
      120,
      40
    ),
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
    levels: createJobLevels(
      ['Кассир ночного магазина', 'Старший ночной кассир', 'Администратор ночной смены'],
      3000,
      115,
      38
    ),
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
    levels: createJobLevels(
      ['Администратор бассейна', 'Старший администратор бассейна', 'Координатор комплекса'],
      2500,
      105,
      30
    ),
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
