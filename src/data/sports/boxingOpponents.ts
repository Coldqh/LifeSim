import type { BoxingOpponent } from '../../types/boxing';
import type { BoxingOpponentId } from '../../types/ids';

const opponentId = (value: string) => value as BoxingOpponentId;

export const boxingOpponents: BoxingOpponent[] = [
  {
    id: opponentId('opponent_ivan_rybin'),
    name: 'Иван Рыбин',
    age: 19,
    club: 'Секция «Динамо»',
    weightKg: 81,
    rating: 980,
    style: 'pressure',
    stats: { technique: 20, speed: 19, power: 22, defense: 18, stamina: 21 }
  },
  {
    id: opponentId('opponent_artem_volkov'),
    name: 'Артём Волков',
    age: 20,
    club: 'Клуб «Торпедо»',
    weightKg: 83,
    rating: 1040,
    style: 'counterpuncher',
    stats: { technique: 23, speed: 22, power: 19, defense: 24, stamina: 21 }
  },
  {
    id: opponentId('opponent_timur_isaev'),
    name: 'Тимур Исаев',
    age: 21,
    club: 'СК «Юг»',
    weightKg: 82,
    rating: 1100,
    style: 'outboxer',
    stats: { technique: 25, speed: 25, power: 20, defense: 23, stamina: 24 }
  }
];

export function getBoxingOpponentById(id: BoxingOpponentId | undefined): BoxingOpponent | undefined {
  return boxingOpponents.find((opponent) => opponent.id === id);
}
