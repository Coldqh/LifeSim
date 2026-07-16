import type { SocialEventChoiceId, SocialEventId } from '../../types/ids';
import type { NpcStoryChainDefinition, SocialEventChoiceDefinition, SocialEventTemplate } from '../../types/socialEvent';

function eventId(value: string): SocialEventId {
  return value as SocialEventId;
}

function choiceId(value: string): SocialEventChoiceId {
  return value as SocialEventChoiceId;
}

function choice(
  id: string,
  label: string,
  resultText: string,
  overrides: Partial<SocialEventChoiceDefinition> = {}
): SocialEventChoiceDefinition {
  return {
    id: choiceId(id),
    label,
    resultText,
    relationshipDelta: {},
    ...overrides
  };
}

function expiryChoice(id: string, resultText: string, memoryKey: string, memoryText: string): SocialEventChoiceDefinition {
  return choice(id, 'Не отвечать', resultText, {
    expiryOnly: true,
    relationshipDelta: { affinity: -4, trust: -5, tension: 6 },
    memoryKey,
    memoryText,
    memoryTone: 'negative'
  });
}

export const NPC_STORY_EVENT_IDS = {
  universityRoot: eventId('npc_story_university_assignment'),
  universityFollowUp: eventId('npc_story_university_deadline'),
  universityPositiveEnd: eventId('npc_story_university_positive_end'),
  universityNegativeEnd: eventId('npc_story_university_negative_end'),
  workRoot: eventId('npc_story_work_cover_shift'),
  workFollowUp: eventId('npc_story_work_manager_question'),
  workPositiveEnd: eventId('npc_story_work_positive_end'),
  workNegativeEnd: eventId('npc_story_work_negative_end'),
  boxingRoot: eventId('npc_story_boxing_sparring_offer'),
  boxingFollowUp: eventId('npc_story_boxing_hard_round'),
  boxingPositiveEnd: eventId('npc_story_boxing_positive_end'),
  boxingNegativeEnd: eventId('npc_story_boxing_negative_end')
} as const;


export const npcStoryChains: NpcStoryChainDefinition[] = [
  {
    id: 'university_peer',
    context: 'education',
    rootTemplateId: NPC_STORY_EVENT_IDS.universityRoot,
    templateIds: [
      NPC_STORY_EVENT_IDS.universityRoot,
      NPC_STORY_EVENT_IDS.universityFollowUp,
      NPC_STORY_EVENT_IDS.universityPositiveEnd,
      NPC_STORY_EVENT_IDS.universityNegativeEnd
    ],
    memoryPrefix: 'npc_story_university_'
  },
  {
    id: 'work_colleague',
    context: 'work',
    rootTemplateId: NPC_STORY_EVENT_IDS.workRoot,
    templateIds: [
      NPC_STORY_EVENT_IDS.workRoot,
      NPC_STORY_EVENT_IDS.workFollowUp,
      NPC_STORY_EVENT_IDS.workPositiveEnd,
      NPC_STORY_EVENT_IDS.workNegativeEnd
    ],
    memoryPrefix: 'npc_story_work_'
  },
  {
    id: 'boxing_partner',
    context: 'boxing',
    rootTemplateId: NPC_STORY_EVENT_IDS.boxingRoot,
    templateIds: [
      NPC_STORY_EVENT_IDS.boxingRoot,
      NPC_STORY_EVENT_IDS.boxingFollowUp,
      NPC_STORY_EVENT_IDS.boxingPositiveEnd,
      NPC_STORY_EVENT_IDS.boxingNegativeEnd
    ],
    memoryPrefix: 'npc_story_boxing_'
  }
];

