import type { SkillDefinition } from '../../types/skill';
import type { SkillId } from '../../types/ids';

function skillId(value: string): SkillId {
  return value as SkillId;
}

export const SKILL_IDS = {
  service: skillId('skill_service'),
  sales: skillId('skill_sales'),
  office: skillId('skill_office'),
  logistics: skillId('skill_logistics'),
  digital: skillId('skill_digital'),
  fitness: skillId('skill_fitness')
} as const;

export const basicSkills: SkillDefinition[] = [
  { id: SKILL_IDS.service, name: 'Сервис', category: 'professional', maxLevel: 5 },
  { id: SKILL_IDS.sales, name: 'Продажи', category: 'professional', maxLevel: 5 },
  { id: SKILL_IDS.office, name: 'Офисная работа', category: 'professional', maxLevel: 5 },
  { id: SKILL_IDS.logistics, name: 'Логистика', category: 'professional', maxLevel: 5 },
  { id: SKILL_IDS.digital, name: 'Цифровые навыки', category: 'professional', maxLevel: 5 },
  { id: SKILL_IDS.fitness, name: 'Физическая форма', category: 'physical', maxLevel: 5 }
];

export function getSkillById(id: SkillId): SkillDefinition | undefined {
  return basicSkills.find((skill) => skill.id === id);
}
