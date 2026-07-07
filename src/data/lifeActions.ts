import type { ActionId } from '../types/ids';
import type { LifeAction } from '../types/actions';

function actionId(value: string): ActionId {
  return value as ActionId;
}

export const lifeActions: LifeAction[] = [
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
    id: actionId('eat_simple_meal'),
    name: 'Поесть',
    description: 'Обычная еда. Недёшево, но жить надо.',
    category: 'food',
    durationMinutes: 30,
    moneyDelta: -350,
    needsDelta: {
      hunger: 45,
      mood: 3
    },
    requirements: {
      minMoney: 350
    },
    resultMessage: 'Ты поел. Стало легче.'
  },
  {
    id: actionId('drink_water'),
    name: 'Выпить воды',
    description: 'Вода из магазина. Быстро закрывает жажду.',
    category: 'drink',
    durationMinutes: 10,
    moneyDelta: -80,
    needsDelta: {
      thirst: 40
    },
    requirements: {
      minMoney: 80
    },
    resultMessage: 'Ты выпил воды.'
  },
  {
    id: actionId('rest_one_hour'),
    name: 'Отдохнуть 1 час',
    description: 'Пауза без денег и прогресса. Возвращает силы.',
    category: 'rest',
    durationMinutes: 60,
    needsDelta: {
      energy: 20,
      mood: 8,
      hunger: -5,
      thirst: -5
    },
    resultMessage: 'Ты отдохнул час.'
  },
  {
    id: actionId('sleep_eight_hours'),
    name: 'Сон 8 часов',
    description: 'Полный сон. День двигается дальше, тело восстанавливается.',
    category: 'sleep',
    durationMinutes: 480,
    needsDelta: {
      energy: 70,
      health: 3,
      mood: 6,
      hunger: -25,
      thirst: -25
    },
    resultMessage: 'Ты поспал восемь часов.'
  }
];

export function getLifeAction(actionId: ActionId): LifeAction | undefined {
  return lifeActions.find((action) => action.id === actionId);
}
