import type { LocationId, MedicalAppointmentId, MedicalServiceId, ProductId } from './ids';
import type { NeedsState } from './needs';
import type { WeeklySchedule } from './schedule';

export type MedicalConditionId =
  | 'dehydration'
  | 'malnutrition'
  | 'exhaustion'
  | 'common_cold'
  | 'food_poisoning'
  | 'gastritis_flare'
  | 'muscle_strain'
  | 'hand_contusion'
  | 'facial_cut'
  | 'overtraining'
  | 'insomnia';

export type MedicalSeverity = 'mild' | 'moderate' | 'severe';
export type MedicalSpecialty = 'therapist' | 'traumatologist' | 'sports_doctor' | 'laboratory';
export type MedicalConditionSource = 'needs' | 'work' | 'boxing' | 'food' | 'sleep' | 'event';

export type MedicalConditionDefinition = {
  id: MedicalConditionId;
  name: string;
  symptoms: string[];
  baseRecoveryHours: number;
  healthDrainPerDay: number;
  energyCostMultiplier: number;
  blockedActivityKinds?: Array<'work' | 'boxing_training' | 'sparring' | 'tournament'>;
  diagnosedBy: MedicalSpecialty[];
  recommendedProductIds: ProductId[];
};

export type ActiveMedicalCondition = {
  id: MedicalConditionId;
  severity: MedicalSeverity;
  source: MedicalConditionSource;
  startedAtTotalMinutes: number;
  recoveryHoursRemaining: number;
  diagnosed: boolean;
  treatmentProgress: number;
  lastUpdatedTotalMinutes: number;
};

export type MedicalService = {
  id: MedicalServiceId;
  name: string;
  specialty: MedicalSpecialty;
  clinicLocationId: LocationId;
  price: number;
  durationMinutes: number;
  schedule?: WeeklySchedule;
  diagnoses: MedicalConditionId[];
};

export type MedicalAppointmentStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';

export type MedicalAppointment = {
  id: MedicalAppointmentId;
  serviceId: MedicalServiceId;
  clinicLocationId: LocationId;
  startsAtTotalMinutes: number;
  durationMinutes: number;
  status: MedicalAppointmentStatus;
  createdAtTotalMinutes: number;
};

export type MedicalPrescription = {
  id: string;
  conditionId: MedicalConditionId;
  productId: ProductId;
  issuedAtTotalMinutes: number;
  recommendedUses: number;
  completedUses: number;
  active: boolean;
};

export type SickLeave = {
  issuedAtDay: number;
  endsAtDay: number;
  active: boolean;
  conditionIds: MedicalConditionId[];
};

export type MedicalHistoryEntry = {
  id: string;
  totalMinutes: number;
  title: string;
  text: string;
};

export type MedicalState = {
  conditions: ActiveMedicalCondition[];
  appointments: MedicalAppointment[];
  prescriptions: MedicalPrescription[];
  history: MedicalHistoryEntry[];
  sickLeave?: SickLeave;
  lastProcessedTotalMinutes: number;
  triggerCooldowns: Partial<Record<MedicalConditionId, number>>;
};

export type MedicalProductUse = {
  conditionIds: MedicalConditionId[];
  treatmentHours: number;
  symptomRelief?: number;
  requiresDiagnosis?: boolean;
};

export type MedicalOperationResult = {
  ok: boolean;
  title: string;
  message: string;
  timeDeltaMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
};
