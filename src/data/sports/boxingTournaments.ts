import type { BoxingTournament } from '../../types/boxing';
import type { BoxingOpponentId, BoxingTournamentId, LocationId } from '../../types/ids';

const tournamentId = (value: string) => value as BoxingTournamentId;
const opponentId = (value: string) => value as BoxingOpponentId;
const locationId = (value: string) => value as LocationId;

export const boxingTournaments: BoxingTournament[] = [
  {
    id: tournamentId('tournament_open_club_cup'),
    name: 'Открытый кубок клуба',
    locationId: locationId('msk_khamovniki_boxing_gym'),
    entryFee: 1500,
    minSparrings: 3,
    minTechnique: 24,
    minStamina: 24,
    minForm: 60,
    maxFatigue: 50,
    opponentIds: [
      opponentId('opponent_ivan_rybin'),
      opponentId('opponent_artem_volkov'),
      opponentId('opponent_timur_isaev')
    ]
  }
];

export function getBoxingTournamentById(id: BoxingTournamentId | undefined): BoxingTournament | undefined {
  return boxingTournaments.find((tournament) => tournament.id === id);
}
