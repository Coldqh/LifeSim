import { describe, expect, it } from 'vitest';
import { applyNeedsDecay, applyNeedsDelta } from './index';
import type { NeedsState } from '../../types/needs';

const stableNeeds: NeedsState = {
  hunger: 100,
  thirst: 100,
  energy: 100,
  health: 100,
  mood: 100
};

describe('applyNeedsDelta', () => {
  it('clamps every need between zero and one hundred', () => {
    expect(applyNeedsDelta(stableNeeds, {
      hunger: 50,
      thirst: -150,
      energy: -20,
      health: 1,
      mood: -101
    })).toEqual({
      hunger: 100,
      thirst: 0,
      energy: 80,
      health: 100,
      mood: 0
    });
  });
});

describe('applyNeedsDecay', () => {
  it('applies the current active decay for one hour', () => {
    expect(applyNeedsDecay(stableNeeds, 60, 'active')).toEqual({
      needs: {
        hunger: 99,
        thirst: 98,
        energy: 99,
        health: 100,
        mood: 100
      },
      delta: {
        hunger: -1,
        thirst: -2,
        energy: -1
      }
    });
  });
});
