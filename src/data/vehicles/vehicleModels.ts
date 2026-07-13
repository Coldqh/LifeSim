import type { VehicleModelId } from '../../types/ids';
import type { VehicleModel } from '../../types/vehicle';

function vehicleModelId(value: string): VehicleModelId {
  return value as VehicleModelId;
}

export const vehicleModels: VehicleModel[] = [
  {
    id: vehicleModelId('lada_granta_2018'), brand: 'LADA', model: 'Granta', generation: 'I', tier: 'budget', bodyType: 'sedan',
    fuelType: 'petrol_92', powerHp: 87, fuelTankLiters: 50, consumptionLitersPer100Km: 7.0, reliability: 76,
    serviceIntervalKm: 15000, baseServiceCost: 13500, newPrice: 0, dealerAvailable: false,
    description: 'Самый доступный вариант на вторичном рынке.'
  },
  {
    id: vehicleModelId('lada_granta_2026'), brand: 'LADA', model: 'Granta', generation: 'I FL', tier: 'budget', bodyType: 'sedan',
    fuelType: 'petrol_92', powerHp: 90, fuelTankLiters: 50, consumptionLitersPer100Km: 7.1, reliability: 78,
    serviceIntervalKm: 15000, baseServiceCost: 14500, newPrice: 1180000, dealerAvailable: true,
    description: 'Простая новая машина с дешёвым обслуживанием.'
  },
  {
    id: vehicleModelId('lada_vesta_2026'), brand: 'LADA', model: 'Vesta', generation: 'NG', tier: 'mass', bodyType: 'sedan',
    fuelType: 'petrol_95', powerHp: 106, fuelTankLiters: 55, consumptionLitersPer100Km: 7.3, reliability: 76,
    serviceIntervalKm: 15000, baseServiceCost: 19500, newPrice: 1980000, dealerAvailable: true,
    description: 'Современный массовый седан российского производства.'
  },
  {
    id: vehicleModelId('haval_jolion_2026'), brand: 'Haval', model: 'Jolion', generation: 'I FL', tier: 'mass', bodyType: 'crossover',
    fuelType: 'petrol_95', powerHp: 150, fuelTankLiters: 55, consumptionLitersPer100Km: 8.1, reliability: 74,
    serviceIntervalKm: 10000, baseServiceCost: 28500, newPrice: 2890000, dealerAvailable: true,
    description: 'Городской кроссовер с богатой комплектацией.'
  },
  {
    id: vehicleModelId('geely_monjaro_2026'), brand: 'Geely', model: 'Monjaro', generation: 'I', tier: 'business', bodyType: 'crossover',
    fuelType: 'petrol_95', powerHp: 238, fuelTankLiters: 62, consumptionLitersPer100Km: 8.5, reliability: 75,
    serviceIntervalKm: 10000, baseServiceCost: 42000, newPrice: 4890000, dealerAvailable: true,
    description: 'Крупный технологичный кроссовер бизнес-класса.'
  },
  {
    id: vehicleModelId('exeed_rx_2026'), brand: 'EXEED', model: 'RX', generation: 'I', tier: 'premium', bodyType: 'crossover',
    fuelType: 'petrol_95', powerHp: 249, fuelTankLiters: 65, consumptionLitersPer100Km: 8.8, reliability: 70,
    serviceIntervalKm: 10000, baseServiceCost: 56000, newPrice: 5690000, dealerAvailable: true,
    description: 'Премиальный кроссовер с дорогим обслуживанием.'
  },
  {
    id: vehicleModelId('bmw_530d_2025'), brand: 'BMW', model: '530d xDrive', generation: 'G60', tier: 'luxury', bodyType: 'sedan',
    fuelType: 'diesel', powerHp: 286, fuelTankLiters: 60, consumptionLitersPer100Km: 6.4, reliability: 67,
    serviceIntervalKm: 12000, baseServiceCost: 115000, newPrice: 13500000, dealerAvailable: true,
    description: 'Быстрый представительский седан параллельного импорта.'
  },
  {
    id: vehicleModelId('mercedes_s450_2025'), brand: 'Mercedes-Benz', model: 'S 450 4MATIC', generation: 'W223', tier: 'luxury', bodyType: 'sedan',
    fuelType: 'petrol_95', powerHp: 367, fuelTankLiters: 76, consumptionLitersPer100Km: 9.4, reliability: 62,
    serviceIntervalKm: 12000, baseServiceCost: 185000, newPrice: 25500000, dealerAvailable: true,
    description: 'Флагманский седан с очень дорогим содержанием.'
  },
  {
    id: vehicleModelId('porsche_cayenne_2025'), brand: 'Porsche', model: 'Cayenne', generation: 'III FL', tier: 'luxury', bodyType: 'suv',
    fuelType: 'petrol_95', powerHp: 353, fuelTankLiters: 90, consumptionLitersPer100Km: 11.7, reliability: 66,
    serviceIntervalKm: 12000, baseServiceCost: 210000, newPrice: 21900000, dealerAvailable: true,
    description: 'Дорогой мощный SUV с высоким расходом топлива.'
  },
  {
    id: vehicleModelId('hyundai_solaris_2017'), brand: 'Hyundai', model: 'Solaris', generation: 'II', tier: 'budget', bodyType: 'sedan',
    fuelType: 'petrol_92', powerHp: 123, fuelTankLiters: 50, consumptionLitersPer100Km: 6.6, reliability: 83,
    serviceIntervalKm: 15000, baseServiceCost: 22000, newPrice: 0, dealerAvailable: false,
    description: 'Надёжный массовый автомобиль для первой покупки.'
  },
  {
    id: vehicleModelId('kia_rio_2020'), brand: 'Kia', model: 'Rio', generation: 'IV FL', tier: 'mass', bodyType: 'sedan',
    fuelType: 'petrol_92', powerHp: 123, fuelTankLiters: 50, consumptionLitersPer100Km: 6.8, reliability: 82,
    serviceIntervalKm: 15000, baseServiceCost: 24000, newPrice: 0, dealerAvailable: false,
    description: 'Практичный городской седан с понятным обслуживанием.'
  },
  {
    id: vehicleModelId('skoda_rapid_2020'), brand: 'Skoda', model: 'Rapid', generation: 'II', tier: 'mass', bodyType: 'liftback',
    fuelType: 'petrol_95', powerHp: 110, fuelTankLiters: 55, consumptionLitersPer100Km: 6.3, reliability: 80,
    serviceIntervalKm: 15000, baseServiceCost: 28000, newPrice: 0, dealerAvailable: false,
    description: 'Вместительный лифтбек для города и работы.'
  },
  {
    id: vehicleModelId('toyota_camry_2019'), brand: 'Toyota', model: 'Camry', generation: 'XV70', tier: 'business', bodyType: 'sedan',
    fuelType: 'petrol_95', powerHp: 181, fuelTankLiters: 60, consumptionLitersPer100Km: 8.2, reliability: 86,
    serviceIntervalKm: 10000, baseServiceCost: 42000, newPrice: 0, dealerAvailable: false,
    description: 'Ликвидный бизнес-седан с высокой надёжностью.'
  },
  {
    id: vehicleModelId('bmw_530d_2018'), brand: 'BMW', model: '530d xDrive', generation: 'G30', tier: 'premium', bodyType: 'sedan',
    fuelType: 'diesel', powerHp: 249, fuelTankLiters: 66, consumptionLitersPer100Km: 6.1, reliability: 69,
    serviceIntervalKm: 10000, baseServiceCost: 95000, newPrice: 0, dealerAvailable: false,
    description: 'Быстрый дизельный седан с дорогим риском ремонта.'
  },
  {
    id: vehicleModelId('porsche_cayenne_2019'), brand: 'Porsche', model: 'Cayenne', generation: 'III', tier: 'luxury', bodyType: 'suv',
    fuelType: 'petrol_95', powerHp: 340, fuelTankLiters: 90, consumptionLitersPer100Km: 11.4, reliability: 68,
    serviceIntervalKm: 10000, baseServiceCost: 185000, newPrice: 0, dealerAvailable: false,
    description: 'Статусный SUV с высокими эксплуатационными расходами.'
  }
];

export function getVehicleModelById(id: VehicleModelId | undefined): VehicleModel | undefined {
  return vehicleModels.find((model) => model.id === id);
}

export const newDealerVehicleModels = vehicleModels.filter((model) => model.dealerAvailable);
