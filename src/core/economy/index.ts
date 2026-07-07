export function applyMoneyDelta(currentMoney: number, moneyDelta = 0): number {
  return Math.max(0, Math.round(currentMoney + moneyDelta));
}

export function canAfford(currentMoney: number, cost: number): boolean {
  return currentMoney >= Math.max(0, cost);
}

export function formatRubles(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);
}

export type { EconomyDelta, MoneyAmount, CurrencyCode } from '../../types/economy';
