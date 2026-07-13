import { cityRegistry } from '../cities';
import { moscowLocations } from './moscowLocations';
import { yaroslavlLocations } from './yaroslavlLocations';

export { moscowLocations, yaroslavlLocations };
export const allLocations = [...cityRegistry.locations];
