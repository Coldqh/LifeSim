import type { Job } from '../../types/job';
import type { JobId, LocationId } from '../../types/ids';
import { CAFE_SCHEDULE, FOOD_COURT_SCHEDULE, GROCERY_SCHEDULE } from '../schedules/basicSchedules';
import { SKILL_IDS } from '../skills/basicSkills';

const jobId = (value: string) => value as JobId;
const locationId = (value: string) => value as LocationId;

export const yaroslavlJobs: Job[] = [
  {
    id: jobId('job_yar_barista'), title: 'Бариста', category: 'service', locationId: locationId('yar_kirovsky_baget_cafe'),
    description: 'Смена в городском кафе.', wagePerShift: 1500, shiftDurationMinutes: 240, experiencePerShift: 11, promotionThreshold: 95,
    requirements: { minEnergy: 18, skills: [{ skillId: SKILL_IDS.service, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.service, experience: 9 }], shiftSchedule: CAFE_SCHEDULE,
    levels: [
      { level: 1, title: 'Бариста', wagePerShift: 1500, minEnergy: 18, promotionExperienceRequired: 95 },
      { level: 2, title: 'Старший бариста', wagePerShift: 1900, minEnergy: 22, promotionExperienceRequired: 250 },
      { level: 3, title: 'Администратор смены', wagePerShift: 2450, minEnergy: 26 }
    ],
    effects: { moneyDelta: 1500, needsDelta: { energy: -18, hunger: -4, thirst: -6, mood: -1 } }
  },
  {
    id: jobId('job_yar_grocery_assistant'), title: 'Продавец магазина', category: 'retail', locationId: locationId('yar_leninsky_grocery'),
    description: 'Работа в продуктовом магазине.', wagePerShift: 1650, shiftDurationMinutes: 240, experiencePerShift: 10, promotionThreshold: 95,
    requirements: { minEnergy: 18 }, skillRewards: [{ skillId: SKILL_IDS.sales, experience: 8 }], shiftSchedule: GROCERY_SCHEDULE,
    levels: [
      { level: 1, title: 'Продавец магазина', wagePerShift: 1650, minEnergy: 18, promotionExperienceRequired: 95 },
      { level: 2, title: 'Старший продавец', wagePerShift: 2100, minEnergy: 22, promotionExperienceRequired: 250 },
      { level: 3, title: 'Администратор магазина', wagePerShift: 2700, minEnergy: 26 }
    ],
    effects: { moneyDelta: 1650, needsDelta: { energy: -20, hunger: -5, thirst: -7, mood: -2 } }
  },
  {
    id: jobId('job_yar_food_court_cashier'), title: 'Кассир фудкорта', category: 'service', locationId: locationId('yar_kirovsky_aura_mall'),
    description: 'Смена на фудкорте торгового центра.', wagePerShift: 1850, shiftDurationMinutes: 300, experiencePerShift: 12, promotionThreshold: 105,
    requirements: { minEnergy: 21 }, skillRewards: [{ skillId: SKILL_IDS.service, experience: 8 }, { skillId: SKILL_IDS.sales, experience: 5 }], shiftSchedule: FOOD_COURT_SCHEDULE,
    levels: [
      { level: 1, title: 'Кассир фудкорта', wagePerShift: 1850, minEnergy: 21, promotionExperienceRequired: 105 },
      { level: 2, title: 'Старший кассир', wagePerShift: 2350, minEnergy: 25, promotionExperienceRequired: 280 },
      { level: 3, title: 'Администратор точки', wagePerShift: 3000, minEnergy: 29 }
    ],
    effects: { moneyDelta: 1850, needsDelta: { energy: -24, hunger: -6, thirst: -9, mood: -3 } }
  }
];
