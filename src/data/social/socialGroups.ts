import type { SocialEventChoiceId, SocialEventId } from '../../types/ids';
import type { SocialEventChoiceDefinition, SocialEventTemplate } from '../../types/socialEvent';
import type { SocialGroupDefinition, SocialGroupId } from '../../types/socialGroup';

function eventId(value: string): SocialEventId {
  return value as SocialEventId;
}

function choiceId(value: string): SocialEventChoiceId {
  return value as SocialEventChoiceId;
}

function groupChoice(
  id: string,
  label: string,
  resultText: string,
  groupId: SocialGroupId,
  overrides: Partial<SocialEventChoiceDefinition> = {}
): SocialEventChoiceDefinition {
  const groupEffect = {
    relationshipDelta: {},
    memoryKey: id,
    memoryText: resultText,
    memoryTone: 'neutral' as const,
    ...overrides.groupEffect
  };
  void groupId;
  return {
    id: choiceId(id),
    label,
    resultText,
    relationshipDelta: {},
    ...overrides,
    groupEffect
  };
}

function expiryChoice(
  id: string,
  resultText: string,
  groupId: SocialGroupId
): SocialEventChoiceDefinition {
  return groupChoice(id, 'Не отвечать', resultText, groupId, {
    expiryOnly: true,
    groupEffect: {
      relationshipDelta: { affinity: -3, trust: -4, tension: 4 },
      memoryKey: `${groupId}_ignored_group_request`,
      memoryText: resultText,
      memoryTone: 'negative'
    }
  });
}

export const SOCIAL_GROUP_EVENT_IDS = {
  university: eventId('social_group_university_preparation'),
  work: eventId('social_group_work_schedule_conflict'),
  boxing: eventId('social_group_boxing_circuit')
} as const;

export const socialGroupDefinitions: SocialGroupDefinition[] = [
  {
    id: 'university_group',
    title: 'Учебная группа',
    shortTitle: 'Одногруппники',
    description: 'Студенты твоего потока. Помощь, пропуски и общие решения быстро становятся известны остальным.',
    context: 'education',
    eventTemplateId: SOCIAL_GROUP_EVENT_IDS.university
  },
  {
    id: 'work_team',
    title: 'Рабочий коллектив',
    shortTitle: 'Коллеги',
    description: 'Люди с твоего места работы. Они помнят подмены, конфликты и то, на чью сторону ты встал.',
    context: 'work',
    eventTemplateId: SOCIAL_GROUP_EVENT_IDS.work
  },
  {
    id: 'boxing_gym',
    title: 'Команда зала',
    shortTitle: 'Боксёрский зал',
    description: 'Тренеры и постоянные люди зала. Отношение меняется после совместной работы и поведения на тренировках.',
    context: 'boxing',
    eventTemplateId: SOCIAL_GROUP_EVENT_IDS.boxing
  }
];

