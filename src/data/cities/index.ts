import { createCityRegistry } from './registry';
import { moscowContentPack } from './moscowPack';
import { yaroslavlContentPack } from './yaroslavlPack';

export { moscowCity } from './moscow';
export { yaroslavlCity } from './yaroslavl';
export { moscowContentPack } from './moscowPack';
export { yaroslavlContentPack } from './yaroslavlPack';
export * from './contentPackBuilder';
export * from './registry';

export const cityRegistry = createCityRegistry([
  moscowContentPack,
  yaroslavlContentPack
]);

export const allCities = [...cityRegistry.cities];
