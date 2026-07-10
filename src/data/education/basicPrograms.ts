import type { EducationProgram } from '../../types/education';
import type { EducationProgramId, LocationId } from '../../types/ids';
import { SKILL_IDS } from '../skills/basicSkills';

function programId(value: string): EducationProgramId {
  return value as EducationProgramId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}

const HOME = locationId('msk_danilovsky_home');
const EDUCATION_CENTER = locationId('msk_tverskoy_education_center');

export const basicEducationPrograms: EducationProgram[] = [
  {
    id: programId('education_self_office_basics'),
    title: 'Практика офисной работы',
    mode: 'self_study',
    skillId: SKILL_IDS.office,
    locationId: HOME,
    durationMinutes: 120,
    price: 0,
    experienceReward: 14,
    minEnergy: 15,
    needsDelta: { energy: -6, mood: -1 }
  },
  {
    id: programId('education_self_digital_practice'),
    title: 'Цифровая практика',
    mode: 'self_study',
    skillId: SKILL_IDS.digital,
    locationId: HOME,
    durationMinutes: 120,
    price: 0,
    experienceReward: 14,
    minEnergy: 15,
    needsDelta: { energy: -6, mood: -1 }
  },
  {
    id: programId('education_course_service'),
    title: 'Работа с клиентами',
    mode: 'course',
    skillId: SKILL_IDS.service,
    locationId: EDUCATION_CENTER,
    durationMinutes: 180,
    price: 1200,
    experienceReward: 45,
    minEnergy: 20,
    needsDelta: { energy: -10, mood: 2 }
  },
  {
    id: programId('education_course_sales'),
    title: 'Основы продаж',
    mode: 'course',
    skillId: SKILL_IDS.sales,
    locationId: EDUCATION_CENTER,
    durationMinutes: 180,
    price: 1400,
    experienceReward: 45,
    minEnergy: 20,
    needsDelta: { energy: -10, mood: 2 }
  },
  {
    id: programId('education_course_office_tools'),
    title: 'Офисные инструменты',
    mode: 'course',
    skillId: SKILL_IDS.office,
    locationId: EDUCATION_CENTER,
    durationMinutes: 240,
    price: 1800,
    experienceReward: 60,
    minEnergy: 25,
    needsDelta: { energy: -12, mood: 2 }
  },
  {
    id: programId('education_course_digital_literacy'),
    title: 'Цифровая грамотность',
    mode: 'course',
    skillId: SKILL_IDS.digital,
    locationId: EDUCATION_CENTER,
    durationMinutes: 240,
    price: 2200,
    experienceReward: 60,
    minEnergy: 25,
    needsDelta: { energy: -12, mood: 2 }
  }
];

export function getEducationProgramById(id: EducationProgramId): EducationProgram | undefined {
  return basicEducationPrograms.find((program) => program.id === id);
}

export function getEducationProgramsForLocation(locationId: LocationId | undefined): EducationProgram[] {
  if (!locationId) return [];
  return basicEducationPrograms.filter((program) => program.locationId === locationId);
}
