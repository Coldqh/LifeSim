import type { NpcInteractionDefinition } from '../../types/relationship';
import type { NpcInteractionId } from '../../types/ids';

function interactionId(value: string): NpcInteractionId {
  return value as NpcInteractionId;
}

export const NPC_INTERACTION_IDS = {
  greet: interactionId('npc_interaction_greet'),
  talk: interactionId('npc_interaction_talk'),
  getToKnow: interactionId('npc_interaction_get_to_know'),
  askAdvice: interactionId('npc_interaction_ask_advice'),
  help: interactionId('npc_interaction_help'),
  coffee: interactionId('npc_interaction_coffee'),
  discussWork: interactionId('npc_interaction_discuss_work'),
  trainingPartner: interactionId('npc_interaction_training_partner'),
  cityConversation: interactionId('npc_interaction_city_conversation')
} as const;

export const npcInteractionTemplates: NpcInteractionDefinition[] = [
  {
    id: NPC_INTERACTION_IDS.greet,
    label: 'Поздороваться',
    description: 'Коротко представиться и запомнить человека.',
    contexts: ['general'],
    durationMinutes: 2,
    relationshipDelta: { familiarity: 6, affinity: 1, tension: -1 },
    memory: { key: 'first_greeting', text: 'Вы познакомились.', tone: 'neutral' },
    eventWeight: 0.08
  },
  {
    id: NPC_INTERACTION_IDS.talk,
    label: 'Поговорить',
    description: 'Небольшой разговор на месте.',
    contexts: ['general'],
    durationMinutes: 10,
    needsDelta: { mood: 2, energy: -1 },
    relationshipDelta: { familiarity: 5, affinity: 2, trust: 1, tension: -1 },
    minFamiliarity: 5,
    eventWeight: 0.28
  },
  {
    id: NPC_INTERACTION_IDS.getToKnow,
    label: 'Узнать лучше',
    description: 'Длинный разговор о работе, городе и интересах.',
    contexts: ['general'],
    durationMinutes: 20,
    needsDelta: { mood: 3, energy: -2 },
    relationshipDelta: { familiarity: 8, affinity: 4, trust: 2, tension: -2 },
    minFamiliarity: 12,
    maxTension: 55,
    eventWeight: 0.45
  },
  {
    id: NPC_INTERACTION_IDS.askAdvice,
    label: 'Попросить совет',
    description: 'Спросить мнение по текущей ситуации.',
    contexts: ['general', 'work', 'boxing', 'education'],
    durationMinutes: 15,
    needsDelta: { mood: 2 },
    relationshipDelta: { familiarity: 3, trust: 4, affinity: 1 },
    minFamiliarity: 20,
    minTrust: 8,
    eventWeight: 0.35
  },
  {
    id: NPC_INTERACTION_IDS.help,
    label: 'Предложить помощь',
    description: 'Потратить время и помочь с текущими делами.',
    contexts: ['general', 'work', 'shop', 'cafe', 'education'],
    durationMinutes: 30,
    needsDelta: { energy: -4, mood: 2 },
    relationshipDelta: { familiarity: 4, affinity: 5, trust: 7, tension: -3 },
    minFamiliarity: 10,
    maxTension: 60,
    memory: { key: 'player_offered_help', text: 'Ты предложил помощь.', tone: 'positive' },
    eventWeight: 0.55
  },
  {
    id: NPC_INTERACTION_IDS.coffee,
    label: 'Угостить кофе',
    description: 'Купить напиток и провести время вместе.',
    contexts: ['cafe', 'general'],
    durationMinutes: 35,
    moneyDelta: -250,
    needsDelta: { energy: -2, mood: 6, thirst: 4 },
    relationshipDelta: { familiarity: 7, affinity: 7, trust: 3, tension: -3 },
    minFamiliarity: 18,
    maxTension: 45,
    memory: { key: 'coffee_together', text: 'Вы вместе выпили кофе.', tone: 'positive' },
    eventWeight: 0.6
  },
  {
    id: NPC_INTERACTION_IDS.discussWork,
    label: 'Обсудить работу',
    description: 'Поговорить о сменах, начальстве и задачах.',
    contexts: ['work'],
    durationMinutes: 15,
    needsDelta: { energy: -1, mood: 1 },
    relationshipDelta: { familiarity: 4, affinity: 2, trust: 3 },
    minFamiliarity: 5,
    eventWeight: 0.48
  },
  {
    id: NPC_INTERACTION_IDS.trainingPartner,
    label: 'Поработать в паре',
    description: 'Совместная лёгкая работа в боксёрском зале.',
    contexts: ['boxing'],
    durationMinutes: 45,
    needsDelta: { energy: -8, hunger: -3, thirst: -6, mood: 5 },
    relationshipDelta: { familiarity: 6, affinity: 5, trust: 4, tension: -2 },
    minFamiliarity: 10,
    maxTension: 50,
    memory: { key: 'trained_together', text: 'Вы вместе тренировались.', tone: 'positive' },
    eventWeight: 0.65
  },
  {
    id: NPC_INTERACTION_IDS.cityConversation,
    label: 'Обсудить город',
    description: 'Поговорить о районе и знакомых местах.',
    contexts: ['general', 'shop', 'cafe'],
    durationMinutes: 12,
    needsDelta: { mood: 2 },
    relationshipDelta: { familiarity: 4, affinity: 3, trust: 1 },
    minFamiliarity: 8,
    eventWeight: 0.32
  }
];

export function getNpcInteractionById(id: NpcInteractionId): NpcInteractionDefinition | undefined {
  return npcInteractionTemplates.find((interaction) => interaction.id === id);
}