export const socialGroupEventTemplates: SocialEventTemplate[] = [
  {
    id: SOCIAL_GROUP_EVENT_IDS.university,
    title: 'Общая подготовка',
    text: '{npc} пишет от имени группы: перед контрольной хотят собраться и распределить темы.',
    contexts: ['education'],
    cooldownDays: 7,
    choices: [
      groupChoice('group_university_organize', 'Организовать подготовку', 'Ты собрал людей, распределил темы и помог группе не развалить подготовку.', 'university_group', {
        durationMinutes: 60,
        needsDelta: { energy: -6, mood: 3 },
        storyEffect: { kind: 'university_knowledge', knowledgeDelta: 8, studyLoadDelta: 3 },
        groupEffect: {
          relationshipDelta: { familiarity: 4, affinity: 5, trust: 5, tension: -2 },
          memoryKey: 'university_group_organized_study',
          memoryText: 'Ты организовал общую подготовку перед контрольной.',
          memoryTone: 'positive'
        }
      }),
      groupChoice('group_university_share_notes', 'Скинуть конспект', 'Ты отправил группе свои материалы и не стал тратить весь вечер.', 'university_group', {
        durationMinutes: 15,
        needsDelta: { energy: -2 },
        storyEffect: { kind: 'university_knowledge', knowledgeDelta: 3, studyLoadDelta: 1 },
        groupEffect: {
          relationshipDelta: { familiarity: 2, affinity: 3, trust: 2 },
          memoryKey: 'university_group_shared_notes',
          memoryText: 'Ты поделился конспектом со всей группой.',
          memoryTone: 'positive'
        }
      }),
      groupChoice('group_university_step_away', 'Не участвовать', 'Группа готовилась без тебя. Несколько человек это запомнили.', 'university_group', {
        groupEffect: {
          relationshipDelta: { affinity: -2, trust: -3, tension: 2 },
          memoryKey: 'university_group_refused_study',
          memoryText: 'Ты отказался участвовать в общей подготовке.',
          memoryTone: 'negative'
        }
      }),
      expiryChoice('group_university_expired', 'Ты не ответил на сообщение группы до конца дня.', 'university_group')
    ],
    group: {
      groupId: 'university_group',
      responseWindowMinutes: 720,
      expiryChoiceId: choiceId('group_university_expired')
    }
  },
  {
    id: SOCIAL_GROUP_EVENT_IDS.work,
    title: 'Спор из-за графика',
    text: '{npc} пишет в общий чат: коллектив недоволен новым графиком и ждёт, что ты обозначишь позицию.',
    contexts: ['work'],
    cooldownDays: 7,
    choices: [
      groupChoice('group_work_support_team', 'Поддержать коллег', 'Ты открыто поддержал коллектив. Люди увидели, что ты не ушёл в сторону.', 'work_team', {
        durationMinutes: 20,
        needsDelta: { mood: -1 },
        groupEffect: {
          relationshipDelta: { familiarity: 3, affinity: 4, trust: 5, tension: -1 },
          memoryKey: 'work_team_supported_colleagues',
          memoryText: 'Ты поддержал коллег в споре о графике.',
          memoryTone: 'positive'
        }
      }),
      groupChoice('group_work_neutral', 'Не вмешиваться', 'Ты не стал занимать сторону. Конфликт прошёл мимо тебя, но доверия это не добавило.', 'work_team', {
        groupEffect: {
          relationshipDelta: { affinity: -1, trust: -2 },
          memoryKey: 'work_team_stayed_neutral',
          memoryText: 'Ты остался в стороне во время спора о графике.',
          memoryTone: 'neutral'
        }
      }),
      groupChoice('group_work_support_management', 'Поддержать руководство', 'Ты встал на сторону руководства. Коллеги восприняли это жёстко.', 'work_team', {
        groupEffect: {
          relationshipDelta: { affinity: -6, trust: -6, tension: 7 },
          memoryKey: 'work_team_supported_management',
          memoryText: 'Ты поддержал руководство против коллектива.',
          memoryTone: 'negative'
        }
      }),
      expiryChoice('group_work_expired', 'Ты промолчал, пока коллектив разбирался с графиком без тебя.', 'work_team')
    ],
    group: {
      groupId: 'work_team',
      responseWindowMinutes: 600,
      expiryChoiceId: choiceId('group_work_expired')
    }
  },
  {
    id: SOCIAL_GROUP_EVENT_IDS.boxing,
    title: 'Круговая работа',
    text: '{npc} предлагает всем остаться после основной тренировки и провести общий тяжёлый круг.',
    contexts: ['boxing'],
    cooldownDays: 7,
    choices: [
      groupChoice('group_boxing_join', 'Остаться со всеми', 'Ты прошёл круг вместе с залом и не срезал работу.', 'boxing_gym', {
        durationMinutes: 45,
        needsDelta: { energy: -8, thirst: -6, mood: 3 },
        storyEffect: { kind: 'boxing_progress', stat: 'stamina', statDelta: 3, formDelta: 2, fatigueDelta: 5 },
        groupEffect: {
          relationshipDelta: { familiarity: 4, affinity: 4, trust: 4, tension: -1 },
          memoryKey: 'boxing_group_completed_circuit',
          memoryText: 'Ты остался на общий тяжёлый круг.',
          memoryTone: 'positive'
        }
      }),
      groupChoice('group_boxing_help_newcomers', 'Помочь новичкам', 'Ты не гнал темп, а помог менее опытным закончить работу.', 'boxing_gym', {
        durationMinutes: 35,
        needsDelta: { energy: -5, thirst: -4, mood: 4 },
        storyEffect: { kind: 'boxing_progress', stat: 'technique', statDelta: 2, formDelta: 1, fatigueDelta: 3 },
        groupEffect: {
          relationshipDelta: { familiarity: 4, affinity: 5, trust: 5 },
          memoryKey: 'boxing_group_helped_newcomers',
          memoryText: 'Ты помог новичкам закончить общую работу.',
          memoryTone: 'positive'
        }
      }),
      groupChoice('group_boxing_leave', 'Уйти после тренировки', 'Ты ушёл. Никто не устроил сцену, но часть зала это заметила.', 'boxing_gym', {
        groupEffect: {
          relationshipDelta: { affinity: -2, trust: -2 },
          memoryKey: 'boxing_group_left_circuit',
          memoryText: 'Ты ушёл перед общей дополнительной работой.',
          memoryTone: 'neutral'
        }
      }),
      expiryChoice('group_boxing_expired', 'Ты не ответил и не появился на общей работе.', 'boxing_gym')
    ],
    group: {
      groupId: 'boxing_gym',
      responseWindowMinutes: 480,
      expiryChoiceId: choiceId('group_boxing_expired')
    }
  }
];

export function getSocialGroupDefinition(groupId: SocialGroupId): SocialGroupDefinition | undefined {
  return socialGroupDefinitions.find((entry) => entry.id === groupId);
}
