import { getMedicalActivityFailure } from '../../core/healthcare';
import { getLocationById } from '../../core/location';
import { applyBoxingMembership, applyBoxingSparring, applyBoxingTournament, applyBoxingTraining, selectBoxingTrainer } from '../../core/sport';
import { boxingGyms, getBoxingGymById } from '../../data/sports/boxingGyms';
import { getBoxingTrainerById } from '../../data/sports/boxingTrainers';
import { getBoxingTrainingById } from '../../data/sports/boxingTrainings';
import { getBoxingOpponentById } from '../../data/sports/boxingOpponents';
import { getBoxingTournamentById } from '../../data/sports/boxingTournaments';
import type { BoxingGymId, BoxingOpponentId, BoxingTournamentId, BoxingTrainerId, BoxingTrainingId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { applyBoxingOperationState, mergeLifeLog } from './commandSupport';

export function createBoxingCommands(setGameState: GameStateSetter) {
  function buyBoxingMembership(gymId: BoxingGymId): void {
    const gym = getBoxingGymById(gymId);
    if (!gym) return;
    setGameState((currentState) => {
      const location = getLocationById(gym.locationId);
      return applyBoxingOperationState(currentState, applyBoxingMembership({
        player: currentState.player,
        time: currentState.time,
        gym,
        schedule: location?.openingHours
      }), 'Бокс');
    });
  }

  function chooseBoxingTrainer(trainerId: BoxingTrainerId): void {
    const trainer = getBoxingTrainerById(trainerId);
    if (!trainer) return;
    setGameState((currentState) => {
      const gym = boxingGyms.find((candidate) => candidate.trainerIds.includes(trainer.id));
      if (!gym) return currentState;
      return applyBoxingOperationState(currentState, selectBoxingTrainer({
        player: currentState.player,
        time: currentState.time,
        gym,
        trainer
      }), 'Бокс');
    });
  }

  function performBoxingTraining(trainingId: BoxingTrainingId): void {
    const training = getBoxingTrainingById(trainingId);
    if (!training) return;
    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'boxing_training');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Бокс недоступен', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Бокс', timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const gym = boxingGyms[0];
      const location = getLocationById(gym.locationId);
      const trainer = getBoxingTrainerById(currentState.player.boxing.selectedTrainerId);
      return applyBoxingOperationState(currentState, applyBoxingTraining({
        player: currentState.player,
        time: currentState.time,
        gym,
        training,
        trainer,
        schedule: location?.openingHours
      }), 'Тренировка');
    });
  }

  function startBoxingSparring(opponentId: BoxingOpponentId): void {
    const opponent = getBoxingOpponentById(opponentId);
    if (!opponent) return;
    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'sparring');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Бокс недоступен', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Бокс', timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const gym = boxingGyms[0];
      const location = getLocationById(gym.locationId);
      const trainer = getBoxingTrainerById(currentState.player.boxing.selectedTrainerId);
      return applyBoxingOperationState(currentState, applyBoxingSparring({
        player: currentState.player,
        time: currentState.time,
        gym,
        opponent,
        trainer,
        schedule: location?.openingHours
      }), 'Спарринг');
    });
  }

  function enterBoxingTournament(tournamentId: BoxingTournamentId): void {
    const tournament = getBoxingTournamentById(tournamentId);
    if (!tournament) return;
    setGameState((currentState) => {
      const medicalFailure = getMedicalActivityFailure(currentState.world.medical, 'tournament');
      if (medicalFailure) {
        const logEntry = createLifeLogEntry(currentState, 'Бокс недоступен', medicalFailure);
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Бокс', timeDeltaMinutes: 0, messages: [medicalFailure] },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }
      const gym = boxingGyms[0];
      const location = getLocationById(gym.locationId);
      const opponents = tournament.opponentIds
        .map((opponentId) => getBoxingOpponentById(opponentId))
        .filter((opponent): opponent is NonNullable<typeof opponent> => Boolean(opponent));
      return applyBoxingOperationState(currentState, applyBoxingTournament({
        player: currentState.player,
        time: currentState.time,
        gym,
        tournament,
        opponents,
        schedule: location?.openingHours
      }), 'Турнир');
    });
  }

  return {
    buyBoxingMembership,
    chooseBoxingTrainer,
    performBoxingTraining,
    startBoxingSparring,
    enterBoxingTournament
  };
}
