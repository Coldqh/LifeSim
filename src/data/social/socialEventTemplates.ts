import type { SocialEventTemplate } from '../../types/socialEvent';
import type { SocialEventChoiceId, SocialEventId } from '../../types/ids';

function eventId(value: string): SocialEventId {
  return value as SocialEventId;
}

function choiceId(value: string): SocialEventChoiceId {
  return value as SocialEventChoiceId;
}

const positiveChoice = (id: string, label: string, resultText: string, overrides: Partial<SocialEventTemplate['choices'][number]> = {}) => ({
  id: choiceId(id),
  label,
  resultText,
  relationshipDelta: { familiarity: 3, affinity: 4, trust: 4, tension: -2 },
  ...overrides
});

const neutralChoice = (id: string, label: string, resultText: string, overrides: Partial<SocialEventTemplate['choices'][number]> = {}) => ({
  id: choiceId(id),
  label,
  resultText,
  relationshipDelta: { familiarity: 1 },
  ...overrides
});

const negativeChoice = (id: string, label: string, resultText: string, overrides: Partial<SocialEventTemplate['choices'][number]> = {}) => ({
  id: choiceId(id),
  label,
  resultText,
  relationshipDelta: { affinity: -3, trust: -2, tension: 5 },
  ...overrides
});

export const SOCIAL_EVENT_IDS = {
  colleagueRecommendation: eventId('social_followup_colleague_recommendation'),
  boxingFreeSession: eventId('social_followup_boxing_free_session'),
  cafeInvitation: eventId('social_followup_cafe_invitation'),
  neighborReturnFavor: eventId('social_followup_neighbor_return_favor'),
  educationDiscount: eventId('social_followup_education_discount')
} as const;

