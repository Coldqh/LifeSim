import type { LifeAction } from '../types/actions';
import type { ActionId } from '../types/ids';

function actionId(value: string): ActionId {
  return value as ActionId;
}

export const lifeActions: LifeAction[] = [
  {
    id: actionId('sleep_eight_hours'),
    name: 'Сон 8 часов',
    description: 'Полное восстановление дома. Еда и вода падают за ночь.',
    category: 'sleep',
    durationMinutes: 480,
    needsDelta: {
      energy: 70,
      hunger: -25,
      thirst: -25,
      mood: 8,
      health: 2
    },
    resultMessage: 'Ты поспал восемь часов.'
  },
  {
    id: actionId('rest_one_hour'),
    name: 'Отдохнуть 1 час',
    description: 'Короткая пауза дома. Силы немного возвращаются.',
    category: 'rest',
    durationMinutes: 60,
    needsDelta: {
      energy: 20,
      hunger: -5,
      thirst: -5,
      mood: 8
    },
    resultMessage: 'Ты спокойно отдохнул час.'
  },
  {
    id: actionId('part_time_shift_4h'),
    name: 'Подработка 4 часа',
    description: 'Быстрая смена за деньги. Сильно режет силы, еду и воду.',
    category: 'work',
    durationMinutes: 240,
    moneyDelta: 2500,
    needsDelta: {
      energy: -35,
      hunger: -25,
      thirst: -25,
      mood: -4
    },
    requirements: {
      minEnergy: 20
    },
    resultMessage: 'Ты отработал смену и получил деньги.'
  },
  {
    id: actionId('walk_one_hour'),
    name: 'Прогулка 1 час',
    description: 'Простая прогулка по району. Денег не даёт, но разгружает голову.',
    category: 'walk',
    durationMinutes: 60,
    needsDelta: {
      energy: -8,
      hunger: -8,
      thirst: -10,
      mood: 10,
      health: 1
    },
    resultMessage: 'Ты прогулялся час.'
  },
  {
    id: actionId('light_training'),
    name: 'Лёгкая тренировка',
    description: 'Без спорт-системы. Просто базовая физическая активность.',
    category: 'training',
    durationMinutes: 90,
    needsDelta: {
      energy: -25,
      hunger: -18,
      thirst: -25,
      health: 2,
      mood: 7
    },
    requirements: {
      minEnergy: 25
    },
    resultMessage: 'Ты провёл лёгкую тренировку.'
  }
];

export function getLifeAction(actionId: ActionId): LifeAction | undefined {
  return lifeActions.find((action) => action.id === actionId);
}
