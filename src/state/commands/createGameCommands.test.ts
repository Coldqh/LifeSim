import { describe, expect, it } from 'vitest';
import { getElapsedMinutes } from '../../core/time';
import { createInitialGameState, type GameState } from '../gameState';
import type { BusinessPremisesId } from '../../types/ids';
import type { HousingId } from '../../types/housing';
import type { GameStateSetter } from './commandSupport';
import { createGameCommands } from './createGameCommands';

function createStateHarness(initialState = createInitialGameState()) {
  let state: GameState = initialState;
  const setGameState: GameStateSetter = (update) => {
    state = typeof update === 'function' ? update(state) : update;
  };

  return {
    getState: () => state,
    commands: createGameCommands(setGameState)
  };
}

describe('game command registry', () => {
  it('exposes every controller command through one stable registry', () => {
    const { commands } = createStateHarness();

    expect(Object.keys(commands).sort()).toEqual([
      'addBusinessFunds',
      'addMoneyToSavingsGoal',
      'addSavingsGoal',
      'applyForJob',
      'attendDegreeClass',
      'attendDegreeEntranceExam',
      'attendJobInterview',
      'attendMedicalVisit',
      'attendNpcMeeting',
      'boardIntercityTicketAction',
      'bookTemporaryAccommodationAction',
      'buyBoxingMembership',
      'buyIntercityTicketAction',
      'buyNewVehicleAction',
      'buyProduct',
      'buyUsedVehicleAction',
      'cancelNpcMeeting',
      'changeBusinessMenuPrice',
      'chooseBoxingTrainer',
      'chooseSocialEvent',
      'completeDegreeAssignment',
      'driveIntercityAction',
      'enrollDegreeProgram',
      'enterBoxingTournament',
      'exchangeNpcContact',
      'fireBusinessNpc',
      'hireBusinessNpc',
      'inspectVehicleAction',
      'interactWithNpc',
      'inviteNpcToMeeting',
      'moveToDistrict',
      'moveToLocation',
      'openCoffeeBusiness',
      'payHouseholdBills',
      'performAction',
      'performBoxingTraining',
      'performDegreeCampusActivity',
      'promoteJob',
      'purchaseBusinessEquipment',
      'purchaseBusinessSupply',
      'purchaseBusinessUpgrade',
      'readPhoneMessage',
      'readPhoneNotification',
      'refuelOwnedVehicle',
      'rentHousing',
      'requestSickLeave',
      'resetGame',
      'resignCurrentJob',
      'resolveDailyOpportunity',
      'respondNpcMeetingInvitation',
      'scheduleHousingViewingAction',
      'scheduleMedicalVisit',
      'scheduleVehicleInspectionAction',
      'selectLifeGoal',
      'sellOwnedVehicleAction',
      'sendNpcPhoneMessage',
      'serviceOwnedVehicle',
      'setPhoneMapLocation',
      'skipGameTime',
      'startBoxingSparring',
      'studyProgram',
      'submitDegreeApplication',
      'submitJobApplication',
      'takeDegreeSemesterExam',
      'togglePhoneSavedJob',
      'transferPersonalFunds',
      'updateAutoSave',
      'useInventoryItem',
      'viewHousing',
      'workBusinessOwnerShift',
      'workShift'
    ]);
  });

  it('advances the world once through the extracted time command', () => {
    const harness = createStateHarness();
    const before = harness.getState().time;

    harness.commands.skipGameTime(60);

    const after = harness.getState();
    expect(getElapsedMinutes(before, after.time)).toBe(60);
    expect(after.lastResult?.actionName).toBe('Ожидание');
    expect(after.lastResult?.timeDeltaMinutes).toBe(60);
  });


  it('locks the selected life goal after the first choice', () => {
    const harness = createStateHarness();

    harness.commands.selectLifeGoal('boxing');
    harness.commands.selectLifeGoal('career');

    expect(harness.getState().lifeGoals.activeGoalId).toBe('boxing');
    expect(harness.getState().lifeGoals.selectedDay).toBe(1);
    expect(harness.getState().lastResult?.ok).toBe(false);
  });

  it('enforces independence progression inside business and housing commands', () => {
    const businessHarness = createStateHarness();
    businessHarness.commands.openCoffeeBusiness('premises_danilovsky_market_kiosk' as BusinessPremisesId, 'Тестовая точка');

    expect(businessHarness.getState().lastResult?.ok).toBe(false);
    expect(businessHarness.getState().lastResult?.messages.join(' ')).toContain('уровня самостоятельности');

    const housingHarness = createStateHarness();
    housingHarness.commands.rentHousing('housing_studio_danilovsky' as HousingId);

    expect(housingHarness.getState().lastResult?.ok).toBe(false);
    expect(housingHarness.getState().lastResult?.messages.join(' ')).toContain('уровень самостоятельности');
  });

  it('runs household actions through the command registry and consumes home supplies', () => {
    const harness = createStateHarness();
    const beforeFood = harness.getState().world.household.pantry.reduce((sum, batch) => sum + batch.units, 0);

    harness.commands.performAction('cook_simple_meal' as never);

    const after = harness.getState();
    expect(after.lastResult?.ok).toBe(true);
    expect(after.lastResult?.timeDeltaMinutes).toBe(45);
    expect(after.world.household.pantry.reduce((sum, batch) => sum + batch.units, 0)).toBe(beforeFood - 1);
  });

  it('pays accrued household bills without bypassing the economy command', () => {
    const initial = createInitialGameState();
    initial.world.household.bills = initial.world.household.bills.map((bill) => ({ ...bill, accrued: 100 }));
    const harness = createStateHarness(initial);
    const beforeMoney = harness.getState().player.money;

    harness.commands.payHouseholdBills();

    expect(harness.getState().lastResult?.ok).toBe(true);
    expect(harness.getState().player.money).toBe(beforeMoney - 300);
    expect(harness.getState().world.household.bills.every((bill) => bill.accrued === 0 && bill.debt === 0)).toBe(true);
  });

  it('persists the player decision for the daily opportunity', () => {
    const harness = createStateHarness();

    harness.commands.resolveDailyOpportunity('recovery_walk:1', 'accepted');

    expect(harness.getState().world.phone.dailyOpportunityResolutions[0]).toMatchObject({
      day: 1,
      opportunityId: 'recovery_walk:1',
      decision: 'accepted'
    });
    expect(harness.getState().lastResult?.actionName).toBe('План на день');
  });

});
