import { describe, expect, it } from 'vitest';
import { addMinutes } from './index';
import type { GameTime } from '../../types/time';

describe('addMinutes', () => {
  it('adds minutes and crosses into the next day', () => {
    const time: GameTime = {
      day: 1,
      hour: 23,
      minute: 50,
      weekday: 'monday'
    };

    expect(addMinutes(time, 20)).toEqual({
      day: 2,
      hour: 0,
      minute: 10,
      weekday: 'tuesday'
    });
  });
});
