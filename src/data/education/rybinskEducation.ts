import type { EducationProgram } from '../../types/education';
import type {
  CityId,
  DegreeProgramId,
  EducationProgramId,
  LocationId,
  UniversityId,
  UniversitySubjectId
} from '../../types/ids';
import type {
  DegreeProgramDefinition,
  UniversityDefinition,
  UniversitySubjectDefinition
} from '../../types/university';
import { SKILL_IDS } from '../skills/basicSkills';
import { EDUCATION_CENTER_SCHEDULE } from '../schedules/basicSchedules';

const cityId = (value: string) => value as CityId;
const locationId = (value: string) => value as LocationId;
const educationProgramId = (value: string) => value as EducationProgramId;
const universityId = (value: string) => value as UniversityId;
const degreeProgramId = (value: string) => value as DegreeProgramId;
const subjectId = (value: string) => value as UniversitySubjectId;
const at = (hour: number, minute = 0) => hour * 60 + minute;

export const RYBINSK_UNIVERSITY_IDS = {
  rgatu: universityId('university_rgatu_rybinsk')
} as const;

export const RYBINSK_DEGREE_PROGRAM_IDS = {
  engineering: degreeProgramId('degree_rgatu_aircraft_engineering'),
  informationSystems: degreeProgramId('degree_rgatu_information_systems')
} as const;

export const rybinskUniversitySubjects: UniversitySubjectDefinition[] = [
  { id: subjectId('subject_ryb_engineering_math'), title: 'Инженерная математика', skillId: SKILL_IDS.digital, weekday: 'monday', startMinute: at(10), durationMinutes: 90, experienceReward: 16 },
  { id: subjectId('subject_ryb_engine_design'), title: 'Основы проектирования', skillId: SKILL_IDS.logistics, weekday: 'wednesday', startMinute: at(10), durationMinutes: 90, experienceReward: 18 },
  { id: subjectId('subject_ryb_programming'), title: 'Программирование', skillId: SKILL_IDS.digital, weekday: 'tuesday', startMinute: at(12), durationMinutes: 90, experienceReward: 18 },
  { id: subjectId('subject_ryb_automation'), title: 'Автоматизация производства', skillId: SKILL_IDS.digital, weekday: 'thursday', startMinute: at(12), durationMinutes: 90, experienceReward: 18 },
  { id: subjectId('subject_ryb_project_management'), title: 'Управление инженерными проектами', skillId: SKILL_IDS.office, weekday: 'friday', startMinute: at(10), durationMinutes: 90, experienceReward: 16 }
];

export const rybinskDegreePrograms: DegreeProgramDefinition[] = [
  {
    id: RYBINSK_DEGREE_PROGRAM_IDS.engineering,
    universityId: RYBINSK_UNIVERSITY_IDS.rgatu,
    title: 'Авиадвигателестроение и машиностроение',
    durationSemesters: 8,
    tuitionPerSemester: 68000,
    entranceDifficulty: 3,
    requiredSkills: [{ skillId: SKILL_IDS.logistics, minLevel: 1 }],
    subjectIds: [subjectId('subject_ryb_engineering_math'), subjectId('subject_ryb_engine_design'), subjectId('subject_ryb_project_management')],
    careerTags: ['инженерия', 'производство', 'авиация']
  },
  {
    id: RYBINSK_DEGREE_PROGRAM_IDS.informationSystems,
    universityId: RYBINSK_UNIVERSITY_IDS.rgatu,
    title: 'Информационные системы и автоматизация',
    durationSemesters: 8,
    tuitionPerSemester: 64000,
    entranceDifficulty: 3,
    requiredSkills: [{ skillId: SKILL_IDS.digital, minLevel: 1 }],
    subjectIds: [subjectId('subject_ryb_programming'), subjectId('subject_ryb_automation'), subjectId('subject_ryb_project_management')],
    careerTags: ['IT', 'автоматизация', 'разработка']
  }
];

export const rybinskUniversities: UniversityDefinition[] = [
  {
    id: RYBINSK_UNIVERSITY_IDS.rgatu,
    name: 'Рыбинский государственный авиационный технический университет имени П. А. Соловьёва',
    shortName: 'РГАТУ',
    cityId: cityId('rybinsk'),
    locationId: locationId('ryb_center_rgatu'),
    address: 'ул. Пушкина, 53',
    description: 'Городской инженерный университет с производственными и цифровыми направлениями.',
    programIds: [RYBINSK_DEGREE_PROGRAM_IDS.engineering, RYBINSK_DEGREE_PROGRAM_IDS.informationSystems]
  }
];

export const rybinskEducationPrograms: EducationProgram[] = [
  {
    id: educationProgramId('education_ryb_digital_tools'),
    title: 'Цифровые инструменты для производства',
    mode: 'course',
    skillId: SKILL_IDS.digital,
    locationId: locationId('ryb_center_education_center'),
    durationMinutes: 240,
    price: 1300,
    experienceReward: 52,
    minEnergy: 14,
    needsDelta: { energy: -11, mood: 2 },
    availabilitySchedule: EDUCATION_CENTER_SCHEDULE
  },
  {
    id: educationProgramId('education_ryb_logistics_basics'),
    title: 'Основы производственной логистики',
    mode: 'course',
    skillId: SKILL_IDS.logistics,
    locationId: locationId('ryb_center_education_center'),
    durationMinutes: 240,
    price: 1200,
    experienceReward: 50,
    minEnergy: 14,
    needsDelta: { energy: -11, mood: 2 },
    availabilitySchedule: EDUCATION_CENTER_SCHEDULE
  }
];
