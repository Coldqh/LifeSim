import type { EventId } from './ids';

export type GameEvent = {
  id: EventId;
  title: string;
  text: string;
};
