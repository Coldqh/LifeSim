import type { LocationId, MedicalServiceId } from '../../types/ids';
import type { MedicalService } from '../../types/healthcare';
import { CLINIC_SCHEDULE } from '../schedules/basicSchedules';

function medicalServiceId(value: string): MedicalServiceId {
  return value as MedicalServiceId;
}

function locationId(value: string): LocationId {
  return value as LocationId;
}

const clinicLocationId = locationId('msk_khamovniki_medical_center');

export const medicalServices: MedicalService[] = [
  {
    id: medicalServiceId('medical_therapist'),
    name: 'Приём терапевта',
    specialty: 'therapist',
    clinicLocationId,
    price: 1800,
    durationMinutes: 45,
    schedule: CLINIC_SCHEDULE,
    diagnoses: ['dehydration', 'malnutrition', 'exhaustion', 'common_cold', 'food_poisoning', 'gastritis_flare', 'overtraining', 'insomnia']
  },
  {
    id: medicalServiceId('medical_traumatologist'),
    name: 'Приём травматолога',
    specialty: 'traumatologist',
    clinicLocationId,
    price: 2600,
    durationMinutes: 50,
    schedule: CLINIC_SCHEDULE,
    diagnoses: ['muscle_strain', 'hand_contusion', 'facial_cut']
  },
  {
    id: medicalServiceId('medical_sports_doctor'),
    name: 'Спортивный врач',
    specialty: 'sports_doctor',
    clinicLocationId,
    price: 3000,
    durationMinutes: 60,
    schedule: CLINIC_SCHEDULE,
    diagnoses: ['dehydration', 'exhaustion', 'muscle_strain', 'hand_contusion', 'facial_cut', 'overtraining']
  },
  {
    id: medicalServiceId('medical_basic_labs'),
    name: 'Базовые анализы',
    specialty: 'laboratory',
    clinicLocationId,
    price: 1500,
    durationMinutes: 30,
    schedule: CLINIC_SCHEDULE,
    diagnoses: ['food_poisoning']
  }
];

export function getMedicalServiceById(id: MedicalServiceId): MedicalService | undefined {
  return medicalServices.find((entry) => entry.id === id);
}
