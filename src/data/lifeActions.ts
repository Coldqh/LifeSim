import type { LifeAction } from '../types/actions';
import type { ActionId } from '../types/ids';
import { SKILL_IDS } from './skills/basicSkills';

function actionId(value: string): ActionId {
  return value as ActionId;
}

export const LIFE_ACTION_IDS = {
  sleepEightHours: actionId('sleep_eight_hours'),
  restOneHour: actionId('rest_one_hour'),
  walkOneHour: actionId('walk_one_hour'),
  lightTraining: actionId('light_training'),
  cookSimpleMeal: actionId('cook_simple_meal'),
  cleanHome: actionId('clean_home'),
  cafeCoffeeBreak: actionId('cafe_coffee_break'),
  cafeLaptopSession: actionId('cafe_laptop_session'),
  parkJog: actionId('park_jog')
} as const;

export const lifeActions: LifeAction[] = [
  {
    id: LIFE_ACTION_IDS.sleepEightHours,
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
    id: LIFE_ACTION_IDS.restOneHour,
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
    id: LIFE_ACTION_IDS.walkOneHour,
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
    id: LIFE_ACTION_IDS.lightTraining,
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
  },
  {
    id: LIFE_ACTION_IDS.cookSimpleMeal,
    name: 'Приготовить простую еду',
    description: 'Купить недорогие продукты по пути и приготовить обычный домашний приём пищи.',
    category: 'food',
    durationMinutes: 45,
    moneyDelta: -180,
    needsDelta: {
      hunger: 38,
      thirst: 4,
      energy: -6,
      mood: 4
    },
    requirements: {
      minMoney: 180,
      minEnergy: 8,
      minHealth: 15
    },
    resultMessage: 'Ты приготовил и съел простую домашнюю еду.'
  },
  {
    id: LIFE_ACTION_IDS.cleanHome,
    name: 'Убрать жильё',
    description: 'Разобрать вещи, вынести мусор и привести комнату в порядок.',
    category: 'household',
    durationMinutes: 60,
    needsDelta: {
      energy: -14,
      mood: 8,
      health: 1
    },
    requirements: {
      minEnergy: 12,
      minHealth: 15
    },
    resultMessage: 'Ты привёл жильё в порядок.'
  },
  {
    id: LIFE_ACTION_IDS.cafeCoffeeBreak,
    name: 'Передохнуть с кофе',
    description: 'Ненадолго сесть в кафе, выпить кофе и восстановить силы.',
    category: 'rest',
    durationMinutes: 45,
    moneyDelta: -220,
    needsDelta: {
      hunger: -1,
      thirst: 10,
      energy: 18,
      mood: 7
    },
    requirements: {
      minMoney: 220,
      minHealth: 10
    },
    resultMessage: 'Ты спокойно посидел в кафе и выпил кофе.'
  },
  {
    id: LIFE_ACTION_IDS.cafeLaptopSession,
    name: 'Поработать за ноутбуком',
    description: 'Занять стол, подключиться к сети и два часа работать над цифровыми задачами.',
    category: 'study',
    durationMinutes: 120,
    moneyDelta: -320,
    needsDelta: {
      energy: -18,
      hunger: -4,
      thirst: -4,
      mood: 2
    },
    skillRewards: [{ skillId: SKILL_IDS.digital, experience: 14 }],
    requirements: {
      minMoney: 320,
      minEnergy: 18,
      minHealth: 20,
      minHunger: 8,
      minThirst: 8
    },
    resultMessage: 'Ты закончил рабочую сессию за ноутбуком.'
  },
  {
    id: LIFE_ACTION_IDS.parkJog,
    name: 'Пробежка в парке',
    description: 'Короткая беговая тренировка на свежем воздухе.',
    category: 'training',
    durationMinutes: 45,
    needsDelta: {
      energy: -22,
      hunger: -4,
      thirst: -8,
      health: 2,
      mood: 7
    },
    skillRewards: [{ skillId: SKILL_IDS.fitness, experience: 12 }],
    requirements: {
      minEnergy: 22,
      minHealth: 35,
      minHunger: 8,
      minThirst: 10
    },
    resultMessage: 'Ты закончил пробежку в парке.'
  }
];

export function getLifeAction(actionId: ActionId): LifeAction | undefined {
  return lifeActions.find((action) => action.id === actionId);
}
