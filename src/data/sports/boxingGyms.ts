import type { BoxingGym } from '../../types/boxing';
import type { BoxingGymId, BoxingTrainerId, LocationId } from '../../types/ids';

const gymId = (value: string) => value as BoxingGymId;
const trainerId = (value: string) => value as BoxingTrainerId;
const locationId = (value: string) => value as LocationId;

export const boxingGyms: BoxingGym[] = [
  {
    id: gymId('boxing_gym_luzhniki'),
    name: 'Академия бокса «Лужники»',
    locationId: locationId('msk_khamovniki_boxing_gym'),
    monthlyPrice: 4500,
    equipmentMultiplier: 1.08,
    trainerIds: [
      trainerId('trainer_sokolov'),
      trainerId('trainer_karimov'),
      trainerId('trainer_belov')
    ]
  }
];

export function getBoxingGymById(id: BoxingGymId | undefined): BoxingGym | undefined {
  return boxingGyms.find((gym) => gym.id === id);
}

export function getBoxingGymByLocationId(locationIdValue: LocationId | undefined): BoxingGym | undefined {
  return boxingGyms.find((gym) => gym.locationId === locationIdValue);
}
