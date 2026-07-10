import type { BoxingTraining } from '../../types/boxing';
import type { BoxingTrainingId } from '../../types/ids';

const trainingId = (value: string) => value as BoxingTrainingId;

export const boxingTrainings: BoxingTraining[] = [
  {
    id: trainingId('boxing_pads'),
    name: 'Работа на лапах',
    durationMinutes: 75,
    experienceReward: 24,
    fatigueDelta: 14,
    needsDelta: { energy: -18, hunger: -5, thirst: -8, mood: 5 },
    statRewards: { technique: 2, speed: 1 },
    minEnergy: 20
  },
  {
    id: trainingId('boxing_heavy_bag'),
    name: 'Работа на мешке',
    durationMinutes: 80,
    experienceReward: 22,
    fatigueDelta: 16,
    needsDelta: { energy: -20, hunger: -6, thirst: -9, mood: 4 },
    statRewards: { power: 2, stamina: 1 },
    minEnergy: 22
  },
  {
    id: trainingId('boxing_defense'),
    name: 'Защита и движение',
    durationMinutes: 70,
    experienceReward: 23,
    fatigueDelta: 13,
    needsDelta: { energy: -17, hunger: -5, thirst: -8, mood: 4 },
    statRewards: { defense: 2, technique: 1 },
    minEnergy: 20
  },
  {
    id: trainingId('boxing_conditioning'),
    name: 'ОФП боксёра',
    durationMinutes: 90,
    experienceReward: 20,
    fatigueDelta: 18,
    needsDelta: { energy: -22, hunger: -7, thirst: -11, mood: 3 },
    statRewards: { stamina: 2, power: 1 },
    minEnergy: 24
  }
];

export function getBoxingTrainingById(id: BoxingTrainingId | undefined): BoxingTraining | undefined {
  return boxingTrainings.find((training) => training.id === id);
}
