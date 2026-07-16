import { payHouseholdBills } from '../../core/household';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { mergeLifeLog } from './commandSupport';

export function createHouseholdCommands(setGameState: GameStateSetter) {
  function payHouseholdBillsAction(): void {
    setGameState((currentState) => {
      const applied = payHouseholdBills({ state: currentState.world.household, player: currentState.player });
      const logEntry = createLifeLogEntry(currentState, applied.ok ? 'Бытовые счета' : 'Оплата недоступна', applied.message);
      return {
        ...currentState,
        player: applied.player,
        world: { ...currentState.world, household: applied.state },
        lastResult: {
          ok: applied.ok,
          actionName: 'Оплата бытовых счетов',
          timeDeltaMinutes: 0,
          moneyDelta: applied.ok ? -applied.amount : 0,
          messages: [applied.message]
        },
        lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
      };
    });
  }

  return { payHouseholdBills: payHouseholdBillsAction };
}
