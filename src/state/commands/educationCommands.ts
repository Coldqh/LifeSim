import { applyEducationProgram } from '../../core/education';
import { getLocationById } from '../../core/location';
import { getEducationProgramById } from '../../data/cities/contentSelectors';
import { getSkillById } from '../../data/skills/basicSkills';
import type { EducationProgramId } from '../../types/ids';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createEducationCommands(setGameState: GameStateSetter) {
  function studyProgram(programId: EducationProgramId): void {
    const program = getEducationProgramById(programId);
    if (!program) return;

    setGameState((currentState) => {
      const applied = applyEducationProgram({
        player: currentState.player,
        time: currentState.time,
        program,
        currentLocationType: getLocationById(currentState.player.locationId)?.type
      });

      if (!applied.result.ok) {
        const logEntry = createLifeLogEntry(currentState, 'Обучение недоступно', applied.result.messages.join(' '));
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: program.title,
            timeDeltaMinutes: 0,
            messages: applied.result.messages
          },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const elapsedApplied = applyElapsedTimeConsequences(currentState, applied.player, applied.time, 'active', { actionTitle: program.title });
      const skill = getSkillById(program.skillId);
      const levelMessage = applied.result.skillProgress?.leveledUp
        ? `Навык «${skill?.name ?? 'Навык'}» повышен до уровня ${applied.result.skillProgress.nextLevel}.`
        : undefined;
      const resultMessages = [...applied.result.messages, levelMessage, ...elapsedApplied.messages]
        .filter((message): message is string => Boolean(message));
      const logEntry = createLifeLogEntry({ time: applied.time }, 'Обучение', resultMessages.join(' '));
      const levelEntries = levelMessage
        ? [createLifeLogEntry({ time: applied.time }, 'Новый уровень навыка', levelMessage)]
        : [];

      return {
        ...currentState,
        player: elapsedApplied.player,
        world: elapsedApplied.world,
        time: applied.time,
        lastResult: {
          ok: true,
          actionName: program.title,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages: resultMessages
        },
        lifeLog: mergeLifeLog([logEntry, ...levelEntries, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    studyProgram
  };
}
