import type {
  DegreeProgramDefinition,
  UniversityDefinition,
  UniversitySubjectDefinition
} from '../../types/university';
import type {
  CityId,
  DegreeProgramId,
  LocationId,
  UniversityId,
  UniversitySubjectId
} from '../../types/ids';
import { SKILL_IDS } from '../skills/basicSkills';

const universityId = (value: string) => value as UniversityId;
const programId = (value: string) => value as DegreeProgramId;
const subjectId = (value: string) => value as UniversitySubjectId;
const cityId = (value: string) => value as CityId;
const locationId = (value: string) => value as LocationId;
const at = (hour: number, minute = 0) => hour * 60 + minute;

export const UNIVERSITY_IDS = {
  hse: universityId('university_hse_moscow'),
  misis: universityId('university_misis_moscow'),
  demidov: universityId('university_demidov_yaroslavl'),
  ystu: universityId('university_ystu_yaroslavl')
} as const;

export const UNIVERSITY_PROGRAM_IDS = {
  hseEconomics: programId('degree_hse_economics_management'),
  misisIt: programId('degree_misis_computer_engineering'),
  demidovAppliedInformatics: programId('degree_demidov_applied_informatics'),
  demidovEconomics: programId('degree_demidov_economics'),
  ystuInformationSystems: programId('degree_ystu_information_systems'),
  ystuManagement: programId('degree_ystu_management')
} as const;

export const universitySubjects: UniversitySubjectDefinition[] = [
  { id: subjectId('subject_programming'), title: 'Программирование', skillId: SKILL_IDS.digital, weekday: 'monday', startMinute: at(10), durationMinutes: 90, experienceReward: 18 },
  { id: subjectId('subject_databases'), title: 'Базы данных', skillId: SKILL_IDS.digital, weekday: 'thursday', startMinute: at(12), durationMinutes: 90, experienceReward: 18 },
  { id: subjectId('subject_math'), title: 'Математика', skillId: SKILL_IDS.digital, weekday: 'tuesday', startMinute: at(10), durationMinutes: 90, experienceReward: 14 },
  { id: subjectId('subject_economics'), title: 'Экономика', skillId: SKILL_IDS.office, weekday: 'monday', startMinute: at(12), durationMinutes: 90, experienceReward: 16 },
  { id: subjectId('subject_management'), title: 'Менеджмент', skillId: SKILL_IDS.office, weekday: 'wednesday', startMinute: at(10), durationMinutes: 90, experienceReward: 16 },
  { id: subjectId('subject_marketing'), title: 'Маркетинг', skillId: SKILL_IDS.sales, weekday: 'friday', startMinute: at(12), durationMinutes: 90, experienceReward: 16 },
  { id: subjectId('subject_engineering'), title: 'Инженерные основы', skillId: SKILL_IDS.logistics, weekday: 'tuesday', startMinute: at(12), durationMinutes: 90, experienceReward: 16 },
  { id: subjectId('subject_project_work'), title: 'Проектная работа', skillId: SKILL_IDS.office, weekday: 'friday', startMinute: at(10), durationMinutes: 90, experienceReward: 14 }
];

