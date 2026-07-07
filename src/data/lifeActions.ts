import type { LifeAction } from '../types/actions';
import type { ActionId } from '../types/ids';

function actionId(value: string): ActionId {
  return value as ActionId;
}

export const lifeActions: LifeAction[] = [
  {
    id: actionId('sleep_eight_hours'),
    name: 'Сон 8 часов',
    description: 'Полный сон дома. День двигается дальше, тело восстанавливается.',
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
    id: actionId('buy_simple_food'),
    name: 'Купить простую еду',
    description: 'Быстрая еда из магазина. Закрывает голод без лишней системы товаров.',
    category: 'food',
    durationMinutes: 20,
    moneyDelta: -280,
    needsDelta: {
      hunger: 38,
      mood: 1
    },
    requirements: {
      minMoney: 280
    },
    resultMessage: 'Ты купил простую еду и поел.'
  },
  {
    id: actionId('buy_water'),
    name: 'Купить воду',
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
    resultMessage: 'Ты купил воду и выпил её.'
  },
  {
    id: actionId('eat_at_cafe'),
    name: 'Поесть в кафе',
    description: 'Дороже магазина, но лучше для настроения.',
    category: 'food',
    durationMinutes: 45,
    moneyDelta: -650,
    needsDelta: {
      hunger: 50,
      thirst: 10,
      mood: 8
    },
    requirements: {
      minMoney: 650
    },
    resultMessage: 'Ты поел в кафе.'
  },
  {
    id: actionId('drink_coffee'),
    name: 'Выпить кофе',
    description: 'Кофе даёт немного энергии и настроения, но не заменяет сон.',
    category: 'drink',
    durationMinutes: 25,
    moneyDelta: -250,
    needsDelta: {
      energy: 10,
      thirst: 8,
      mood: 5
    },
    requirements: {
      minMoney: 250
    },
    resultMessage: 'Ты выпил кофе.'
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
