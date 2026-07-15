import type { MedicalService } from '../../types/healthcare';
import type { LocationId, MedicalServiceId } from '../../types/ids';
import { CLINIC_SCHEDULE } from '../schedules/basicSchedules';

const serviceId = (value: string) => value as MedicalServiceId;
const locationId = (value: string) => value as LocationId;
const clinicLocationId = locationId('ryb_center_clinic');

export const rybinskMedicalServices: MedicalService[] = [
  {
    id: serviceId('medical_ryb_therapist'), name: 'Приём терапевта', specialty: 'therapist', clinicLocationId,
    price: 1200, durationMinutes: 45, schedule: CLINIC_SCHEDULE,
    diagnoses: ['dehydration', 'malnutrition', 'exhaustion', 'common_cold', 'food_poisoning', 'gastritis_flare', 'overtraining', 'insomnia']
  },
  {
    id: serviceId('medical_ryb_traumatologist'), name: 'Приём травматолога', specialty: 'traumatologist', clinicLocationId,
    price: 1800, durationMinutes: 50, schedule: CLINIC_SCHEDULE,
    diagnoses: ['muscle_strain', 'hand_contusion', 'facial_cut']
  },
  {
    id: serviceId('medical_ryb_sports_doctor'), name: 'Спортивный врач', specialty: 'sports_doctor', clinicLocationId,
    price: 2200, durationMinutes: 60, schedule: CLINIC_SCHEDULE,
    diagnoses: ['dehydration', 'exhaustion', 'muscle_strain', 'hand_contusion', 'facial_cut', 'overtraining']
  }
];
