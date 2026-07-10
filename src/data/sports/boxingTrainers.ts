import type { BoxingTrainer } from '../../types/boxing';
import type { BoxingTrainerId } from '../../types/ids';

const trainerId = (value: string) => value as BoxingTrainerId;

export const boxingTrainers: BoxingTrainer[] = [
  {
    id: trainerId('trainer_sokolov'),
    name: 'Андрей Соколов',
    specialty: 'balanced',
    sessionPrice: 0,
    experienceMultiplier: 1,
    specialtyMultiplier: 1
  },
  {
    id: trainerId('trainer_karimov'),
    name: 'Рашид Каримов',
    specialty: 'technique',
    sessionPrice: 450,
    experienceMultiplier: 1.12,
    specialtyMultiplier: 1.35
  },
  {
    id: trainerId('trainer_belov'),
    name: 'Максим Белов',
    specialty: 'power',
    sessionPrice: 350,
    experienceMultiplier: 1.08,
    specialtyMultiplier: 1.35
  }
];

export function getBoxingTrainerById(id: BoxingTrainerId | undefined): BoxingTrainer | undefined {
  return boxingTrainers.find((trainer) => trainer.id === id);
}
