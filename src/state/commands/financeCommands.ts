import { createSavingsGoal, fundSavingsGoal, setFinanceAutoSave, transferFinanceFunds } from '../../core/finance';
import { getTotalMinutes } from '../../core/time';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { mergeLifeLog } from './commandSupport';

export function createFinanceCommands(setGameState: GameStateSetter) {
  function transferPersonalFunds(direction: 'bank_to_cash' | 'cash_to_bank' | 'bank_to_savings' | 'savings_to_bank', amount: number): void {
    setGameState((currentState) => {
      const applied = transferFinanceFunds({
        state: currentState.world.finance,
        player: currentState.player,
        direction,
        amount,
        totalMinutes: getTotalMinutes(currentState.time)
      });
      const logEntry = createLifeLogEntry(currentState, applied.result.title, applied.result.message);
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, finance: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  function updateAutoSave(percent: number): void {
    setGameState((currentState) => ({
      ...currentState,
      world: { ...currentState.world, finance: setFinanceAutoSave(currentState.world.finance, percent) }
    }));
  }

  function addSavingsGoal(title: string, targetAmount: number): void {
    setGameState((currentState) => {
      const applied = createSavingsGoal({ state: currentState.world.finance, title, targetAmount, day: currentState.time.day });
      return {
        ...currentState,
        world: { ...currentState.world, finance: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] }
      };
    });
  }

  function addMoneyToSavingsGoal(goalId: string, amount: number): void {
    setGameState((currentState) => {
      const applied = fundSavingsGoal({
        state: currentState.world.finance,
        player: currentState.player,
        goalId,
        amount,
        totalMinutes: getTotalMinutes(currentState.time)
      });
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, finance: applied.state },
        lastResult: { ok: applied.result.ok, actionName: applied.result.title, timeDeltaMinutes: 0, messages: [applied.result.message] }
      };
    });
  }

  return {
    transferPersonalFunds,
    updateAutoSave,
    addSavingsGoal,
    addMoneyToSavingsGoal
  };
}