export const npcStoryEventTemplates: SocialEventTemplate[] = [
  {
    id: NPC_STORY_EVENT_IDS.universityRoot,
    title: 'Задание на двоих',
    text: '{npc} пишет перед дедлайном и просит вместе разобрать сложное задание.',
    contexts: ['education'],
    choices: [
      choice('npc_story_university_help', 'Разобрать вместе', 'Вы сели за работу и закрыли самые сложные места.', {
        durationMinutes: 60,
        needsDelta: { energy: -6, mood: 2 },
        relationshipDelta: { familiarity: 8, affinity: 6, trust: 7, tension: -2 },
        memoryKey: 'npc_story_university_helped',
        memoryText: 'Ты помог с заданием и не бросил перед дедлайном.',
        memoryTone: 'positive',
        storyEffect: { kind: 'university_knowledge', knowledgeDelta: 8, studyLoadDelta: 4 },
        followUp: { templateId: NPC_STORY_EVENT_IDS.universityFollowUp, delayDays: 1 }
      }),
      choice('npc_story_university_refuse', 'Отказаться', 'Ты отказался. Задание пришлось закрывать без тебя.', {
        relationshipDelta: { affinity: -3, trust: -4, tension: 4 },
        memoryKey: 'npc_story_university_refused',
        memoryText: 'Ты отказался помочь перед дедлайном.',
        memoryTone: 'negative'
      }),
      expiryChoice('npc_story_university_expired', 'Ты не ответил до дедлайна. Сообщение осталось без ответа.', 'npc_story_university_ignored', 'Ты проигнорировал просьбу перед дедлайном.')
    ],
    story: { chainId: 'university_peer', step: 1, responseWindowMinutes: 720, expiryChoiceId: choiceId('npc_story_university_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.universityFollowUp,
    title: 'Защита задания',
    text: '{npc} предлагает встретиться перед защитой и быстро прогнать ответы.',
    contexts: ['education', 'general'],
    choices: [
      choice('npc_story_university_rehearse', 'Подготовиться вместе', 'Вы прогнали ответы и спокойно вышли на защиту.', {
        durationMinutes: 40,
        needsDelta: { energy: -4, mood: 3 },
        relationshipDelta: { affinity: 5, trust: 6 },
        memoryKey: 'npc_story_university_rehearsed',
        memoryText: 'Вы вместе подготовились к защите.',
        memoryTone: 'positive',
        storyEffect: { kind: 'university_knowledge', knowledgeDelta: 6, studyLoadDelta: 2 },
        followUp: { templateId: NPC_STORY_EVENT_IDS.universityPositiveEnd, delayDays: 1 }
      }),
      choice('npc_story_university_bail', 'Не приходить', 'Ты не пришёл. На защите человеку пришлось выкручиваться одному.', {
        relationshipDelta: { affinity: -6, trust: -8, tension: 8 },
        memoryKey: 'npc_story_university_bailed',
        memoryText: 'Ты не пришёл на совместную подготовку.',
        memoryTone: 'negative',
        followUp: { templateId: NPC_STORY_EVENT_IDS.universityNegativeEnd, delayDays: 1 }
      }),
      expiryChoice('npc_story_university_followup_expired', 'Ты не ответил. Подготовка прошла без тебя.', 'npc_story_university_followup_ignored', 'Ты проигнорировал договорённость о подготовке.')
    ],
    story: { chainId: 'university_peer', step: 2, responseWindowMinutes: 720, expiryChoiceId: choiceId('npc_story_university_followup_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.universityPositiveEnd,
    title: 'После защиты',
    text: '{npc} сообщает, что защита прошла хорошо, и благодарит за помощь.',
    contexts: ['education', 'general'],
    choices: [
      choice('npc_story_university_finish_good', 'Ответить', 'История закончилась хорошо. Теперь у тебя есть надёжный знакомый в группе.', {
        relationshipDelta: { familiarity: 5, affinity: 6, trust: 7 },
        memoryKey: 'npc_story_university_completed_positive',
        memoryText: 'Вы вместе закрыли задание и защиту.',
        memoryTone: 'positive'
      }),
      expiryChoice('npc_story_university_end_expired', 'Ты не ответил на благодарность.', 'npc_story_university_completed_silent', 'Ты оставил благодарность без ответа.')
    ],
    story: { chainId: 'university_peer', step: 3, responseWindowMinutes: 1440, expiryChoiceId: choiceId('npc_story_university_end_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.universityNegativeEnd,
    title: 'Разговор после защиты',
    text: '{npc} прямо говорит, что больше не рассчитывает на совместную работу.',
    contexts: ['education', 'general'],
    choices: [
      choice('npc_story_university_finish_bad', 'Признать ошибку', 'Напряжение осталось, но разговор не перешёл в открытый конфликт.', {
        relationshipDelta: { trust: 1, tension: -2 },
        memoryKey: 'npc_story_university_completed_negative',
        memoryText: 'После сорванной договорённости вы поговорили напрямую.',
        memoryTone: 'neutral'
      }),
      expiryChoice('npc_story_university_bad_end_expired', 'Ты снова не ответил. Отношения окончательно испортились.', 'npc_story_university_completed_conflict', 'Ты дважды проигнорировал одногруппника.')
    ],
    story: { chainId: 'university_peer', step: 3, responseWindowMinutes: 1440, expiryChoiceId: choiceId('npc_story_university_bad_end_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.workRoot,
    title: 'Подмена на смене',
    text: '{npc} просит прикрыть часть смены: нужно срочно уйти по личному делу.',
    contexts: ['work'],
    choices: [
      choice('npc_story_work_cover', 'Подменить', 'Ты взял лишний час и закрыл участок работы.', {
        durationMinutes: 60,
        moneyDelta: 350,
        needsDelta: { energy: -6, hunger: -2, thirst: -3 },
        relationshipDelta: { familiarity: 6, affinity: 5, trust: 8 },
        memoryKey: 'npc_story_work_covered',
        memoryText: 'Ты подменил коллегу в сложный день.',
        memoryTone: 'positive',
        followUp: { templateId: NPC_STORY_EVENT_IDS.workFollowUp, delayDays: 2 }
      }),
      choice('npc_story_work_refuse', 'Отказать', 'Ты отказался брать чужую работу.', {
        relationshipDelta: { affinity: -2, tension: 3 },
        memoryKey: 'npc_story_work_refused',
        memoryText: 'Ты отказался подменять коллегу.',
        memoryTone: 'neutral'
      }),
      expiryChoice('npc_story_work_expired', 'Ты не ответил. Коллеге пришлось искать другого человека.', 'npc_story_work_ignored', 'Ты проигнорировал просьбу о подмене.')
    ],
    story: { chainId: 'work_colleague', step: 1, responseWindowMinutes: 480, expiryChoiceId: choiceId('npc_story_work_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.workFollowUp,
    title: 'Вопрос руководителя',
    text: 'Руководитель заметил путаницу в смене. {npc} просит сказать, что всё было согласовано заранее.',
    contexts: ['work', 'general'],
    choices: [
      choice('npc_story_work_back_up', 'Подтвердить версию', 'Ты прикрыл коллегу. Руководитель не стал раздувать ситуацию.', {
        relationshipDelta: { affinity: 5, trust: 8, tension: 1 },
        memoryKey: 'npc_story_work_backed_up',
        memoryText: 'Ты прикрыл коллегу перед руководителем.',
        memoryTone: 'positive',
        followUp: { templateId: NPC_STORY_EVENT_IDS.workPositiveEnd, delayDays: 2 }
      }),
      choice('npc_story_work_truth', 'Сказать как было', 'Ты рассказал правду. Коллега понял, что ты не собираешься прикрывать его снова.', {
        relationshipDelta: { affinity: -7, trust: -10, tension: 12 },
        memoryKey: 'npc_story_work_told_truth',
        memoryText: 'Ты рассказал руководителю правду о подмене.',
        memoryTone: 'negative',
        followUp: { templateId: NPC_STORY_EVENT_IDS.workNegativeEnd, delayDays: 1 }
      }),
      expiryChoice('npc_story_work_followup_expired', 'Ты не ответил ни коллеге, ни руководителю. Ситуацию разобрали без тебя.', 'npc_story_work_followup_ignored', 'Ты устранился от разговора о подмене.')
    ],
    story: { chainId: 'work_colleague', step: 2, responseWindowMinutes: 480, expiryChoiceId: choiceId('npc_story_work_followup_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.workPositiveEnd,
    title: 'Ответная услуга',
    text: '{npc} помнит подмену и предлагает закрыть часть твоей следующей смены.',
    contexts: ['work', 'general'],
    choices: [
      choice('npc_story_work_finish_good', 'Принять помощь', 'Коллега вернул услугу. Рабочие отношения стали крепче.', {
        needsDelta: { energy: 5, mood: 4 },
        relationshipDelta: { affinity: 6, trust: 7, tension: -3 },
        memoryKey: 'npc_story_work_completed_positive',
        memoryText: 'Коллега вернул тебе услугу.',
        memoryTone: 'positive'
      }),
      expiryChoice('npc_story_work_end_expired', 'Ты не ответил на предложение помощи.', 'npc_story_work_completed_silent', 'Ты оставил предложение коллеги без ответа.')
    ],
    story: { chainId: 'work_colleague', step: 3, responseWindowMinutes: 1440, expiryChoiceId: choiceId('npc_story_work_end_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.workNegativeEnd,
    title: 'Холодная смена',
    text: '{npc} больше не разговаривает с тобой вне рабочих вопросов.',
    contexts: ['work', 'general'],
    choices: [
      choice('npc_story_work_finish_bad', 'Оставить как есть', 'История закончилась напряжёнными рабочими отношениями.', {
        relationshipDelta: { tension: -1 },
        memoryKey: 'npc_story_work_completed_negative',
        memoryText: 'После разговора с руководителем отношения остались холодными.',
        memoryTone: 'negative'
      }),
      expiryChoice('npc_story_work_bad_end_expired', 'Ты проигнорировал и этот разговор.', 'npc_story_work_completed_conflict', 'Конфликт на работе остался без разговора.')
    ],
    story: { chainId: 'work_colleague', step: 3, responseWindowMinutes: 1440, expiryChoiceId: choiceId('npc_story_work_bad_end_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.boxingRoot,
    title: 'Раунды после тренировки',
    text: '{npc} предлагает остаться и провести несколько плотных раундов.',
    contexts: ['boxing'],
    choices: [
      choice('npc_story_boxing_accept', 'Выйти в ринг', 'Вы провели жёсткую, но контролируемую работу.', {
        durationMinutes: 45,
        needsDelta: { energy: -9, thirst: -6, mood: 3 },
        relationshipDelta: { familiarity: 7, affinity: 5, trust: 5 },
        memoryKey: 'npc_story_boxing_sparred',
        memoryText: 'Вы впервые серьёзно поработали в ринге.',
        memoryTone: 'positive',
        storyEffect: { kind: 'boxing_progress', stat: 'defense', statDelta: 1, formDelta: 2, fatigueDelta: 7 },
        followUp: { templateId: NPC_STORY_EVENT_IDS.boxingFollowUp, delayDays: 1 }
      }),
      choice('npc_story_boxing_decline', 'Отказаться', 'Ты решил не проводить дополнительные раунды.', {
        relationshipDelta: { familiarity: 1 },
        memoryKey: 'npc_story_boxing_declined',
        memoryText: 'Ты отказался от дополнительных раундов.',
        memoryTone: 'neutral'
      }),
      expiryChoice('npc_story_boxing_expired', 'Ты не ответил до конца тренировки.', 'npc_story_boxing_ignored', 'Ты проигнорировал предложение выйти в ринг.')
    ],
    story: { chainId: 'boxing_partner', step: 1, responseWindowMinutes: 360, expiryChoiceId: choiceId('npc_story_boxing_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.boxingFollowUp,
    title: 'Слишком жёсткий раунд',
    text: '{npc} считает, что в прошлом раунде ты несколько раз ударил после команды остановиться.',
    contexts: ['boxing', 'general'],
    choices: [
      choice('npc_story_boxing_apologize', 'Признать ошибку', 'Вы спокойно разобрали момент и договорились держать контроль.', {
        relationshipDelta: { affinity: 5, trust: 7, tension: -5 },
        memoryKey: 'npc_story_boxing_apologized',
        memoryText: 'Ты признал ошибку после жёсткого спарринга.',
        memoryTone: 'positive',
        followUp: { templateId: NPC_STORY_EVENT_IDS.boxingPositiveEnd, delayDays: 2 }
      }),
      choice('npc_story_boxing_escalate', 'Ответить жёстко', 'Разговор закончился новым вызовом на спарринг.', {
        relationshipDelta: { affinity: -6, trust: -6, tension: 14 },
        memoryKey: 'npc_story_boxing_escalated',
        memoryText: 'Вы поссорились после жёсткого спарринга.',
        memoryTone: 'negative',
        followUp: { templateId: NPC_STORY_EVENT_IDS.boxingNegativeEnd, delayDays: 1 }
      }),
      expiryChoice('npc_story_boxing_followup_expired', 'Ты не ответил. Напряжение осталось.', 'npc_story_boxing_followup_ignored', 'Ты проигнорировал разговор после спарринга.')
    ],
    story: { chainId: 'boxing_partner', step: 2, responseWindowMinutes: 720, expiryChoiceId: choiceId('npc_story_boxing_followup_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.boxingPositiveEnd,
    title: 'Постоянная пара',
    text: '{npc} предлагает регулярно работать вместе и помогать друг другу перед турнирами.',
    contexts: ['boxing', 'general'],
    choices: [
      choice('npc_story_boxing_finish_good', 'Согласиться', 'У тебя появился постоянный партнёр по залу.', {
        relationshipDelta: { familiarity: 6, affinity: 7, trust: 8, tension: -4 },
        memoryKey: 'npc_story_boxing_completed_positive',
        memoryText: 'Вы стали постоянными партнёрами по тренировкам.',
        memoryTone: 'positive'
      }),
      expiryChoice('npc_story_boxing_end_expired', 'Ты не ответил на предложение работать вместе.', 'npc_story_boxing_completed_silent', 'Ты оставил предложение партнёра без ответа.')
    ],
    story: { chainId: 'boxing_partner', step: 3, responseWindowMinutes: 1440, expiryChoiceId: choiceId('npc_story_boxing_end_expired') }
  },
  {
    id: NPC_STORY_EVENT_IDS.boxingNegativeEnd,
    title: 'Соперничество в зале',
    text: '{npc} теперь воспринимает каждую вашу встречу как личное соперничество.',
    contexts: ['boxing', 'general'],
    choices: [
      choice('npc_story_boxing_finish_bad', 'Принять соперничество', 'История закончилась напряжённым соперничеством.', {
        relationshipDelta: { tension: 4 },
        memoryKey: 'npc_story_boxing_completed_negative',
        memoryText: 'Вы стали соперниками внутри одного зала.',
        memoryTone: 'negative'
      }),
      expiryChoice('npc_story_boxing_bad_end_expired', 'Ты не ответил. Соперничество осталось без слов.', 'npc_story_boxing_completed_rivalry', 'Молчание закрепило соперничество в зале.')
    ],
    story: { chainId: 'boxing_partner', step: 3, responseWindowMinutes: 1440, expiryChoiceId: choiceId('npc_story_boxing_bad_end_expired') }
  }
];
