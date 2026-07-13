import type { BusinessEmployee, BusinessEmployeeRole, BusinessOperationResult, BusinessWorldState } from '../../types/business';
import type { Npc, NpcEmployment } from '../../types/npc';
import type { PopulationState } from '../../types/population';
import type { GameTime, Weekday } from '../../types/time';
import type { LocationId, NpcId, NpcRoleId } from '../../types/ids';

const ALL_DAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const ROLE_CONFIG: Record<BusinessEmployeeRole, { wage: number; startMinute: number; endMinute: number }> = {
  barista: { wage: 1700, startMinute: 8 * 60, endMinute: 16 * 60 },
  administrator: { wage: 2100, startMinute: 10 * 60, endMinute: 18 * 60 },
  cleaner: { wage: 650, startMinute: 18 * 60, endMinute: 20 * 60 }
};

export function getBusinessHireCandidates(population: PopulationState, world: BusinessWorldState, currentDay: number): Npc[] {
  const employedIds = new Set((world.ownedBusiness?.employees ?? []).map((employee) => String(employee.npcId)));
  return population.npcs
    .filter((npc) => npc.activationDay <= currentDay && !npc.employment && !employedIds.has(String(npc.id)) && npc.age >= 18)
    .sort((left, right) => left.lastName.localeCompare(right.lastName, 'ru'))
    .slice(0, 18);
}

export function isBusinessEmployeeOnShift(employee: BusinessEmployee, time: GameTime): boolean {
  if (!employee.workDays.includes(time.weekday)) return false;
  const minute = time.hour * 60 + time.minute;
  if (employee.shiftEndMinute > employee.shiftStartMinute) {
    return minute >= employee.shiftStartMinute && minute < employee.shiftEndMinute;
  }
  return minute >= employee.shiftStartMinute || minute < employee.shiftEndMinute;
}

export function hireBusinessEmployee(input: {
  world: BusinessWorldState;
  population: PopulationState;
  npcId: NpcId;
  role: BusinessEmployeeRole;
  roleId: NpcRoleId;
  currentDay: number;
  premisesLocationId: LocationId;
}): { world: BusinessWorldState; population: PopulationState; result: BusinessOperationResult } {
  const business = input.world.ownedBusiness;
  if (!business) {
    return {
      world: input.world,
      population: input.population,
      result: { ok: false, actionName: 'Найм', timeDeltaMinutes: 0, messages: ['Сначала открой бизнес.'] }
    };
  }
  if (business.employees.some((employee) => employee.npcId === input.npcId)) {
    return {
      world: input.world,
      population: input.population,
      result: { ok: false, actionName: 'Найм', timeDeltaMinutes: 0, messages: ['Этот человек уже работает у тебя.'] }
    };
  }
  const npc = input.population.npcs.find((candidate) => candidate.id === input.npcId);
  if (!npc || npc.employment || npc.activationDay > input.currentDay) {
    return {
      world: input.world,
      population: input.population,
      result: { ok: false, actionName: 'Найм', timeDeltaMinutes: 0, messages: ['Кандидат уже занят или недоступен.'] }
    };
  }
  const config = ROLE_CONFIG[input.role];
  const employee: BusinessEmployee = {
    npcId: npc.id,
    role: input.role,
    wagePerShift: config.wage,
    workDays: ALL_DAYS,
    shiftStartMinute: config.startMinute,
    shiftEndMinute: config.endMinute,
    hiredDay: input.currentDay
  };
  const employment: NpcEmployment = {
    locationId: input.premisesLocationId,
    roleId: input.roleId,
    workdays: ALL_DAYS,
    startMinute: config.startMinute,
    endMinute: config.endMinute
  };

  return {
    world: {
      ...input.world,
      ownedBusiness: { ...business, employees: [...business.employees, employee] }
    },
    population: {
      ...input.population,
      npcs: input.population.npcs.map((candidate) => candidate.id === npc.id
        ? { ...candidate, employment }
        : candidate)
    },
    result: {
      ok: true,
      actionName: 'Найм',
      timeDeltaMinutes: 0,
      messages: [`${npc.firstName} ${npc.lastName} принят на должность: ${input.role === 'barista' ? 'бариста' : input.role === 'administrator' ? 'администратор' : 'уборщик'}.`]
    }
  };
}

export function setBusinessEmployeeLocation(input: {
  population: PopulationState;
  npcId: NpcId;
  locationId: NpcEmployment['locationId'];
}): PopulationState {
  return {
    ...input.population,
    npcs: input.population.npcs.map((npc) => npc.id === input.npcId && npc.employment
      ? { ...npc, employment: { ...npc.employment, locationId: input.locationId } }
      : npc)
  };
}

export function fireBusinessEmployee(input: {
  world: BusinessWorldState;
  population: PopulationState;
  npcId: NpcId;
}): { world: BusinessWorldState; population: PopulationState; result: BusinessOperationResult } {
  const business = input.world.ownedBusiness;
  const npc = input.population.npcs.find((candidate) => candidate.id === input.npcId);
  if (!business || !business.employees.some((employee) => employee.npcId === input.npcId)) {
    return {
      world: input.world,
      population: input.population,
      result: { ok: false, actionName: 'Увольнение', timeDeltaMinutes: 0, messages: ['Сотрудник не найден.'] }
    };
  }
  return {
    world: { ...input.world, ownedBusiness: { ...business, employees: business.employees.filter((employee) => employee.npcId !== input.npcId) } },
    population: {
      ...input.population,
      npcs: input.population.npcs.map((candidate) => candidate.id === input.npcId ? { ...candidate, employment: undefined } : candidate)
    },
    result: {
      ok: true,
      actionName: 'Увольнение',
      timeDeltaMinutes: 0,
      messages: [`${npc ? `${npc.firstName} ${npc.lastName}` : 'Сотрудник'} больше не работает в кофейне.`]
    }
  };
}
