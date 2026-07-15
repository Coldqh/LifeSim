import { createCityRegistry } from './registry';
import { moscowContentPack } from './moscowPack';
import { yaroslavlContentPack } from './yaroslavlPack';
import { rybinskContentPack } from './rybinskPack';

export { moscowCity } from './moscow';
export { yaroslavlCity } from './yaroslavl';
export { rybinskCity } from './rybinsk';
export { moscowContentPack } from './moscowPack';
export { yaroslavlContentPack } from './yaroslavlPack';
export { rybinskContentPack } from './rybinskPack';
export * from './contentPackBuilder';
export * from './registry';

export const cityRegistry = createCityRegistry([
  moscowContentPack,
  yaroslavlContentPack,
  rybinskContentPack
]);

export const allCities = [...cityRegistry.cities];
