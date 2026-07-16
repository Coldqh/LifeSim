import { describe, expect, it } from 'vitest';
import { createTransportOptions } from './index';

const needs = { hunger: 80, thirst: 80, energy: 80, health: 80, mood: 80 };

describe('travel world conditions', () => {
  it('slows public transport without changing walking time', () => {
    const normal = createTransportOptions({
      baseDurationMinutes: 45,
      isCrossDistrict: true,
      context: { playerMoney: 5000, playerNeeds: needs }
    });
    const disrupted = createTransportOptions({
      baseDurationMinutes: 45,
      isCrossDistrict: true,
      context: { playerMoney: 5000, playerNeeds: needs, publicTransportDurationMultiplier: 1.25 }
    });

    const normalMetro = normal.find((entry) => entry.modeId === 'metro');
    const delayedMetro = disrupted.find((entry) => entry.modeId === 'metro');
    const normalWalk = normal.find((entry) => entry.modeId === 'walk');
    const delayedWalk = disrupted.find((entry) => entry.modeId === 'walk');

    expect(delayedMetro!.durationMinutes).toBeGreaterThan(normalMetro!.durationMinutes);
    expect(delayedWalk!.durationMinutes).toBe(normalWalk!.durationMinutes);
  });
});
