import { applyMoneyDelta, canAfford } from '../../core/economy';
import { addInventoryItem, hasInventoryItem, removeInventoryItem } from '../../core/inventory';
import { applyMedicalProduct, applyProductMedicalRisk } from '../../core/healthcare';
import { getLocationById } from '../../core/location';
import { getOrganizationLocationModifier } from '../../core/organizations';
import { applyNeedsDelta, getNeedWarning } from '../../core/needs';
import { getShopForLocation, isProductSoldByShop } from '../../core/shop';
import { getScheduleActivityFailure } from '../../core/schedule';
import { addMinutes, getTotalMinutes } from '../../core/time';
import { getProductById } from '../../data/products/basicProducts';
import { getCommerceOrganizationForLocation } from '../../data/organizations';
import type { ProductId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createInventoryCommands(setGameState: GameStateSetter) {
  function buyProduct(productId: ProductId): void {
    setGameState((currentState) => {
      const location = getLocationById(currentState.player.locationId);
      const shop = getShopForLocation(location);
      const product = getProductById(productId);

      if (!shop || !product || !isProductSoldByShop(shop.id, productId)) {
        const message = 'Этот товар здесь не продаётся.';
        const logEntry = createLifeLogEntry(currentState, 'Покупка не прошла', message);

        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            messages: [message]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const organizationModifier = getOrganizationLocationModifier({ state: currentState.world.organizations, definition: getCommerceOrganizationForLocation(location?.id), day: currentState.time.day });
      const scheduleFailure = organizationModifier.failure ?? getScheduleActivityFailure(location?.openingHours, currentState.time, 0, 'Магазин');
      if (scheduleFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Покупка не прошла', scheduleFailure);
        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            messages: [scheduleFailure]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const effectivePrice = Math.max(1, Math.round(product.price * organizationModifier.priceMultiplier));
      if (!canAfford(currentState.player.money, effectivePrice)) {
        const message = 'Не хватает денег.';
        const logEntry = createLifeLogEntry(currentState, 'Покупка не прошла', message);

        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            moneyDelta: 0,
            messages: [message]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const nextPlayer = {
        ...currentState.player,
        money: applyMoneyDelta(currentState.player.money, -effectivePrice),
        inventory: addInventoryItem(currentState.player.inventory, product.id)
      };
      const priceNote = effectivePrice !== product.price ? ` Цена организации: ${effectivePrice} ₽.` : '';
      const message = `Куплено: ${product.name}. Товар добавлен в инвентарь.${priceNote}`;
      const logEntry = createLifeLogEntry(currentState, 'Покупка', message);

      return {
        ...currentState,
        player: nextPlayer,
        lastResult: {
          ok: true,
          actionName: product.category === 'medicine' ? `Аптека: ${product.name}` : `Покупка: ${product.name}`,
          timeDeltaMinutes: 0,
          moneyDelta: -effectivePrice,
          messages: [message]
        },
        lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
      };
    });
  }

  function useInventoryItem(productId: ProductId): void {
    setGameState((currentState) => {
      const product = getProductById(productId);

      if (!product || !hasInventoryItem(currentState.player.inventory, productId)) {
        const message = 'Предмет не найден в инвентаре.';
        const logEntry = createLifeLogEntry(currentState, 'Инвентарь', message);

        return {
          ...currentState,
          lastResult: {
            ok: false,
            timeDeltaMinutes: 0,
            messages: [message]
          },
          lifeLog: [logEntry, ...currentState.lifeLog].slice(0, 12)
        };
      }

      const nextTime = addMinutes(currentState.time, product.useDurationMinutes);
      const medicalUse = applyMedicalProduct({
        state: currentState.world.medical,
        productId: product.id,
        medicalUse: product.medicalUse,
        totalMinutes: getTotalMinutes(nextTime)
      });
      if (product.medicalUse && medicalUse.appliedConditionIds.length === 0) {
        const message = medicalUse.message ?? 'Средство сейчас не требуется.';
        const logEntry = createLifeLogEntry(currentState, 'Лечение недоступно', message);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: product.name, timeDeltaMinutes: 0, messages: [message] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const consumedPlayer = {
        ...currentState.player,
        needs: applyNeedsDelta(currentState.player.needs, product.effects),
        inventory: removeInventoryItem(currentState.player.inventory, productId)
      };
      const productRisk = applyProductMedicalRisk({
        state: medicalUse.state,
        player: consumedPlayer,
        productId: product.id,
        totalMinutes: getTotalMinutes(nextTime)
      });
      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        productRisk.player,
        nextTime,
        'active',
        { medical: productRisk.state, actionTitle: product.name }
      );
      const warning = getNeedWarning(elapsedApplied.player.needs);
      const message = `Использовано: ${product.name}. Потрачено ${product.useDurationMinutes} мин.`;
      const messages = [message, medicalUse.message, productRisk.message, warning, ...elapsedApplied.messages]
        .filter((entry): entry is string => Boolean(entry));
      const logEntry = createLifeLogEntry({ time: nextTime }, 'Инвентарь', messages.join(' '));

      return {
        ...currentState,
        time: nextTime,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          timeDeltaMinutes: product.useDurationMinutes,
          needsDelta: mergeNeedsDelta(product.effects, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    buyProduct,
    useInventoryItem
  };
}
