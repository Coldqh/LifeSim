export type CurrencyCode = 'RUB' | 'USD' | 'EUR';

export type MoneyAmount = {
  value: number;
  currency: CurrencyCode;
};

export type EconomyDelta = {
  money?: number;
};
