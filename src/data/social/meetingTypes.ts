import type { SocialMeetingTypeId } from '../../types/ids';
import type { SocialMeetingDefinition, SocialQuickMessageDefinition } from '../../types/socialLife';

function id(value: string): SocialMeetingTypeId {
  return value as SocialMeetingTypeId;
}

export const socialMeetingTypes: SocialMeetingDefinition[] = [
  {
    id: id('social_coffee'),
    title: 'Встретиться за кофе',
    shortTitle: 'Кофе',
    description: 'Спокойная встреча в кафе. Подходит для новых знакомых.',
    durationMinutes: 60,
    moneyCost: 550,
    locationTypes: ['cafe', 'food_court'],
    minFamiliarity: 15,
    minAffinity: -10,
    romantic: false,
    needsDelta: { mood: 5, energy: 2, thirst: 3 },
    relationshipDelta: { familiarity: 7, affinity: 6, trust: 3, tension: -3 }
  },
  {
    id: id('social_walk'),
    title: 'Пойти на прогулку',
    shortTitle: 'Прогулка',
    description: 'Встреча в парке или городской прогулочной зоне.',
    durationMinutes: 90,
    moneyCost: 0,
    locationTypes: ['park', 'sport_ground', 'other'],
    minFamiliarity: 12,
    minAffinity: -15,
    romantic: false,
    needsDelta: { energy: -4, thirst: -3, mood: 7 },
    relationshipDelta: { familiarity: 8, affinity: 7, trust: 3, tension: -4 }
  },
  {
    id: id('social_training'),
    title: 'Совместная тренировка',
    shortTitle: 'Тренировка',
    description: 'Поработать вместе в зале или на спортивной площадке.',
    durationMinutes: 90,
    moneyCost: 0,
    locationTypes: ['boxing_gym', 'fitness', 'sport_ground'],
    minFamiliarity: 20,
    minAffinity: 0,
    romantic: false,
    needsDelta: { energy: -10, hunger: -4, thirst: -7, mood: 6 },
    relationshipDelta: { familiarity: 6, affinity: 5, trust: 6, tension: -2 }
  },
  {
    id: id('social_study'),
    title: 'Готовиться вместе',
    shortTitle: 'Учёба',
    description: 'Совместная подготовка в университете, коворкинге или дома.',
    durationMinutes: 120,
    moneyCost: 250,
    locationTypes: ['education_center', 'coworking', 'home', 'cafe'],
    minFamiliarity: 18,
    minAffinity: -5,
    romantic: false,
    needsDelta: { energy: -6, mood: 3 },
    relationshipDelta: { familiarity: 6, affinity: 4, trust: 7, tension: -2 }
  },
  {
    id: id('social_restaurant'),
    title: 'Поужинать вместе',
    shortTitle: 'Ресторан',
    description: 'Дорогая встреча, которая сильнее развивает отношения.',
    durationMinutes: 120,
    moneyCost: 1900,
    locationTypes: ['restaurant', 'cafe'],
    minFamiliarity: 35,
    minAffinity: 20,
    minTrust: 10,
    romantic: false,
    needsDelta: { hunger: 18, thirst: 8, mood: 9 },
    relationshipDelta: { familiarity: 7, affinity: 10, trust: 5, tension: -5 }
  },
  {
    id: id('social_home_evening'),
    title: 'Позвать домой',
    shortTitle: 'Домашний вечер',
    description: 'Фильм, еда и спокойный вечер дома. Комфорт жилья влияет на результат.',
    durationMinutes: 150,
    moneyCost: 900,
    locationTypes: ['home'],
    minFamiliarity: 48,
    minAffinity: 30,
    minTrust: 25,
    romantic: false,
    needsDelta: { hunger: 12, mood: 10, energy: 4 },
    relationshipDelta: { familiarity: 8, affinity: 10, trust: 9, tension: -6 }
  },
  {
    id: id('social_date'),
    title: 'Пригласить на свидание',
    shortTitle: 'Свидание',
    description: 'Романтическая встреча. Итог зависит от отношения и совместимости.',
    durationMinutes: 150,
    moneyCost: 1700,
    locationTypes: ['cafe', 'restaurant', 'park'],
    minFamiliarity: 38,
    minAffinity: 28,
    minTrust: 15,
    romantic: true,
    needsDelta: { mood: 12, energy: -3 },
    relationshipDelta: { familiarity: 6, affinity: 10, trust: 6, romance: 14, tension: -4 }
  }
];

export const socialQuickMessages: SocialQuickMessageDefinition[] = [
  {
    id: 'check_in',
    label: 'Спросить, как дела',
    outgoingText: 'Привет. Как ты?',
    replyText: 'Нормально. Дел много, но держусь. Ты как?',
    cooldownMinutes: 360,
    minFamiliarity: 15,
    relationshipDelta: { familiarity: 2, affinity: 2 }
  },
  {
    id: 'invite_talk',
    label: 'Поболтать',
    outgoingText: 'Есть минутка поболтать?',
    replyText: 'Да, пиши. Я сейчас не сильно занят.',
    cooldownMinutes: 480,
    minFamiliarity: 25,
    relationshipDelta: { familiarity: 3, affinity: 3, trust: 1 }
  },
  {
    id: 'work_chat',
    label: 'Спросить про работу',
    outgoingText: 'Как у вас дела на работе?',
    replyText: 'Обычная запара. Сегодня людей больше, чем обычно.',
    cooldownMinutes: 720,
    minFamiliarity: 20,
    relationshipDelta: { familiarity: 2, trust: 2 }
  },
  {
    id: 'study_chat',
    label: 'Обсудить учёбу',
    outgoingText: 'Как у тебя с учёбой?',
    replyText: 'Надо закрыть пару дел. Потом станет легче.',
    cooldownMinutes: 720,
    minFamiliarity: 20,
    relationshipDelta: { familiarity: 2, affinity: 2, trust: 2 }
  },
  {
    id: 'training_chat',
    label: 'Обсудить тренировку',
    outgoingText: 'Когда в следующий раз тренируешься?',
    replyText: 'Скорее всего вечером. Если совпадём, можем поработать вместе.',
    cooldownMinutes: 720,
    minFamiliarity: 20,
    relationshipDelta: { familiarity: 2, affinity: 2, trust: 2 }
  }
];

export function getSocialMeetingType(idValue: SocialMeetingTypeId | undefined): SocialMeetingDefinition | undefined {
  return socialMeetingTypes.find((entry) => entry.id === idValue);
}

export function getSocialQuickMessage(idValue: string): SocialQuickMessageDefinition | undefined {
  return socialQuickMessages.find((entry) => entry.id === idValue);
}
