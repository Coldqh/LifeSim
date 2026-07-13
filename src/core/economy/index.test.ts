import { describe, expect, it } from 'vitest';
import { applyMoneyDelta } from './index';

describe('applyMoneyDelta', () => {
  it('applies and rounds a money delta', () => {
    expect(applyMoneyDelta(1_000, 249.6)).toBe(1_250);
  });

  it('does not allow money to fall below zero', () => {
    expect(applyMoneyDelta(100, -150)).toBe(0);
  });
});