export const socialEventTemplates: SocialEventTemplate[] = [
  {
    id: eventId('social_work_unfinished_tasks'),
    title: 'Незаконченные задачи',
    text: '{npc} не успевает закончить работу и просит помочь.',
    contexts: ['work'], minFamiliarity: 5, cooldownDays: 4,
    choices: [
      positiveChoice('work_help', 'Помочь', 'Вы закончили задачи вместе.', { durationMinutes: 30, needsDelta: { energy: -4 }, memoryKey: 'helped_at_work', memoryText: 'Ты помог на работе.', memoryTone: 'positive', followUp: { templateId: SOCIAL_EVENT_IDS.colleagueRecommendation, delayDays: 2 } }),
      neutralChoice('work_refuse', 'Отказаться', 'Ты занялся своими делами.', { relationshipDelta: { affinity: -1, tension: 2 } })
    ]
  },
  {
    id: eventId('social_work_manager_overtime'), title: 'Дополнительный час',
    text: '{npc} предлагает задержаться и закрыть срочную задачу.', contexts: ['work'], minFamiliarity: 8, cooldownDays: 5,
    choices: [
      positiveChoice('overtime_accept', 'Остаться', 'Дополнительная работа выполнена.', { durationMinutes: 60, moneyDelta: 500, needsDelta: { energy: -6, hunger: -2, thirst: -3 }, relationshipDelta: { trust: 6, affinity: 2 } }),
      neutralChoice('overtime_decline', 'Уйти вовремя', 'Ты отказался от дополнительной работы.', { relationshipDelta: { tension: 1 } })
    ]
  },
  {
    id: eventId('social_work_shared_break'), title: 'Перерыв',
    text: '{npc} зовёт вместе выйти на короткий перерыв.', contexts: ['work'], minFamiliarity: 10, cooldownDays: 3,
    choices: [
      positiveChoice('break_join', 'Пойти', 'Вы спокойно поговорили на перерыве.', { durationMinutes: 15, needsDelta: { mood: 4, energy: 1 } }),
      neutralChoice('break_skip', 'Остаться', 'Ты продолжил заниматься своими делами.')
    ]
  },
  {
    id: eventId('social_work_late_colleague'), title: 'Коллега опаздывает',
    text: '{npc} просит прикрыть его на несколько минут.', contexts: ['work'], minFamiliarity: 8, cooldownDays: 6,
    choices: [
      positiveChoice('late_cover', 'Прикрыть', 'Ты помог избежать проблем.', { durationMinutes: 20, needsDelta: { energy: -2 }, relationshipDelta: { trust: 7, affinity: 3 } }),
      negativeChoice('late_report', 'Сообщить руководителю', 'Ты не стал скрывать опоздание.', { relationshipDelta: { trust: -8, affinity: -5, tension: 10 }, memoryKey: 'reported_lateness', memoryText: 'Ты сообщил об опоздании.', memoryTone: 'negative' })
    ]
  },
  {
    id: eventId('social_work_difficult_customer'), title: 'Трудный посетитель',
    text: 'Посетитель начинает спорить, а {npc} явно нужна поддержка.', contexts: ['work', 'shop', 'cafe'], minFamiliarity: 5, cooldownDays: 5,
    choices: [
      positiveChoice('customer_support', 'Поддержать', 'Вы вместе успокоили посетителя.', { durationMinutes: 20, needsDelta: { energy: -2, mood: -1 }, relationshipDelta: { trust: 5, affinity: 3 } }),
      neutralChoice('customer_step_back', 'Не вмешиваться', 'Ситуацию решили без тебя.', { relationshipDelta: { affinity: -1 } })
    ]
  },
  {
    id: eventId('social_boxing_extra_round'), title: 'Ещё один раунд',
    text: '{npc} предлагает остаться на дополнительный раунд работы.', contexts: ['boxing'], minFamiliarity: 5, cooldownDays: 3,
    choices: [
      positiveChoice('round_accept', 'Согласиться', 'Раунд получился тяжёлым, но полезным.', { durationMinutes: 20, needsDelta: { energy: -5, thirst: -4, mood: 3 }, relationshipDelta: { trust: 4, affinity: 4 }, followUp: { templateId: SOCIAL_EVENT_IDS.boxingFreeSession, delayDays: 3 } }),
      neutralChoice('round_decline', 'Отказаться', 'Ты решил не перегружаться.')
    ]
  },
  {
    id: eventId('social_boxing_pair_work'), title: 'Работа в паре',
    text: '{npc} ищет партнёра для отработки защиты.', contexts: ['boxing'], minFamiliarity: 10, cooldownDays: 4,
    choices: [
      positiveChoice('pair_accept', 'Помочь', 'Вы хорошо отработали защиту и дистанцию.', { durationMinutes: 35, needsDelta: { energy: -7, thirst: -5, mood: 4 }, memoryKey: 'boxing_pair_work', memoryText: 'Вы работали в паре.', memoryTone: 'positive' }),
      neutralChoice('pair_decline', 'Не сейчас', 'Партнёр нашёлся позже.')
    ]
  },
  {
    id: eventId('social_boxing_technical_advice'), title: 'Техническая подсказка',
    text: '{npc} замечает ошибку в твоём движении и предлагает показать правильный вариант.', contexts: ['boxing'], minFamiliarity: 8, cooldownDays: 5,
    choices: [
      positiveChoice('advice_listen', 'Выслушать', 'Совет оказался понятным и полезным.', { durationMinutes: 15, relationshipDelta: { familiarity: 2, affinity: 3, trust: 5 }, needsDelta: { mood: 2 } }),
      negativeChoice('advice_ignore', 'Отмахнуться', 'Разговор быстро закончился.', { relationshipDelta: { affinity: -2, trust: -2, tension: 4 } })
    ]
  },
  {
    id: eventId('social_boxing_gloves'), title: 'Забытые перчатки',
    text: '{npc} забыл часть экипировки и просит одолжить запасную.', contexts: ['boxing'], minFamiliarity: 12, cooldownDays: 8,
    choices: [
      positiveChoice('gloves_lend', 'Одолжить', 'Тренировка не сорвалась.', { relationshipDelta: { trust: 8, affinity: 4 }, memoryKey: 'lent_boxing_gear', memoryText: 'Ты выручил с экипировкой.', memoryTone: 'positive' }),
      neutralChoice('gloves_refuse', 'Отказать', 'Пришлось искать другой вариант.', { relationshipDelta: { affinity: -1, tension: 2 } })
    ]
  },
  {
    id: eventId('social_boxing_after_loss'), title: 'После тяжёлого спарринга',
    text: '{npc} выглядит подавленно после неудачной работы в ринге.', contexts: ['boxing'], minFamiliarity: 15, cooldownDays: 6,
    choices: [
      positiveChoice('loss_support', 'Поддержать', 'Разговор немного помог.', { durationMinutes: 15, relationshipDelta: { affinity: 6, trust: 6, tension: -3 } }),
      neutralChoice('loss_leave', 'Не мешать', 'Ты оставил человека одного.')
    ]
  },
  {
    id: eventId('social_cafe_shared_table'), title: 'Свободное место',
    text: '{npc} предлагает сесть за один стол.', contexts: ['cafe'], minFamiliarity: 5, cooldownDays: 3,
    choices: [
      positiveChoice('table_join', 'Сесть рядом', 'Вы провели время за разговором.', { durationMinutes: 30, moneyDelta: -180, needsDelta: { mood: 5, thirst: 5 }, followUp: { templateId: SOCIAL_EVENT_IDS.cafeInvitation, delayDays: 2 } }),
      neutralChoice('table_decline', 'Отказаться', 'Ты выбрал другое место.')
    ]
  },
  {
    id: eventId('social_cafe_order_offer'), title: 'Новый напиток',
    text: '{npc} советует попробовать новый напиток.', contexts: ['cafe'], minFamiliarity: 8, cooldownDays: 5,
    choices: [
      positiveChoice('drink_try', 'Попробовать', 'Напиток оказался неплохим.', { durationMinutes: 10, moneyDelta: -220, needsDelta: { thirst: 8, energy: 3, mood: 3 } }),
      neutralChoice('drink_skip', 'Не брать', 'Ты остался при своём выборе.')
    ]
  },
  {
    id: eventId('social_cafe_city_news'), title: 'Новости района',
    text: '{npc} рассказывает, что изменилось рядом.', contexts: ['cafe', 'general'], minFamiliarity: 10, cooldownDays: 4,
    choices: [
      positiveChoice('news_listen', 'Послушать', 'Ты узнал несколько местных деталей.', { durationMinutes: 15, relationshipDelta: { familiarity: 4, affinity: 3, trust: 1 } }),
      neutralChoice('news_change_topic', 'Сменить тему', 'Разговор продолжился о другом.')
    ]
  },
  {
    id: eventId('social_shop_product_tip'), title: 'Совет по покупке',
    text: '{npc} замечает твой выбор и советует более выгодный вариант.', contexts: ['shop'], minFamiliarity: 5, cooldownDays: 5,
    choices: [
      positiveChoice('tip_accept', 'Поблагодарить', 'Совет оказался полезным.', { relationshipDelta: { familiarity: 3, affinity: 3, trust: 2 } }),
      neutralChoice('tip_ignore', 'Оставить свой выбор', 'Ты решил ничего не менять.')
    ]
  },
  {
    id: eventId('social_shop_queue'), title: 'Очередь',
    text: '{npc} просит пропустить вперёд из-за спешки.', contexts: ['shop'], minFamiliarity: 0, cooldownDays: 4,
    choices: [
      positiveChoice('queue_allow', 'Пропустить', 'Человек быстро рассчитался и поблагодарил.', { durationMinutes: 3, relationshipDelta: { familiarity: 4, affinity: 4, trust: 2 } }),
      neutralChoice('queue_refuse', 'Не пропускать', 'Очередь продолжила двигаться как обычно.', { relationshipDelta: { tension: 1 } })
    ]
  },
  {
    id: eventId('social_shop_regular'), title: 'Постоянный покупатель',
    text: '{npc} узнаёт тебя и начинает короткий разговор.', contexts: ['shop'], minFamiliarity: 15, cooldownDays: 3,
    choices: [
      positiveChoice('regular_talk', 'Поговорить', 'Разговор занял несколько минут.', { durationMinutes: 8, relationshipDelta: { familiarity: 4, affinity: 2 } }),
      neutralChoice('regular_hurry', 'Сослаться на спешку', 'Вы быстро попрощались.')
    ]
  },
  {
    id: eventId('social_education_notes'), title: 'Конспект',
    text: '{npc} просит показать записи с занятия.', contexts: ['education'], minFamiliarity: 5, cooldownDays: 5,
    choices: [
      positiveChoice('notes_share', 'Поделиться', 'Вы вместе разобрали сложные моменты.', { durationMinutes: 20, needsDelta: { energy: -2 }, relationshipDelta: { trust: 6, affinity: 3 }, followUp: { templateId: SOCIAL_EVENT_IDS.educationDiscount, delayDays: 3 } }),
      neutralChoice('notes_refuse', 'Отказать', 'Человеку пришлось искать другой конспект.', { relationshipDelta: { affinity: -1, tension: 2 } })
    ]
  },
  {
    id: eventId('social_education_group_task'), title: 'Совместное задание',
    text: '{npc} предлагает выполнить учебное задание вместе.', contexts: ['education'], minFamiliarity: 10, cooldownDays: 6,
    choices: [
      positiveChoice('group_accept', 'Согласиться', 'Вы быстро разобрались с заданием.', { durationMinutes: 40, needsDelta: { energy: -4, mood: 3 }, relationshipDelta: { familiarity: 5, trust: 5, affinity: 4 } }),
      neutralChoice('group_decline', 'Работать отдельно', 'Каждый занялся своей частью.')
    ]
  },
  {
    id: eventId('social_education_teacher'), title: 'Совет преподавателя',
    text: '{npc} предлагает коротко разобрать твои ошибки.', contexts: ['education'], minFamiliarity: 5, cooldownDays: 7,
    choices: [
      positiveChoice('teacher_listen', 'Остаться', 'Разбор помог понять слабые места.', { durationMinutes: 25, relationshipDelta: { trust: 5, affinity: 2 }, needsDelta: { energy: -2, mood: 2 } }),
      neutralChoice('teacher_leave', 'Уйти', 'Разбор перенесли на другой раз.')
    ]
  },
  {
    id: eventId('social_home_noise'), title: 'Шум за стеной',
    text: '{npc} из соседней квартиры объясняет, что сегодня будет шумно.', contexts: ['home'], minFamiliarity: 0, cooldownDays: 8,
    choices: [
      positiveChoice('noise_accept', 'Договориться', 'Вы согласовали время и избежали конфликта.', { relationshipDelta: { familiarity: 4, affinity: 2, tension: -2 } }),
      negativeChoice('noise_argue', 'Поругаться', 'Разговор быстро перешёл на повышенный тон.', { relationshipDelta: { affinity: -6, trust: -4, tension: 12 }, memoryKey: 'neighbor_argument', memoryText: 'Вы поссорились из-за шума.', memoryTone: 'negative' })
    ]
  },
  {
    id: eventId('social_home_package'), title: 'Чужая посылка',
    text: '{npc} просит принять небольшую посылку.', contexts: ['home'], minFamiliarity: 3, cooldownDays: 8,
    choices: [
      positiveChoice('package_accept', 'Принять', 'Ты сохранил посылку до вечера.', { relationshipDelta: { trust: 7, affinity: 3 }, followUp: { templateId: SOCIAL_EVENT_IDS.neighborReturnFavor, delayDays: 2 }, memoryKey: 'accepted_package', memoryText: 'Ты принял посылку для соседа.', memoryTone: 'positive' }),
      neutralChoice('package_refuse', 'Отказать', 'Посылку перенаправили в пункт выдачи.')
    ]
  },
  {
    id: eventId('social_home_landlord'), title: 'Разговор о квартире',
    text: '{npc} спрашивает, всё ли в порядке с комнатой.', contexts: ['home'], minFamiliarity: 5, cooldownDays: 10,
    choices: [
      positiveChoice('landlord_honest', 'Ответить спокойно', 'Вы обсудили бытовые вопросы.', { durationMinutes: 10, relationshipDelta: { trust: 3, familiarity: 2 } }),
      negativeChoice('landlord_rude', 'Ответить грубо', 'Разговор закончился неприятно.', { relationshipDelta: { affinity: -4, tension: 8, trust: -3 } })
    ]
  },
  {
    id: eventId('social_general_lost_item'), title: 'Потерянная вещь',
    text: '{npc} ищет выпавшую карту или ключи.', contexts: ['general'], minFamiliarity: 0, cooldownDays: 5,
    choices: [
      positiveChoice('lost_help', 'Помочь поискать', 'Вещь удалось быстро найти.', { durationMinutes: 15, relationshipDelta: { familiarity: 5, affinity: 5, trust: 5 }, memoryKey: 'helped_find_item', memoryText: 'Ты помог найти потерянную вещь.', memoryTone: 'positive' }),
      neutralChoice('lost_pass', 'Пройти мимо', 'Поиск продолжился без тебя.')
    ]
  },
  {
    id: eventId('social_general_rain'), title: 'Дождь',
    text: '{npc} предлагает переждать дождь под одним навесом.', contexts: ['general'], minFamiliarity: 5, cooldownDays: 4,
    choices: [
      positiveChoice('rain_wait', 'Остаться', 'Вы поговорили, пока дождь не стих.', { durationMinutes: 20, relationshipDelta: { familiarity: 5, affinity: 4 } }),
      neutralChoice('rain_leave', 'Идти дальше', 'Ты решил не задерживаться.')
    ]
  },
  {
    id: eventId('social_general_job_tip'), title: 'Разговор о работе',
    text: '{npc} упоминает, что в знакомом месте ищут человека.', contexts: ['general', 'cafe'], minFamiliarity: 20, minTrust: 10, cooldownDays: 8,
    choices: [
      positiveChoice('job_tip_listen', 'Узнать подробнее', 'Ты получил полезную информацию.', { durationMinutes: 10, relationshipDelta: { trust: 3, familiarity: 2 }, memoryKey: 'received_job_tip', memoryText: 'Ты получил совет по работе.', memoryTone: 'positive' }),
      neutralChoice('job_tip_skip', 'Не интересоваться', 'Вы сменили тему.')
    ]
  },
  {
    id: eventId('social_followup_colleague_recommendation'), title: 'Ответная помощь',
    text: '{npc} помнит твою помощь и хорошо отзывается о тебе перед руководителем.', contexts: ['work', 'general'], minFamiliarity: 0, cooldownDays: 20,
    choices: [positiveChoice('recommend_thank', 'Поблагодарить', 'Поддержка коллеги укрепила ваши отношения.', { relationshipDelta: { affinity: 5, trust: 7 }, memoryKey: 'colleague_recommended_player', memoryText: 'Коллега дал тебе хорошую рекомендацию.', memoryTone: 'positive' })]
  },
  {
    id: eventId('social_followup_boxing_free_session'), title: 'Дополнительная тренировка',
    text: '{npc} предлагает бесплатно поработать ещё раз в удобное время.', contexts: ['boxing', 'general'], minFamiliarity: 0, cooldownDays: 20,
    choices: [
      positiveChoice('free_session_accept', 'Принять', 'Вы договорились о совместной работе.', { durationMinutes: 35, needsDelta: { energy: -5, thirst: -4, mood: 4 }, relationshipDelta: { trust: 5, affinity: 4 } }),
      neutralChoice('free_session_later', 'Отложить', 'Вы решили вернуться к этому позже.')
    ]
  },
  {
    id: eventId('social_followup_cafe_invitation'), title: 'Приглашение',
    text: '{npc} снова предлагает встретиться в кафе.', contexts: ['cafe', 'general'], minFamiliarity: 0, cooldownDays: 15,
    choices: [
      positiveChoice('invite_accept', 'Встретиться', 'Вы провели время вместе.', { durationMinutes: 45, moneyDelta: -300, needsDelta: { mood: 7, thirst: 5 }, relationshipDelta: { familiarity: 7, affinity: 7, trust: 4 } }),
      neutralChoice('invite_decline', 'Отказаться', 'Встречу отменили без конфликта.')
    ]
  },
  {
    id: eventId('social_followup_neighbor_return_favor'), title: 'Ответная услуга',
    text: '{npc} предлагает помочь с небольшой бытовой задачей.', contexts: ['home', 'general'], minFamiliarity: 0, cooldownDays: 20,
    choices: [positiveChoice('favor_accept', 'Принять помощь', 'Бытовой вопрос решился быстрее.', { needsDelta: { mood: 4 }, relationshipDelta: { affinity: 4, trust: 5 } })]
  },
  {
    id: eventId('social_followup_education_discount'), title: 'Полезная информация',
    text: '{npc} сообщает о скидке на следующее занятие.', contexts: ['education', 'general'], minFamiliarity: 0, cooldownDays: 20,
    choices: [positiveChoice('discount_thank', 'Поблагодарить', 'Ты запомнил информацию о скидке.', { relationshipDelta: { affinity: 3, trust: 4 }, memoryKey: 'education_discount_tip', memoryText: 'Ты получил информацию о скидке на обучение.', memoryTone: 'positive' })]
  }
];

export function getSocialEventTemplateById(id: SocialEventId): SocialEventTemplate | undefined {
  return socialEventTemplates.find((event) => event.id === id);
}
