import type { LifeAction } from '../types/actions';
import type { ActionId } from '../types/ids';

function actionId(value: string): ActionId {
  return value as ActionId;
}

export const lifeActions: LifeAction[] = [
  {
    id: actionId('sleep_eight_hours'),
    name: 'Сон 8 часов',
    description: 'Полное восстановление дома. Еда и вода расходуются только от прошедшего времени.',
    category: 'sleep',
    durationMinutes: 480,
    needsDelta: {
      energy: 70,
      mood: 8,
      health: 2
    },
    resultMessage: 'Ты поспал восемь часов.'
  },
  {
    id: actionId('rest_one_hour'),
    name: 'Отдохнуть 1 час',
    description: 'Короткая пауза дома. Силы возвращаются, потребности меняются от прошедшего времени.',
    category: 'rest',
    durationMinutes: 60,
    needsDelta: {
      energy: 20,
      mood: 6
    },
    resultMessage: 'Ты спокойно отдохнул час.'
  },
  {
    id: actionId('walk_one_hour'),
    name: 'Прогулка 1 час',
    description: 'Простая прогулка по району. Денег не даёт, но разгружает голову.',
    category: 'walk',
    durationMinutes: 60,
    needsDelta: {
      energy: -8,
      hunger: -1,
      thirst: -2,
      mood: 6,
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
      energy: -28,
      hunger: -5,
      thirst: -8,
      health: 2,
      mood: 7
    },
    requirements: {
      minEnergy: 20
    },
    resultMessage: 'Ты провёл лёгкую тренировку.'
  }
];

export function getLifeAction(actionId: ActionId): LifeAction | undefined {
  return lifeActions.find((action) => action.id === actionId);
}
