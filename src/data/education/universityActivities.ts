import type { UniversityCampusActivityDefinition } from '../../types/university';
import type { UniversityCampusActivityId } from '../../types/ids';

const campusActivityId = (value: string) => value as UniversityCampusActivityId;

export const UNIVERSITY_CAMPUS_ACTIVITY_IDS = {
  library: campusActivityId('university_activity_library'),
  cafeteria: campusActivityId('university_activity_cafeteria'),
  studentClub: campusActivityId('university_activity_student_club')
} as const;

export const universityCampusActivities: UniversityCampusActivityDefinition[] = [
  {
    id: UNIVERSITY_CAMPUS_ACTIVITY_IDS.library,
    kind: 'study',
    title: 'Занятие в библиотеке',
    description: 'Разобрать конспекты и подтянуть самый слабый предмет.',
    resultMessage: 'Самостоятельная подготовка завершена.',
    durationMinutes: 90,
    moneyCost: 0,
    needsDelta: { energy: -8, mood: -1 },
    needsRequirement: { minEnergy: 12, minHealth: 20, minHunger: 5, minThirst: 5 },
    studyLoadDelta: 5,
    knowledgeReward: 10
  },
  {
    id: UNIVERSITY_CAMPUS_ACTIVITY_IDS.cafeteria,
    kind: 'meal',
    title: 'Студенческая столовая',
    description: 'Поесть между занятиями и немного восстановиться.',
    resultMessage: 'Ты поел в университетской столовой.',
    durationMinutes: 30,
    moneyCost: 320,
    needsDelta: { hunger: 30, thirst: 16, energy: 4, mood: 2 },
    needsRequirement: { minHealth: 10 },
    studyLoadDelta: -3
  },
  {
    id: UNIVERSITY_CAMPUS_ACTIVITY_IDS.studentClub,
    kind: 'social',
    title: 'Встреча студклуба',
    description: 'Провести время со студентами вне пар и сбросить учебное напряжение.',
    resultMessage: 'Встреча студенческого клуба закончилась.',
    durationMinutes: 120,
    moneyCost: 180,
    needsDelta: { energy: -6, hunger: -4, thirst: -5, mood: 11 },
    needsRequirement: { minEnergy: 10, minHealth: 20, minHunger: 8, minThirst: 8 },
    studyLoadDelta: -10
  }
];

export function getUniversityCampusActivityById(
  id: UniversityCampusActivityId | undefined
): UniversityCampusActivityDefinition | undefined {
  return universityCampusActivities.find((entry) => entry.id === id);
}
