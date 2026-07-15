import { describe, expect, it } from 'vitest';
import { getElapsedMinutes } from '../../core/time';
import { createInitialGameState, type GameState } from '../gameState';
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
      'performAction',
      'performBoxingTraining',
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
      'respondNpcMeetingInvitation',
      'scheduleHousingViewingAction',
      'scheduleMedicalVisit',
      'scheduleVehicleInspectionAction',
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
});