export const degreePrograms: DegreeProgramDefinition[] = [
  {
    id: UNIVERSITY_PROGRAM_IDS.hseEconomics,
    universityId: UNIVERSITY_IDS.hse,
    title: 'Экономика и управление',
    durationSemesters: 8,
    tuitionPerSemester: 165000,
    entranceDifficulty: 4,
    requiredSkills: [{ skillId: SKILL_IDS.office, minLevel: 1 }],
    subjectIds: [subjectId('subject_economics'), subjectId('subject_management'), subjectId('subject_marketing')],
    careerTags: ['финансы', 'аналитика', 'управление']
  },
  {
    id: UNIVERSITY_PROGRAM_IDS.misisIt,
    universityId: UNIVERSITY_IDS.misis,
    title: 'Информатика и вычислительная техника',
    durationSemesters: 8,
    tuitionPerSemester: 145000,
    entranceDifficulty: 4,
    requiredSkills: [{ skillId: SKILL_IDS.digital, minLevel: 1 }],
    subjectIds: [subjectId('subject_programming'), subjectId('subject_math'), subjectId('subject_databases')],
    careerTags: ['разработка', 'IT', 'инженерия']
  },
  {
    id: UNIVERSITY_PROGRAM_IDS.demidovAppliedInformatics,
    universityId: UNIVERSITY_IDS.demidov,
    title: 'Прикладная информатика',
    durationSemesters: 8,
    tuitionPerSemester: 72000,
    entranceDifficulty: 2,
    subjectIds: [subjectId('subject_programming'), subjectId('subject_databases'), subjectId('subject_project_work')],
    careerTags: ['разработка', 'аналитика', 'цифровые системы']
  },
  {
    id: UNIVERSITY_PROGRAM_IDS.demidovEconomics,
    universityId: UNIVERSITY_IDS.demidov,
    title: 'Экономика',
    durationSemesters: 8,
    tuitionPerSemester: 68000,
    entranceDifficulty: 2,
    subjectIds: [subjectId('subject_economics'), subjectId('subject_management'), subjectId('subject_marketing')],
    careerTags: ['экономика', 'финансы', 'бизнес']
  },
  {
    id: UNIVERSITY_PROGRAM_IDS.ystuInformationSystems,
    universityId: UNIVERSITY_IDS.ystu,
    title: 'Информационные системы и технологии',
    durationSemesters: 8,
    tuitionPerSemester: 76000,
    entranceDifficulty: 2,
    subjectIds: [subjectId('subject_programming'), subjectId('subject_engineering'), subjectId('subject_databases')],
    careerTags: ['IT', 'инженерия', 'автоматизация']
  },
  {
    id: UNIVERSITY_PROGRAM_IDS.ystuManagement,
    universityId: UNIVERSITY_IDS.ystu,
    title: 'Менеджмент',
    durationSemesters: 8,
    tuitionPerSemester: 65000,
    entranceDifficulty: 2,
    subjectIds: [subjectId('subject_management'), subjectId('subject_project_work'), subjectId('subject_marketing')],
    careerTags: ['управление', 'производство', 'бизнес']
  }
];

export const universities: UniversityDefinition[] = [
  {
    id: UNIVERSITY_IDS.hse,
    name: 'Национальный исследовательский университет «Высшая школа экономики»',
    shortName: 'НИУ ВШЭ',
    cityId: cityId('moscow'),
    locationId: locationId('msk_tverskoy_hse'),
    address: 'Покровский бульвар, 11',
    description: 'Московский кампус университета.',
    programIds: [UNIVERSITY_PROGRAM_IDS.hseEconomics]
  },
  {
    id: UNIVERSITY_IDS.misis,
    name: 'Университет науки и технологий МИСИС',
    shortName: 'НИТУ МИСИС',
    cityId: cityId('moscow'),
    locationId: locationId('msk_danilovsky_misis'),
    address: 'Ленинский проспект, 4',
    description: 'Технологический университет в Москве.',
    programIds: [UNIVERSITY_PROGRAM_IDS.misisIt]
  },
  {
    id: UNIVERSITY_IDS.demidov,
    name: 'Ярославский государственный университет им. П. Г. Демидова',
    shortName: 'ЯрГУ им. П. Г. Демидова',
    cityId: cityId('yaroslavl'),
    locationId: locationId('yar_kirovsky_demidov_university'),
    address: 'Советская улица, 14',
    description: 'Демидовский университет в центре Ярославля.',
    programIds: [UNIVERSITY_PROGRAM_IDS.demidovAppliedInformatics, UNIVERSITY_PROGRAM_IDS.demidovEconomics]
  },
  {
    id: UNIVERSITY_IDS.ystu,
    name: 'Ярославский государственный технический университет',
    shortName: 'ЯГТУ',
    cityId: cityId('yaroslavl'),
    locationId: locationId('yar_frunzensky_ystu'),
    address: 'Московский проспект, 88',
    description: 'Технический университет Ярославля.',
    programIds: [UNIVERSITY_PROGRAM_IDS.ystuInformationSystems, UNIVERSITY_PROGRAM_IDS.ystuManagement]
  }
];

export function getUniversityById(id: UniversityId | undefined): UniversityDefinition | undefined {
  return universities.find((entry) => entry.id === id);
}

export function getDegreeProgramById(id: DegreeProgramId | undefined): DegreeProgramDefinition | undefined {
  return degreePrograms.find((entry) => entry.id === id);
}

export function getUniversitySubjectById(id: UniversitySubjectId | undefined): UniversitySubjectDefinition | undefined {
  return universitySubjects.find((entry) => entry.id === id);
}
