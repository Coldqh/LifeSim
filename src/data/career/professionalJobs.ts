import type { Job, JobLevel } from '../../types/job';
import type { JobId, LocationId } from '../../types/ids';
import { UNIVERSITY_PROGRAM_IDS } from '../education/universities';
import { RYBINSK_DEGREE_PROGRAM_IDS } from '../education/rybinskEducation';
import { OFFICE_SCHEDULE } from '../schedules/basicSchedules';
import { SKILL_IDS } from '../skills/basicSkills';
import { CAREER_COMPANY_IDS } from './companies';

const jobId = (value: string) => value as JobId;
const locationId = (value: string) => value as LocationId;

function levels(titles: readonly [string, string, string, string], wages: readonly [number, number, number, number]): JobLevel[] {
  return [
    { level: 1, title: titles[0], wagePerShift: wages[0], minEnergy: 22, promotionExperienceRequired: 180 },
    { level: 2, title: titles[1], wagePerShift: wages[1], minEnergy: 24, promotionExperienceRequired: 520 },
    { level: 3, title: titles[2], wagePerShift: wages[2], minEnergy: 26, promotionExperienceRequired: 1050 },
    { level: 4, title: titles[3], wagePerShift: wages[3], minEnergy: 28 }
  ];
}

export const professionalJobs: Job[] = [
  {
    id: jobId('career_moscow_junior_developer'),
    title: 'Junior-разработчик',
    category: 'office',
    locationId: locationId('msk_presnya_business_center'),
    companyId: CAREER_COMPANY_IDS.moscowDigital,
    employmentType: 'professional',
    applicationMode: 'interview',
    probationDays: 30,
    description: 'Разработка внутренних веб-сервисов под руководством старших специалистов.',
    wagePerShift: 9000,
    shiftDurationMinutes: 480,
    experiencePerShift: 22,
    promotionThreshold: 180,
    requirements: {
      minEnergy: 22,
      skills: [{ skillId: SKILL_IDS.digital, minLevel: 3 }],
      acceptedDegreeProgramIds: [
        UNIVERSITY_PROGRAM_IDS.misisIt,
        UNIVERSITY_PROGRAM_IDS.demidovAppliedInformatics,
        UNIVERSITY_PROGRAM_IDS.ystuInformationSystems,
        RYBINSK_DEGREE_PROGRAM_IDS.informationSystems
      ],
      requiredCareerTags: ['IT', 'разработка', 'автоматизация']
    },
    skillRewards: [
      { skillId: SKILL_IDS.digital, experience: 18 },
      { skillId: SKILL_IDS.office, experience: 6 }
    ],
    effects: { moneyDelta: 9000, needsDelta: { energy: -28, hunger: -7, thirst: -9, mood: -3 } },
    levels: levels(
      ['Junior-разработчик', 'Разработчик', 'Senior-разработчик', 'Тимлид'],
      [9000, 12000, 16500, 22000]
    ),
    shiftSchedule: OFFICE_SCHEDULE
  },
  {
    id: jobId('career_moscow_junior_analyst'),
    title: 'Младший финансовый аналитик',
    category: 'office',
    locationId: locationId('msk_presnya_bank'),
    companyId: CAREER_COMPANY_IDS.moscowAnalytics,
    employmentType: 'professional',
    applicationMode: 'interview',
    probationDays: 30,
    description: 'Подготовка отчётов, сверка показателей и помощь аналитической команде.',
    wagePerShift: 8500,
    shiftDurationMinutes: 480,
    experiencePerShift: 21,
    promotionThreshold: 180,
    requirements: {
      minEnergy: 22,
      skills: [{ skillId: SKILL_IDS.office, minLevel: 3 }],
      acceptedDegreeProgramIds: [
        UNIVERSITY_PROGRAM_IDS.hseEconomics,
        UNIVERSITY_PROGRAM_IDS.demidovEconomics,
        UNIVERSITY_PROGRAM_IDS.ystuManagement
      ],
      requiredCareerTags: ['экономика', 'финансы', 'аналитика', 'управление']
    },
    skillRewards: [
      { skillId: SKILL_IDS.office, experience: 16 },
      { skillId: SKILL_IDS.digital, experience: 8 }
    ],
    effects: { moneyDelta: 8500, needsDelta: { energy: -26, hunger: -6, thirst: -8, mood: -3 } },
    levels: levels(
      ['Младший финансовый аналитик', 'Финансовый аналитик', 'Ведущий аналитик', 'Руководитель аналитики'],
      [8500, 11200, 15500, 20500]
    ),
    shiftSchedule: OFFICE_SCHEDULE
  },
  {
    id: jobId('career_yar_systems_analyst'),
    title: 'Младший системный аналитик',
    category: 'office',
    locationId: locationId('yar_frunzensky_ystu'),
    companyId: CAREER_COMPANY_IDS.yaroslavlTech,
    employmentType: 'professional',
    applicationMode: 'interview',
    probationDays: 30,
    description: 'Описание процессов и участие в региональных проектах автоматизации.',
    wagePerShift: 6000,
    shiftDurationMinutes: 480,
    experiencePerShift: 20,
    promotionThreshold: 170,
    requirements: {
      minEnergy: 21,
      skills: [
        { skillId: SKILL_IDS.digital, minLevel: 2 },
        { skillId: SKILL_IDS.office, minLevel: 2 }
      ],
      acceptedDegreeProgramIds: [
        UNIVERSITY_PROGRAM_IDS.demidovAppliedInformatics,
        UNIVERSITY_PROGRAM_IDS.ystuInformationSystems,
        UNIVERSITY_PROGRAM_IDS.misisIt,
        RYBINSK_DEGREE_PROGRAM_IDS.informationSystems
      ],
      requiredCareerTags: ['IT', 'аналитика', 'автоматизация']
    },
    skillRewards: [
      { skillId: SKILL_IDS.digital, experience: 14 },
      { skillId: SKILL_IDS.office, experience: 10 }
    ],
    effects: { moneyDelta: 6000, needsDelta: { energy: -25, hunger: -6, thirst: -8, mood: -2 } },
    levels: levels(
      ['Младший системный аналитик', 'Системный аналитик', 'Ведущий аналитик', 'Руководитель проектов'],
      [6000, 7800, 10500, 13800]
    ),
    shiftSchedule: OFFICE_SCHEDULE
  },
  {
    id: jobId('career_ryb_design_engineer'),
    title: 'Инженер-конструктор',
    category: 'office',
    locationId: locationId('ryb_severny_engineering_office'),
    companyId: CAREER_COMPANY_IDS.rybinskEngineering,
    employmentType: 'professional',
    applicationMode: 'interview',
    probationDays: 45,
    description: 'Работа с технической документацией и проектными задачами.',
    wagePerShift: 6500,
    shiftDurationMinutes: 480,
    experiencePerShift: 22,
    promotionThreshold: 190,
    requirements: {
      minEnergy: 23,
      skills: [{ skillId: SKILL_IDS.logistics, minLevel: 3 }],
      acceptedDegreeProgramIds: [RYBINSK_DEGREE_PROGRAM_IDS.engineering],
      requiredCareerTags: ['инженерия', 'производство', 'авиация']
    },
    skillRewards: [
      { skillId: SKILL_IDS.logistics, experience: 18 },
      { skillId: SKILL_IDS.office, experience: 6 }
    ],
    effects: { moneyDelta: 6500, needsDelta: { energy: -29, hunger: -7, thirst: -9, mood: -3 } },
    levels: levels(
      ['Инженер-конструктор', 'Инженер II категории', 'Ведущий инженер', 'Главный конструктор'],
      [6500, 8400, 11200, 15000]
    ),
    shiftSchedule: OFFICE_SCHEDULE
  },
  {
    id: jobId('career_ryb_automation_engineer'),
    title: 'Инженер по автоматизации',
    category: 'office',
    locationId: locationId('ryb_severny_plant'),
    companyId: CAREER_COMPANY_IDS.rybinskAutomation,
    employmentType: 'professional',
    applicationMode: 'interview',
    probationDays: 45,
    description: 'Поддержка цифровых производственных систем и оборудования.',
    wagePerShift: 6200,
    shiftDurationMinutes: 480,
    experiencePerShift: 22,
    promotionThreshold: 190,
    requirements: {
      minEnergy: 23,
      skills: [{ skillId: SKILL_IDS.digital, minLevel: 3 }],
      acceptedDegreeProgramIds: [
        RYBINSK_DEGREE_PROGRAM_IDS.informationSystems,
        RYBINSK_DEGREE_PROGRAM_IDS.engineering,
        UNIVERSITY_PROGRAM_IDS.ystuInformationSystems,
        UNIVERSITY_PROGRAM_IDS.misisIt
      ],
      requiredCareerTags: ['автоматизация', 'IT', 'инженерия']
    },
    skillRewards: [
      { skillId: SKILL_IDS.digital, experience: 17 },
      { skillId: SKILL_IDS.logistics, experience: 8 }
    ],
    effects: { moneyDelta: 6200, needsDelta: { energy: -30, hunger: -8, thirst: -10, mood: -3 } },
    levels: levels(
      ['Инженер по автоматизации', 'Инженер АСУ', 'Ведущий инженер АСУ', 'Руководитель автоматизации'],
      [6200, 8100, 10800, 14500]
    ),
    shiftSchedule: OFFICE_SCHEDULE
  }
];
