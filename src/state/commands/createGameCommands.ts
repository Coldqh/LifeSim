import type { GameStateSetter } from './commandSupport';
import { createActionCommands } from './actionCommands';
import { createTravelCommands } from './travelCommands';
import { createInventoryCommands } from './inventoryCommands';
import { createJobCommands } from './jobCommands';
import { createEducationCommands } from './educationCommands';
import { createBoxingCommands } from './boxingCommands';
import { createHousingCommands } from './housingCommands';
import { createSocialCommands } from './socialCommands';
import { createBusinessCommands } from './businessCommands';
import { createPhoneCommands } from './phoneCommands';
import { createMedicalCommands } from './medicalCommands';
import { createVehicleUiCommands } from './vehicleUiCommands';
import { createIntercityCommands } from './intercityCommands';
import { createFinanceCommands } from './financeCommands';
import { createUniversityCommands } from './universityCommands';
import { createTimeCommands } from './timeCommands';
import { createSystemCommands } from './systemCommands';
import { createDailyLifeCommands } from './dailyLifeCommands';

export function createGameCommands(setGameState: GameStateSetter) {
  return {
    ...createActionCommands(setGameState),
    ...createTravelCommands(setGameState),
    ...createInventoryCommands(setGameState),
    ...createJobCommands(setGameState),
    ...createEducationCommands(setGameState),
    ...createBoxingCommands(setGameState),
    ...createHousingCommands(setGameState),
    ...createSocialCommands(setGameState),
    ...createBusinessCommands(setGameState),
    ...createPhoneCommands(setGameState),
    ...createMedicalCommands(setGameState),
    ...createVehicleUiCommands(setGameState),
    ...createIntercityCommands(setGameState),
    ...createFinanceCommands(setGameState),
    ...createUniversityCommands(setGameState),
    ...createTimeCommands(setGameState),
    ...createSystemCommands(setGameState),
    ...createDailyLifeCommands(setGameState)
  };
}

export type GameCommands = ReturnType<typeof createGameCommands>;
