import { buyBusinessEquipment, buyBusinessSupply, buyBusinessUpgrade, fireBusinessEmployee, hireBusinessEmployee, investInBusiness, launchBusiness, setBusinessMenuPrice, simulateBusinessTime } from '../../core/business';
import { applyWorkWhileSick, getMedicalActivityFailure } from '../../core/healthcare';
import { getBusinessProgressionFailure } from '../../core/life-progression';
import { applySkillExperience } from '../../core/progression';
import { applyActivityNeedsDelta, getNeedsRequirementFailure } from '../../core/needs';
import { getScheduleActivityFailure } from '../../core/schedule';
import { addMinutes, getTotalMinutes } from '../../core/time';
import { NPC_ROLE_IDS } from '../../data/population/npcRoles';
import { businessTypes, getBusinessTypeById } from '../../data/business/businessTypes';
import { getBusinessPremisesById } from '../../data/cities/contentSelectors';
import { businessEquipment, getBusinessEquipmentById } from '../../data/business/equipment';
import { businessSupplies, getBusinessSupplyById } from '../../data/business/supplies';
import { businessMenuItems, getBusinessMenuItemById } from '../../data/business/menu';
import { businessUpgrades, getBusinessUpgradeById } from '../../data/business/upgrades';
import { basicSkills } from '../../data/skills/basicSkills';
import type { BusinessEquipmentId, BusinessMenuItemId, BusinessPremisesId, BusinessSupplyId, BusinessUpgradeId, NpcId } from '../../types/ids';
import type { BusinessEmployeeRole } from '../../types/business';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createBusinessCommands(setGameState: GameStateSetter) {
  function openCoffeeBusiness(premisesId: BusinessPremisesId, name: string): void {
    setGameState((currentState) => {
      const premises = getBusinessPremisesById(premisesId);
      const businessType = businessTypes[0];
      if (!premises || !businessType) return currentState;
      const progressionFailure = getBusinessProgressionFailure(currentState.progression);
      if (progressionFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Бизнес недоступен', progressionFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Открытие бизнеса', timeDeltaMinutes: 0, messages: [progressionFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const launched = launchBusiness({
        player: currentState.player,
        world: currentState.world.business,
        premises,
        businessType,
        equipment: businessEquipment,
        supplies: businessSupplies,
        menuItems: businessMenuItems,
        time: currentState.time,
        name
      });
      const logEntry = createLifeLogEntry(
        currentState,
        launched.result.ok ? 'Открытие бизнеса' : 'Бизнес недоступен',
        launched.result.messages.join(' ')
      );
      return {
        ...currentState,
        player: launched.player,
        world: { ...currentState.world, business: launched.world },
        lastResult: {
          ok: launched.result.ok,
          actionName: launched.result.actionName,
          timeDeltaMinutes: 0,
          moneyDelta: launched.result.playerMoneyDelta,
          messages: launched.result.messages
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function purchaseBusinessSupply(supplyId: BusinessSupplyId, batches = 1): void {
    const supply = getBusinessSupplyById(supplyId);
    if (!supply) return;
    setGameState((currentState) => {
      const storageMultiplier = (currentState.world.business.ownedBusiness?.upgradeIds ?? []).reduce((value, id) => {
        const upgrade = getBusinessUpgradeById(id);
        return value * (upgrade?.effect.storageMultiplier ?? 1);
      }, 1);
      const applied = buyBusinessSupply({ world: currentState.world.business, supply, batches, storageMultiplier });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Закупка бизнеса' : 'Закупка недоступна', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.businessMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function changeBusinessMenuPrice(itemId: BusinessMenuItemId, price: number): void {
    const item = getBusinessMenuItemById(itemId);
    if (!item) return;
    setGameState((currentState) => {
      const applied = setBusinessMenuPrice({ world: currentState.world.business, item, price });
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, messages: applied.result.messages }
      };
    });
  }

  function hireBusinessNpc(npcId: NpcId, role: BusinessEmployeeRole): void {
    setGameState((currentState) => {
      const premises = getBusinessPremisesById(currentState.world.business.ownedBusiness?.premisesId);
      if (!premises) return currentState;
      const roleId = role === 'barista'
        ? NPC_ROLE_IDS.barista
        : role === 'administrator'
          ? NPC_ROLE_IDS.administrator
          : NPC_ROLE_IDS.cleaner;
      const applied = hireBusinessEmployee({
        world: currentState.world.business,
        population: currentState.world.population,
        npcId,
        role,
        roleId,
        currentDay: currentState.time.day,
        premisesLocationId: premises.locationId
      });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Новый сотрудник' : 'Найм недоступен', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world, population: applied.population },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function fireBusinessNpc(npcId: NpcId): void {
    setGameState((currentState) => {
      const applied = fireBusinessEmployee({ world: currentState.world.business, population: currentState.world.population, npcId });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Сотрудник уволен' : 'Увольнение недоступно', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world, population: applied.population },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function addBusinessFunds(amount: number): void {
    setGameState((currentState) => {
      const applied = investInBusiness({ player: currentState.player, world: currentState.world.business, amount });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Пополнение бизнеса' : 'Пополнение недоступно', applied.result.messages.join(' '));
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.playerMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function purchaseBusinessEquipment(equipmentId: BusinessEquipmentId): void {
    const equipment = getBusinessEquipmentById(equipmentId);
    if (!equipment) return;
    setGameState((currentState) => {
      const applied = buyBusinessEquipment({ world: currentState.world.business, equipment });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Оборудование бизнеса' : 'Покупка недоступна', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.businessMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function purchaseBusinessUpgrade(upgradeId: BusinessUpgradeId): void {
    const upgrade = getBusinessUpgradeById(upgradeId);
    if (!upgrade) return;
    setGameState((currentState) => {
      const applied = buyBusinessUpgrade({ world: currentState.world.business, upgrade });
      const logEntry = createLifeLogEntry(currentState, applied.result.ok ? 'Развитие бизнеса' : 'Улучшение недоступно', applied.result.messages.join(' '));
      return {
        ...currentState,
        world: { ...currentState.world, business: applied.world },
        lastResult: { ok: applied.result.ok, actionName: applied.result.actionName, timeDeltaMinutes: 0, moneyDelta: applied.result.businessMoneyDelta, messages: applied.result.messages },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function workBusinessOwnerShift(): void {
    setGameState((currentState) => {
      const business = currentState.world.business.ownedBusiness;
      const premises = getBusinessPremisesById(business?.premisesId);
      const businessType = getBusinessTypeById(business?.typeId);
      if (!business || !premises || !businessType) return currentState;
      const failure = getMedicalActivityFailure(currentState.world.medical, 'work')
        ?? (currentState.player.locationId !== premises.locationId
        ? 'Нужно быть в своей кофейне.'
        : getScheduleActivityFailure(business.schedule, currentState.time, 240, 'Смена владельца')
          ?? getNeedsRequirementFailure(currentState.player.needs, { minEnergy: 20, minHealth: 25, minHunger: 6, minThirst: 6 }));
      if (failure) {
        const logEntry = createLifeLogEntry(currentState, 'Смена владельца недоступна', failure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Смена владельца', timeDeltaMinutes: 0, messages: [failure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const needsApplied = applyActivityNeedsDelta(currentState.player.needs, { energy: -16, hunger: -6, thirst: -8, mood: -1 }, { scaleEnergyCost: true });
      const skillApplied = applySkillExperience(currentState.player.skills, basicSkills[0].id, 12);
      const ownerPlayer = { ...currentState.player, needs: needsApplied.needs, skills: skillApplied.skills };
      const nextTime = addMinutes(currentState.time, 240);
      const simulated = simulateBusinessTime({
        world: currentState.world.business,
        fromTime: currentState.time,
        toTime: nextTime,
        population: currentState.world.population,
        premises,
        businessType,
        equipment: businessEquipment,
        menuItems: businessMenuItems,
        supplies: businessSupplies,
        upgrades: businessUpgrades,
        ownerWorking: true
      });
      const balanceBefore = business.balance;
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        ownerPlayer,
        nextTime,
        'active',
        { business: simulated.world, actionTitle: 'Смена владельца' }
      );
      const sicknessApplied = applyWorkWhileSick(elapsedApplied.medical, elapsedApplied.player, getTotalMinutes(nextTime));
      const balanceAfter = elapsedApplied.business.ownedBusiness?.balance ?? balanceBefore;
      const businessMessages = simulated.events.map((event) => event.text);
      const levelMessage = skillApplied.update.leveledUp ? `Навык «Сервис» повышен до уровня ${skillApplied.update.nextLevel}.` : undefined;
      const shiftMessage = `Ты отработал четыре часа в своей кофейне. Изменение счёта бизнеса: ${balanceAfter - balanceBefore >= 0 ? '+' : ''}${balanceAfter - balanceBefore} ₽.`;
      const messages = [shiftMessage, levelMessage, sicknessApplied.message, ...businessMessages, ...elapsedApplied.messages].filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Смена владельца', messages.join(' '));
      return {
        ...currentState,
        time: nextTime,
        player: sicknessApplied.player,
        world: { ...elapsedApplied.world, medical: sicknessApplied.state },
        lastResult: {
          ok: true,
          actionName: 'Смена владельца',
          timeDeltaMinutes: 240,
          needsDelta: mergeNeedsDelta(needsApplied.delta, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...simulated.events.map((event) => createLifeLogEntry({ time: nextTime }, event.title, event.text)), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    openCoffeeBusiness,
    purchaseBusinessSupply,
    changeBusinessMenuPrice,
    hireBusinessNpc,
    fireBusinessNpc,
    addBusinessFunds,
    purchaseBusinessEquipment,
    purchaseBusinessUpgrade,
    workBusinessOwnerShift
  };
}
