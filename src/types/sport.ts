import type { LeagueId, SportId } from './ids';

export type Sport = {
  id: SportId;
  name: string;
};

export type League = {
  id: LeagueId;
  sportId: SportId;
  name: string;
};
