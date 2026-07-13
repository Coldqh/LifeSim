import type { ProductId } from '../../types/ids';
import type { MedicalConditionDefinition, MedicalConditionId } from '../../types/healthcare';

function productId(value: string): ProductId {
  return value as ProductId;
}

export const medicalConditionDefinitions: MedicalConditionDefinition[] = [
  {
    id: 'dehydration',
    name: 'Обезвоживание',
    symptoms: ['сухость во рту', 'слабость', 'головная боль'],
    baseRecoveryHours: 18,
    healthDrainPerDay: 4,
    energyCostMultiplier: 1.2,
    blockedActivityKinds: ['sparring', 'tournament'],
    diagnosedBy: ['therapist', 'sports_doctor'],
    recommendedProductIds: [productId('electrolyte_pack'), productId('water_15l')]
  },
  {
    id: 'malnutrition',
    name: 'Истощение питания',
    symptoms: ['слабость', 'дрожь', 'плохая концентрация'],
    baseRecoveryHours: 24,
    healthDrainPerDay: 3,
    energyCostMultiplier: 1.18,
    blockedActivityKinds: ['sparring', 'tournament'],
    diagnosedBy: ['therapist'],
    recommendedProductIds: [productId('business_lunch'), productId('ready_meal')]
  },
  {
    id: 'exhaustion',
    name: 'Физическое истощение',
    symptoms: ['сонливость', 'слабость', 'замедленная реакция'],
    baseRecoveryHours: 20,
    healthDrainPerDay: 2,
    energyCostMultiplier: 1.25,
    blockedActivityKinds: ['boxing_training', 'sparring', 'tournament'],
    diagnosedBy: ['therapist', 'sports_doctor'],
    recommendedProductIds: [productId('electrolyte_pack')]
  },
  {
    id: 'common_cold',
    name: 'Лёгкая простуда',
    symptoms: ['насморк', 'ломота', 'слабость'],
    baseRecoveryHours: 72,
    healthDrainPerDay: 1,
    energyCostMultiplier: 1.12,
    diagnosedBy: ['therapist'],
    recommendedProductIds: [productId('cold_medicine')]
  },
  {
    id: 'food_poisoning',
    name: 'Пищевое отравление',
    symptoms: ['тошнота', 'слабость', 'жажда'],
    baseRecoveryHours: 40,
    healthDrainPerDay: 5,
    energyCostMultiplier: 1.25,
    blockedActivityKinds: ['work', 'boxing_training', 'sparring', 'tournament'],
    diagnosedBy: ['therapist', 'laboratory'],
    recommendedProductIds: [productId('electrolyte_pack')]
  },
  {
    id: 'gastritis_flare',
    name: 'Обострение желудка',
    symptoms: ['жжение в желудке', 'тяжесть', 'снижение аппетита'],
    baseRecoveryHours: 48,
    healthDrainPerDay: 2,
    energyCostMultiplier: 1.08,
    diagnosedBy: ['therapist'],
    recommendedProductIds: [productId('stomach_relief')]
  },
  {
    id: 'muscle_strain',
    name: 'Растяжение мышцы',
    symptoms: ['боль при движении', 'скованность', 'снижение силы'],
    baseRecoveryHours: 96,
    healthDrainPerDay: 1,
    energyCostMultiplier: 1.08,
    blockedActivityKinds: ['boxing_training', 'sparring', 'tournament'],
    diagnosedBy: ['traumatologist', 'sports_doctor'],
    recommendedProductIds: [productId('painkiller'), productId('bandage_kit')]
  },
  {
    id: 'hand_contusion',
    name: 'Ушиб кисти',
    symptoms: ['боль в кисти', 'отёк', 'слабый захват'],
    baseRecoveryHours: 120,
    healthDrainPerDay: 1,
    energyCostMultiplier: 1.05,
    blockedActivityKinds: ['boxing_training', 'sparring', 'tournament'],
    diagnosedBy: ['traumatologist', 'sports_doctor'],
    recommendedProductIds: [productId('painkiller'), productId('bandage_kit')]
  },
  {
    id: 'facial_cut',
    name: 'Рассечение',
    symptoms: ['боль', 'кровоточивость', 'раздражение кожи'],
    baseRecoveryHours: 72,
    healthDrainPerDay: 1,
    energyCostMultiplier: 1.02,
    blockedActivityKinds: ['sparring', 'tournament'],
    diagnosedBy: ['traumatologist', 'sports_doctor'],
    recommendedProductIds: [productId('antiseptic'), productId('bandage_kit')]
  },
  {
    id: 'overtraining',
    name: 'Перетренированность',
    symptoms: ['постоянная усталость', 'плохой сон', 'снижение формы'],
    baseRecoveryHours: 72,
    healthDrainPerDay: 2,
    energyCostMultiplier: 1.2,
    blockedActivityKinds: ['boxing_training', 'sparring', 'tournament'],
    diagnosedBy: ['sports_doctor', 'therapist'],
    recommendedProductIds: [productId('electrolyte_pack')]
  },
  {
    id: 'insomnia',
    name: 'Нарушение сна',
    symptoms: ['трудно уснуть', 'разбитость утром', 'раздражительность'],
    baseRecoveryHours: 64,
    healthDrainPerDay: 1,
    energyCostMultiplier: 1.12,
    diagnosedBy: ['therapist'],
    recommendedProductIds: []
  }
];

export function getMedicalConditionDefinition(id: MedicalConditionId): MedicalConditionDefinition | undefined {
  return medicalConditionDefinitions.find((entry) => entry.id === id);
}
