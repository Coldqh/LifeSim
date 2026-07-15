import type { BoxingGym, BoxingTrainer } from '../../types/boxing';
import type { BoxingGymId, BoxingTrainerId, LocationId } from '../../types/ids';

const gymId = (value: string) => value as BoxingGymId;
const trainerId = (value: string) => value as BoxingTrainerId;
const locationId = (value: string) => value as LocationId;

export const rybinskBoxingTrainers: BoxingTrainer[] = [
  {
    id: trainerId('trainer_ryb_orlov'),
    name: 'Илья Орлов',
    specialty: 'technique',
    sessionPrice: 250,
    experienceMultiplier: 1.08,
    specialtyMultiplier: 1.28
  },
  {
    id: trainerId('trainer_ryb_melnikov'),
    name: 'Сергей Мельников',
    specialty: 'stamina',
    sessionPrice: 200,
    experienceMultiplier: 1.05,
    specialtyMultiplier: 1.3
  }
];

export const rybinskBoxingGyms: BoxingGym[] = [
  {
    id: gymId('boxing_gym_rybinsk_volga'),
    name: 'Боксёрский клуб «Волга»',
    locationId: locationId('ryb_severny_boxing_gym'),
    monthlyPrice: 2800,
    equipmentMultiplier: 1.02,
    trainerIds: rybinskBoxingTrainers.map((trainer) => trainer.id)
  }
];
