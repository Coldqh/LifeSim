import { describe, expect, it } from 'vitest';
import { APP_META } from './phoneShared';
import { PHONE_APP_LOADERS } from './phoneAppRegistry';

describe('phone app registry', () => {
  it('has one lazy loader for every app shown on the phone home screen', () => {
    expect(Object.keys(PHONE_APP_LOADERS)).toEqual(APP_META.map((app) => app.id));
  });
});
