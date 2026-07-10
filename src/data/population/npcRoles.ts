import type { NpcRoleDefinition } from '../../types/npc';
import type { NpcRoleId } from '../../types/ids';

export function npcRoleId(value: string): NpcRoleId {
  return value as NpcRoleId;
}

export const NPC_ROLE_IDS = {
  manager: npcRoleId('npc_role_manager'),
  seller: npcRoleId('npc_role_seller'),
  cashier: npcRoleId('npc_role_cashier'),
  security: npcRoleId('npc_role_security'),
  barista: npcRoleId('npc_role_barista'),
  cook: npcRoleId('npc_role_cook'),
  waiter: npcRoleId('npc_role_waiter'),
  officeWorker: npcRoleId('npc_role_office_worker'),
  administrator: npcRoleId('npc_role_administrator'),
  cleaner: npcRoleId('npc_role_cleaner'),
  warehouseWorker: npcRoleId('npc_role_warehouse_worker'),
  operator: npcRoleId('npc_role_operator'),
  pharmacist: npcRoleId('npc_role_pharmacist'),
  medicalWorker: npcRoleId('npc_role_medical_worker'),
  trainer: npcRoleId('npc_role_trainer'),
  boxingCoach: npcRoleId('npc_role_boxing_coach'),
  teacher: npcRoleId('npc_role_teacher'),
  bankEmployee: npcRoleId('npc_role_bank_employee'),
  maintenance: npcRoleId('npc_role_maintenance')
} as const;

export const npcRoles: NpcRoleDefinition[] = [
  { id: NPC_ROLE_IDS.manager, name: 'Менеджер', category: 'management' },
  { id: NPC_ROLE_IDS.seller, name: 'Продавец', category: 'sales' },
  { id: NPC_ROLE_IDS.cashier, name: 'Кассир', category: 'sales' },
  { id: NPC_ROLE_IDS.security, name: 'Охранник', category: 'security' },
  { id: NPC_ROLE_IDS.barista, name: 'Бариста', category: 'service' },
  { id: NPC_ROLE_IDS.cook, name: 'Повар', category: 'service' },
  { id: NPC_ROLE_IDS.waiter, name: 'Официант', category: 'service' },
  { id: NPC_ROLE_IDS.officeWorker, name: 'Сотрудник офиса', category: 'office' },
  { id: NPC_ROLE_IDS.administrator, name: 'Администратор', category: 'management' },
  { id: NPC_ROLE_IDS.cleaner, name: 'Сотрудник уборки', category: 'operations' },
  { id: NPC_ROLE_IDS.warehouseWorker, name: 'Сотрудник склада', category: 'operations' },
  { id: NPC_ROLE_IDS.operator, name: 'Оператор', category: 'service' },
  { id: NPC_ROLE_IDS.pharmacist, name: 'Фармацевт', category: 'health' },
  { id: NPC_ROLE_IDS.medicalWorker, name: 'Медицинский сотрудник', category: 'health' },
  { id: NPC_ROLE_IDS.trainer, name: 'Тренер', category: 'sport' },
  { id: NPC_ROLE_IDS.boxingCoach, name: 'Тренер по боксу', category: 'sport' },
  { id: NPC_ROLE_IDS.teacher, name: 'Преподаватель', category: 'education' },
  { id: NPC_ROLE_IDS.bankEmployee, name: 'Сотрудник банка', category: 'office' },
  { id: NPC_ROLE_IDS.maintenance, name: 'Технический сотрудник', category: 'operations' }
];

export function getNpcRoleById(roleId: NpcRoleId | undefined): NpcRoleDefinition | undefined {
  if (!roleId) return undefined;
  return npcRoles.find((role) => role.id === roleId);
}
