import { cityRegistry } from '../cities';
import { moscowLocations } from './moscowLocations';
import { yaroslavlLocations } from './yaroslavlLocations';
import { rybinskLocations } from './rybinskLocations';

export { moscowLocations, yaroslavlLocations, rybinskLocations };
export const allLocations = [...cityRegistry.locations];
