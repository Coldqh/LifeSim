import type { WorldDynamicsTemplate } from '../types/worldDynamics';

export const worldDynamicsTemplates: readonly WorldDynamicsTemplate[] = [
  {
    kind: 'transit_disruption',
    title: 'Сбои городского транспорта',
    startText: 'На нескольких маршрутах начались задержки. Поездки на автобусе, метро и такси занимают больше времени.',
    endTitle: 'Транспорт вернулся к графику',
    endText: 'Основные задержки устранены. Городской транспорт снова работает в обычном режиме.',
    tone: 'warning',
    durationDays: 2,
    strength: 0.25
  },
  {
    kind: 'hiring_wave',
    title: 'Работодатели ускорили найм',
    startText: 'Компании активнее закрывают вакансии. Ответы по новым откликам приходят быстрее, шанс приглашения выше.',
    endTitle: 'Волна найма закончилась',
    endText: 'Работодатели вернулись к обычному темпу рассмотрения кандидатов.',
    tone: 'positive',
    durationDays: 4,
    strength: 0.18
  },
  {
    kind: 'hiring_slowdown',
    title: 'Рынок труда замедлился',
    startText: 'Компании осторожнее набирают людей. Новые отклики рассматриваются дольше, отказов стало больше.',
    endTitle: 'Найм стабилизировался',
    endText: 'Работодатели снова рассматривают кандидатов в обычном режиме.',
    tone: 'negative',
    durationDays: 4,
    strength: 0.2
  },
  {
    kind: 'consumer_boom',
    title: 'Город тратит больше',
    startText: 'В городе вырос потребительский спрос. Заведения получают больше посетителей и заказов.',
    endTitle: 'Потребительский спрос выровнялся',
    endText: 'Поток покупателей вернулся к обычному уровню.',
    tone: 'positive',
    durationDays: 3,
    strength: 0.2
  },
  {
    kind: 'consumer_slump',
    title: 'Покупатели экономят',
    startText: 'Горожане сократили необязательные расходы. Заведения теряют часть потока клиентов.',
    endTitle: 'Спрос начал восстанавливаться',
    endText: 'Покупательская активность вернулась к обычному уровню.',
    tone: 'negative',
    durationDays: 3,
    strength: 0.18
  }
];
