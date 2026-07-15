import type { Job, JobLevel } from '../../types/job';
import type { JobId, LocationId } from '../../types/ids';
import { SKILL_IDS } from '../skills/basicSkills';
import {
  BANK_SCHEDULE,
  CAFE_SCHEDULE,
  CLINIC_SCHEDULE,
  GROCERY_SCHEDULE,
  OFFICE_SCHEDULE,
  SPORT_FACILITY_SCHEDULE,
  UNIVERSITY_SCHEDULE,
  WAREHOUSE_SCHEDULE
} from '../schedules/basicSchedules';

const jobId = (value: string) => value as JobId;
const locationId = (value: string) => value as LocationId;

function levels(titles: [string, string, string], wage: number, energy: number, threshold = 100): JobLevel[] {
  return [
    { level: 1, title: titles[0], wagePerShift: wage, minEnergy: energy, promotionExperienceRequired: threshold },
    { level: 2, title: titles[1], wagePerShift: Math.round(wage * 1.28 / 50) * 50, minEnergy: energy + 4, promotionExperienceRequired: threshold + 180 },
    { level: 3, title: titles[2], wagePerShift: Math.round(wage * 1.62 / 50) * 50, minEnergy: energy + 8 }
  ];
}

export const rybinskJobs: Job[] = [
  {
    id: jobId('job_ryb_barista'), title: 'Бариста', category: 'service', locationId: locationId('ryb_center_cafe'),
    description: 'Смена в небольшой кофейне в центре.', wagePerShift: 1450, shiftDurationMinutes: 240,
    experiencePerShift: 11, promotionThreshold: 95, requirements: { minEnergy: 18, skills: [{ skillId: SKILL_IDS.service, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.service, experience: 9 }], shiftSchedule: CAFE_SCHEDULE,
    levels: levels(['Бариста', 'Старший бариста', 'Администратор кофейни'], 1450, 18, 95),
    effects: { moneyDelta: 1450, needsDelta: { energy: -18, hunger: -4, thirst: -6, mood: -1 } }
  },
  {
    id: jobId('job_ryb_grocery_assistant'), title: 'Продавец универсама', category: 'retail', locationId: locationId('ryb_center_grocery'),
    description: 'Работа в продуктовом магазине.', wagePerShift: 1600, shiftDurationMinutes: 240,
    experiencePerShift: 10, promotionThreshold: 95, requirements: { minEnergy: 18 },
    skillRewards: [{ skillId: SKILL_IDS.sales, experience: 8 }], shiftSchedule: GROCERY_SCHEDULE,
    levels: levels(['Продавец универсама', 'Старший продавец', 'Администратор магазина'], 1600, 18, 95),
    effects: { moneyDelta: 1600, needsDelta: { energy: -20, hunger: -5, thirst: -7, mood: -2 } }
  },
  {
    id: jobId('job_ryb_university_assistant'), title: 'Помощник учебного отдела', category: 'assistant', locationId: locationId('ryb_center_rgatu'),
    description: 'Документы, расписания и помощь студентам.', wagePerShift: 2200, shiftDurationMinutes: 300,
    experiencePerShift: 13, promotionThreshold: 110, requirements: { minEnergy: 18, skills: [{ skillId: SKILL_IDS.office, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.office, experience: 10 }], shiftSchedule: UNIVERSITY_SCHEDULE,
    levels: levels(['Помощник учебного отдела', 'Специалист деканата', 'Координатор учебных программ'], 2200, 18, 110),
    effects: { moneyDelta: 2200, needsDelta: { energy: -20, hunger: -5, thirst: -6, mood: -1 } }
  },
  {
    id: jobId('job_ryb_clinic_registrar'), title: 'Регистратор клиники', category: 'service', locationId: locationId('ryb_center_clinic'),
    description: 'Запись пациентов и работа с документами.', wagePerShift: 2050, shiftDurationMinutes: 300,
    experiencePerShift: 12, promotionThreshold: 105, requirements: { minEnergy: 18, skills: [{ skillId: SKILL_IDS.service, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.service, experience: 7 }, { skillId: SKILL_IDS.office, experience: 5 }], shiftSchedule: CLINIC_SCHEDULE,
    levels: levels(['Регистратор клиники', 'Старший регистратор', 'Администратор медицинского центра'], 2050, 18, 105),
    effects: { moneyDelta: 2050, needsDelta: { energy: -21, hunger: -5, thirst: -7, mood: -2 } }
  },
  {
    id: jobId('job_ryb_bank_assistant'), title: 'Помощник операционного зала', category: 'office', locationId: locationId('ryb_center_bank'),
    description: 'Работа с клиентами и банковскими документами.', wagePerShift: 2500, shiftDurationMinutes: 360,
    experiencePerShift: 14, promotionThreshold: 120, requirements: { minEnergy: 20, skills: [{ skillId: SKILL_IDS.office, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.office, experience: 10 }, { skillId: SKILL_IDS.service, experience: 5 }], shiftSchedule: BANK_SCHEDULE,
    levels: levels(['Помощник операционного зала', 'Операционист', 'Старший специалист офиса'], 2500, 20, 120),
    effects: { moneyDelta: 2500, needsDelta: { energy: -24, hunger: -6, thirst: -8, mood: -2 } }
  },
  {
    id: jobId('job_ryb_plant_trainee'), title: 'Стажёр производства', category: 'warehouse', locationId: locationId('ryb_severny_plant'),
    description: 'Начальная производственная должность на машиностроительном предприятии.', wagePerShift: 3100, shiftDurationMinutes: 480,
    experiencePerShift: 16, promotionThreshold: 130, requirements: { minEnergy: 28, skills: [{ skillId: SKILL_IDS.logistics, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.logistics, experience: 13 }, { skillId: SKILL_IDS.fitness, experience: 4 }], shiftSchedule: OFFICE_SCHEDULE,
    levels: levels(['Стажёр производства', 'Оператор участка', 'Мастер производственной смены'], 3100, 28, 130),
    effects: { moneyDelta: 3100, needsDelta: { energy: -34, hunger: -10, thirst: -13, mood: -4 } }
  },
  {
    id: jobId('job_ryb_engineering_assistant'), title: 'Технический ассистент', category: 'office', locationId: locationId('ryb_severny_engineering_office'),
    description: 'Подготовка документации и помощь инженерному отделу.', wagePerShift: 2900, shiftDurationMinutes: 360,
    experiencePerShift: 15, promotionThreshold: 125, requirements: { minEnergy: 21, skills: [{ skillId: SKILL_IDS.digital, minLevel: 1 }, { skillId: SKILL_IDS.office, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.digital, experience: 10 }, { skillId: SKILL_IDS.office, experience: 7 }], shiftSchedule: OFFICE_SCHEDULE,
    levels: levels(['Технический ассистент', 'Техник проектного отдела', 'Ведущий технический специалист'], 2900, 21, 125),
    effects: { moneyDelta: 2900, needsDelta: { energy: -25, hunger: -6, thirst: -8, mood: -2 } }
  },
  {
    id: jobId('job_ryb_pool_attendant'), title: 'Дежурный бассейна', category: 'fitness', locationId: locationId('ryb_severny_pool'),
    description: 'Контроль залов и помощь посетителям бассейна.', wagePerShift: 1900, shiftDurationMinutes: 300,
    experiencePerShift: 12, promotionThreshold: 105, requirements: { minEnergy: 22, skills: [{ skillId: SKILL_IDS.fitness, minLevel: 1 }] },
    skillRewards: [{ skillId: SKILL_IDS.fitness, experience: 10 }, { skillId: SKILL_IDS.service, experience: 4 }], shiftSchedule: SPORT_FACILITY_SCHEDULE,
    levels: levels(['Дежурный бассейна', 'Администратор бассейна', 'Старший администратор комплекса'], 1900, 22, 105),
    effects: { moneyDelta: 1900, needsDelta: { energy: -24, hunger: -6, thirst: -9, mood: -1 } }
  },
  {
    id: jobId('job_ryb_warehouse_worker'), title: 'Работник терминала', category: 'warehouse', locationId: locationId('ryb_perebory_warehouse'),
    description: 'Приёмка и перемещение грузов на логистическом терминале.', wagePerShift: 2600, shiftDurationMinutes: 360,
    experiencePerShift: 14, promotionThreshold: 115, requirements: { minEnergy: 27 },
    skillRewards: [{ skillId: SKILL_IDS.logistics, experience: 12 }, { skillId: SKILL_IDS.fitness, experience: 4 }], shiftSchedule: WAREHOUSE_SCHEDULE,
    levels: levels(['Работник терминала', 'Кладовщик', 'Старший смены терминала'], 2600, 27, 115),
    effects: { moneyDelta: 2600, needsDelta: { energy: -31, hunger: -8, thirst: -11, mood: -3 } }
  }
];
