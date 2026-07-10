import type { LocationId, NpcRoleId } from '../../types/ids';
import type { KnownNpcIdentity } from '../../types/npc';
import { NPC_ROLE_IDS } from './npcRoles';

const BOXING_GYM_ID = 'msk_khamovniki_boxing_gym';
const BOXING_COACHES: KnownNpcIdentity[] = [
  { firstName: 'Андрей', lastName: 'Соколов', age: 39 },
  { firstName: 'Рашид', lastName: 'Каримов', age: 44 },
  { firstName: 'Максим', lastName: 'Белов', age: 35 }
];

export function getKnownNpcIdentity(
  locationId: LocationId,
  roleId: NpcRoleId,
  roleIndex: number
): KnownNpcIdentity | undefined {
  if (String(locationId) === BOXING_GYM_ID && roleId === NPC_ROLE_IDS.boxingCoach) {
    return BOXING_COACHES[roleIndex];
  }

  return undefined;
}
