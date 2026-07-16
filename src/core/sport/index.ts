import { applyMoneyDelta, canAfford } from '../economy';
import { applyActivityNeedsDelta, getNeedsRequirementFailure, getNeedWarning } from '../needs';
import { getScheduleActivityFailure } from '../schedule';
import { addMinutes } from '../time';
import type {
  BoxingFightHistoryEntry,
  BoxingFightResult,
  BoxingGym,
  BoxingLevelProgress,
  BoxingOpponent,
  BoxingProfile,
  BoxingRecord,
  BoxingStatId,
  BoxingTournament,
  BoxingTrainer,
  BoxingTraining
} from '../../types/boxing';
import type { NeedsState } from '../../types/needs';
import type { Player } from '../../types/player';
import type { WeeklySchedule } from '../../types/schedule';
import type { GameTime } from '../../types/time';

const BOXING_MAX_LEVEL = 5;
const LEVEL_THRESHOLDS = [0, 80, 200, 380, 620] as const;
const STAT_MIN = 1;
const STAT_MAX = 100;

export type BoxingOperationResult = {
  ok: boolean;
  actionName: string;
  timeDeltaMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
  messages: string[];
};

export type BoxingOperationOutput = {
  player: Player;
  time: GameTime;
  result: BoxingOperationResult;
};

export type BoxingRecoveryProfile = 'active' | 'resting' | 'sleeping';

export function createInitialBoxingProfile(): BoxingProfile {
  return {
    level: 1,
    experience: 0,
    stats: {
      technique: 20,
      speed: 21,
      power: 18,
      defense: 18,
      stamina: 20
    },
    form: 70,
    fatigue: 0,
    rating: 1000,
    officialRecord: { wins: 0, losses: 0, draws: 0 },
    sparringRecord: { wins: 0, losses: 0, draws: 0 },
    sparringCount: 0,
    fightHistory: [],
    tournamentWins: 0
  };
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function getLevelFromExperience(experience: number): number {
  let level = 1;
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (experience >= threshold) level = index + 1;
  });
  return Math.min(BOXING_MAX_LEVEL, level);
}

export function getBoxingLevelProgress(profile: BoxingProfile): BoxingLevelProgress {
  const level = getLevelFromExperience(profile.experience);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold;
  const isMaxLevel = level >= BOXING_MAX_LEVEL;
  const required = Math.max(1, nextThreshold - currentThreshold);
  const current = Math.max(0, profile.experience - currentThreshold);

  return {
    level,
    experience: profile.experience,
    currentLevelExperience: isMaxLevel ? 0 : current,
    nextLevelExperience: isMaxLevel ? 0 : required,
    experienceRemaining: isMaxLevel ? 0 : Math.max(0, nextThreshold - profile.experience),
    progressPercent: isMaxLevel ? 100 : Math.min(100, Math.round((current / required) * 100)),
    isMaxLevel
  };
}

export function hasActiveBoxingMembership(profile: BoxingProfile, gym: BoxingGym, day: number): boolean {
  return profile.membership?.gymId === gym.id && profile.membership.expiresOnDay >= day;
}

export function getBoxingFatigueLabel(fatigue: number): string {
  if (fatigue >= 81) return 'Перегружен';
  if (fatigue >= 61) return 'Устал';
  if (fatigue >= 31) return 'Рабочая нагрузка';
  return 'Свежий';
}

export function applyBoxingRecovery(
  profile: BoxingProfile,
  elapsedMinutes: number,
  recoveryProfile: BoxingRecoveryProfile
): BoxingProfile {
  if (elapsedMinutes <= 0) return profile;
  const hours = elapsedMinutes / 60;
  const fatigueRecoveryPerHour = recoveryProfile === 'sleeping' ? 4 : recoveryProfile === 'resting' ? 2 : 0.35;
  const formRecoveryPerHour = recoveryProfile === 'sleeping' ? 1.2 : recoveryProfile === 'resting' ? 0.6 : 0;

  return {
    ...profile,
    fatigue: clamp(profile.fatigue - fatigueRecoveryPerHour * hours),
    form: clamp(profile.form + formRecoveryPerHour * hours)
  };
}

export function getBoxingMembershipFailure(
  player: Player,
  time: GameTime,
  gym: BoxingGym,
  schedule?: WeeklySchedule
): string | undefined {
  if (player.locationId !== gym.locationId) return 'Нужно находиться в боксёрском зале.';
  const scheduleFailure = getScheduleActivityFailure(schedule, time, 10, 'Оформление абонемента');
  if (scheduleFailure) return scheduleFailure;
  if (!canAfford(player.money, gym.monthlyPrice)) return `Деньги: ${player.money}/${gym.monthlyPrice} ₽.`;
  return undefined;
}

export function applyBoxingMembership(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  schedule?: WeeklySchedule;
}): BoxingOperationOutput {
  const { player, time, gym, schedule } = input;
  const failure = getBoxingMembershipFailure(player, time, gym, schedule);
  if (failure) return failed(player, time, 'Абонемент', failure);

  const currentExpiry = player.boxing.membership?.gymId === gym.id
    ? Math.max(time.day, player.boxing.membership.expiresOnDay)
    : time.day;
  const nextTime = addMinutes(time, 10);
  const nextProfile: BoxingProfile = {
    ...player.boxing,
    membership: { gymId: gym.id, expiresOnDay: currentExpiry + 30 },
    selectedTrainerId: player.boxing.membership?.gymId === gym.id ? player.boxing.selectedTrainerId : undefined
  };

  return {
    player: { ...player, money: applyMoneyDelta(player.money, -gym.monthlyPrice), boxing: nextProfile },
    time: nextTime,
    result: {
      ok: true,
      actionName: 'Абонемент',
      timeDeltaMinutes: 10,
      moneyDelta: -gym.monthlyPrice,
      messages: [`Абонемент оформлен до дня ${currentExpiry + 30}.`]
    }
  };
}

export function getBoxingTrainerSelectionFailure(player: Player, time: GameTime, gym: BoxingGym, trainer: BoxingTrainer): string | undefined {
  if (player.locationId !== gym.locationId) return 'Нужно находиться в боксёрском зале.';
  if (!hasActiveBoxingMembership(player.boxing, gym, time.day)) return 'Нужен действующий абонемент.';
  if (!gym.trainerIds.includes(trainer.id)) return 'Этот тренер не работает в выбранном зале.';
  return undefined;
}

export function selectBoxingTrainer(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  trainer: BoxingTrainer;
}): BoxingOperationOutput {
  const { player, time, gym, trainer } = input;
  const failure = getBoxingTrainerSelectionFailure(player, time, gym, trainer);
  if (failure) return failed(player, time, 'Выбор тренера', failure);
  return {
    player: { ...player, boxing: { ...player.boxing, selectedTrainerId: trainer.id } },
    time,
    result: {
      ok: true,
      actionName: 'Тренер',
      timeDeltaMinutes: 0,
      messages: [`Текущий тренер: ${trainer.name}. Цена занятия — ${trainer.sessionPrice} ₽.`]
    }
  };
}

export function getBoxingTrainingFailure(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  training: BoxingTraining;
  trainer?: BoxingTrainer;
  schedule?: WeeklySchedule;
}): string | undefined {
  const { player, time, gym, training, trainer, schedule } = input;
  if (player.locationId !== gym.locationId) return 'Нужно находиться в боксёрском зале.';
  if (!hasActiveBoxingMembership(player.boxing, gym, time.day)) return 'Нужен действующий абонемент.';
  if (!trainer || player.boxing.selectedTrainerId !== trainer.id) return 'Сначала выбери тренера.';
  const scheduleFailure = getScheduleActivityFailure(schedule, time, training.durationMinutes, 'Тренировка');
  if (scheduleFailure) return scheduleFailure;
  if (!canAfford(player.money, trainer.sessionPrice)) return `Деньги: ${player.money}/${trainer.sessionPrice} ₽.`;
  if (player.boxing.fatigue >= 86) return 'Спортивная усталость слишком высокая. Нужен отдых.';
  return getNeedsRequirementFailure(player.needs, {
    minEnergy: training.minEnergy,
    minHealth: 30,
    minHunger: 8,
    minThirst: 8
  });
}

function getFatigueEfficiency(fatigue: number): number {
  if (fatigue >= 81) return 0.55;
  if (fatigue >= 61) return 0.75;
  if (fatigue >= 31) return 0.9;
  return 1;
}

function applyTrainingStats(
  profile: BoxingProfile,
  training: BoxingTraining,
  trainer: BoxingTrainer,
  gym: BoxingGym
): BoxingProfile {
  const fatigueEfficiency = getFatigueEfficiency(profile.fatigue);
  const statMultiplier = fatigueEfficiency * gym.equipmentMultiplier;
  const nextStats = { ...profile.stats };

  (Object.entries(training.statRewards) as Array<[BoxingStatId, number]>).forEach(([statId, reward]) => {
    const specialtyBonus = trainer.specialty === statId ? trainer.specialtyMultiplier : 1;
    nextStats[statId] = clamp(nextStats[statId] + reward * statMultiplier * specialtyBonus, STAT_MIN, STAT_MAX);
  });

  const gainedExperience = Math.max(1, Math.round(training.experienceReward * trainer.experienceMultiplier * fatigueEfficiency));
  const nextExperience = profile.experience + gainedExperience;

  return {
    ...profile,
    experience: nextExperience,
    level: getLevelFromExperience(nextExperience),
    stats: nextStats,
    fatigue: clamp(profile.fatigue + training.fatigueDelta),
    form: clamp(profile.form + (profile.fatigue < 61 ? 2 : 0))
  };
}

export function applyBoxingTraining(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  training: BoxingTraining;
  trainer?: BoxingTrainer;
  schedule?: WeeklySchedule;
}): BoxingOperationOutput {
  const { player, time, gym, training, trainer, schedule } = input;
  const failure = getBoxingTrainingFailure(input);
  if (failure || !trainer) return failed(player, time, training.name, failure ?? 'Тренер не выбран.');

  const needsApplied = applyActivityNeedsDelta(player.needs, training.needsDelta, {
    scaleEnergyCost: true,
    scaleEnergyRecovery: false
  });
  const nextProfile = applyTrainingStats(player.boxing, training, trainer, gym);
  const nextTime = addMinutes(time, training.durationMinutes);
  const levelUp = nextProfile.level > player.boxing.level;
  const warning = getNeedWarning(needsApplied.needs);
  const messages = [
    `${training.name}: боксёрский опыт +${nextProfile.experience - player.boxing.experience}.`,
    levelUp ? `Уровень бокса повышен до ${nextProfile.level}.` : undefined,
    warning
  ].filter((message): message is string => Boolean(message));

  return {
    player: {
      ...player,
      money: applyMoneyDelta(player.money, -trainer.sessionPrice),
      needs: needsApplied.needs,
      boxing: nextProfile
    },
    time: nextTime,
    result: {
      ok: true,
      actionName: training.name,
      timeDeltaMinutes: training.durationMinutes,
      moneyDelta: trainer.sessionPrice > 0 ? -trainer.sessionPrice : 0,
      needsDelta: needsApplied.delta,
      messages
    }
  };
}

function scoreStats(stats: BoxingProfile['stats']): number {
  return stats.technique * 0.25 + stats.speed * 0.2 + stats.power * 0.15 + stats.defense * 0.2 + stats.stamina * 0.2;
}

function opponentScore(opponent: BoxingOpponent): number {
  return scoreStats(opponent.stats) + (opponent.rating - 1000) / 50;
}

function deterministicSwing(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  return (Math.abs(hash) % 13) - 6;
}

function simulateBout(profile: BoxingProfile, opponent: BoxingOpponent, seed: string): {
  result: BoxingFightResult;
  method: string;
  summary: string[];
} {
  const playerScore = scoreStats(profile.stats)
    + profile.level * 1.5
    + profile.form * 0.08
    - profile.fatigue * 0.12
    + deterministicSwing(seed);
  const rivalScore = opponentScore(opponent);
  const difference = playerScore - rivalScore;
  const result: BoxingFightResult = difference > 2.5 ? 'win' : difference < -2.5 ? 'loss' : 'draw';
  const method = result === 'draw' ? 'ничья по решению судей' : 'решение судей';

  const summary = result === 'win'
    ? ['Раунд 1: ты забрал центр и работал первым номером.', 'Раунд 2: точные атаки принесли преимущество.', 'Раунд 3: ты удержал темп до гонга.']
    : result === 'loss'
      ? ['Раунд 1: соперник навязал свой темп.', 'Раунд 2: защита пропустила несколько чистых атак.', 'Раунд 3: усталость не позволила переломить бой.']
      : ['Раунд 1: равный обмен без явного лидера.', 'Раунд 2: ты лучше двигался, соперник отвечал силовыми.', 'Раунд 3: судьи не увидели преимущества.'];

  return { result, method, summary };
}

function updateRecord(record: BoxingRecord, result: BoxingFightResult): BoxingRecord {
  if (result === 'win') return { ...record, wins: record.wins + 1 };
  if (result === 'loss') return { ...record, losses: record.losses + 1 };
  return { ...record, draws: record.draws + 1 };
}

function ratingDeltaFor(result: BoxingFightResult, opponentRating: number, playerRating: number, tournament = false): number {
  if (result === 'win') return (opponentRating >= playerRating ? 18 : 12) + (tournament ? 8 : 0);
  if (result === 'loss') return tournament ? -10 : -8;
  return 3;
}

function createFightHistoryEntry(input: {
  time: GameTime;
  kind: 'sparring' | 'tournament';
  opponent: BoxingOpponent;
  result: BoxingFightResult;
  method: string;
  summary: string[];
  ratingDelta: number;
  tournament?: BoxingTournament;
}): BoxingFightHistoryEntry {
  return {
    id: `boxing_${input.time.day}_${input.opponent.id}_${input.kind}_${input.time.hour}_${input.time.minute}`,
    day: input.time.day,
    kind: input.kind,
    opponentId: input.opponent.id,
    opponentName: input.opponent.name,
    result: input.result,
    method: input.method,
    ratingDelta: input.ratingDelta,
    summary: input.summary,
    tournamentId: input.tournament?.id,
    tournamentName: input.tournament?.name
  };
}

export function getBoxingSparringFailure(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  opponent: BoxingOpponent;
  trainer?: BoxingTrainer;
  schedule?: WeeklySchedule;
}): string | undefined {
  const { player, time, gym, trainer, schedule } = input;
  if (player.locationId !== gym.locationId) return 'Нужно находиться в боксёрском зале.';
  if (!hasActiveBoxingMembership(player.boxing, gym, time.day)) return 'Нужен действующий абонемент.';
  if (!trainer) return 'Сначала выбери тренера.';
  const scheduleFailure = getScheduleActivityFailure(schedule, time, 60, 'Спарринг');
  if (scheduleFailure) return scheduleFailure;
  if (player.boxing.fatigue > 70) return 'Для спарринга усталость должна быть не выше 70.';
  if (player.boxing.form < 45) return 'Для спарринга форма должна быть не ниже 45.';
  return getNeedsRequirementFailure(player.needs, { minEnergy: 25, minHealth: 35, minHunger: 10, minThirst: 10 });
}

export function applyBoxingSparring(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  opponent: BoxingOpponent;
  trainer?: BoxingTrainer;
  schedule?: WeeklySchedule;
}): BoxingOperationOutput {
  const { player, time, gym, opponent } = input;
  const failure = getBoxingSparringFailure(input);
  if (failure) return failed(player, time, `Спарринг: ${opponent.name}`, failure);

  const bout = simulateBout(player.boxing, opponent, `${time.day}:${time.hour}:${opponent.id}:sparring`);
  const ratingDelta = ratingDeltaFor(bout.result, opponent.rating, player.boxing.rating);
  const experienceGain = bout.result === 'win' ? 24 : bout.result === 'draw' ? 18 : 14;
  const needsApplied = applyActivityNeedsDelta(player.needs, { energy: -18, hunger: -5, thirst: -8, mood: bout.result === 'win' ? 8 : 2 }, { scaleEnergyCost: true });
  const nextExperience = player.boxing.experience + experienceGain;
  const historyEntry = createFightHistoryEntry({ time, kind: 'sparring', opponent, ratingDelta, ...bout });
  const nextProfile: BoxingProfile = {
    ...player.boxing,
    level: getLevelFromExperience(nextExperience),
    experience: nextExperience,
    stats: {
      ...player.boxing.stats,
      technique: clamp(player.boxing.stats.technique + 1, STAT_MIN, STAT_MAX),
      defense: clamp(player.boxing.stats.defense + 1, STAT_MIN, STAT_MAX),
      stamina: clamp(player.boxing.stats.stamina + 1, STAT_MIN, STAT_MAX)
    },
    form: clamp(player.boxing.form - 4),
    fatigue: clamp(player.boxing.fatigue + 18),
    rating: Math.max(700, player.boxing.rating + ratingDelta),
    sparringRecord: updateRecord(player.boxing.sparringRecord, bout.result),
    sparringCount: player.boxing.sparringCount + 1,
    fightHistory: [historyEntry, ...player.boxing.fightHistory].slice(0, 20)
  };
  const resultLabel = bout.result === 'win' ? 'Победа' : bout.result === 'loss' ? 'Поражение' : 'Ничья';

  return {
    player: { ...player, needs: needsApplied.needs, boxing: nextProfile },
    time: addMinutes(time, 60),
    result: {
      ok: true,
      actionName: `Спарринг: ${opponent.name}`,
      timeDeltaMinutes: 60,
      needsDelta: needsApplied.delta,
      messages: [`${resultLabel}: ${opponent.name}. Рейтинг ${ratingDelta >= 0 ? '+' : ''}${ratingDelta}.`, ...bout.summary]
    }
  };
}

export function getBoxingTournamentFailure(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  tournament: BoxingTournament;
  schedule?: WeeklySchedule;
}): string | undefined {
  const { player, time, gym, tournament, schedule } = input;
  if (player.locationId !== tournament.locationId || player.locationId !== gym.locationId) return 'Нужно находиться в месте проведения турнира.';
  if (!hasActiveBoxingMembership(player.boxing, gym, time.day)) return 'Нужен действующий абонемент.';
  const scheduleFailure = getScheduleActivityFailure(schedule, time, 210, 'Турнир');
  if (scheduleFailure) return scheduleFailure;
  if (!canAfford(player.money, tournament.entryFee)) return `Деньги: ${player.money}/${tournament.entryFee} ₽.`;
  if (player.boxing.sparringCount < tournament.minSparrings) return `Спарринги: ${player.boxing.sparringCount}/${tournament.minSparrings}.`;
  if (player.boxing.stats.technique < tournament.minTechnique) return `Техника: ${player.boxing.stats.technique}/${tournament.minTechnique}.`;
  if (player.boxing.stats.stamina < tournament.minStamina) return `Выносливость: ${player.boxing.stats.stamina}/${tournament.minStamina}.`;
  if (player.boxing.form < tournament.minForm) return `Форма: ${player.boxing.form}/${tournament.minForm}.`;
  if (player.boxing.fatigue > tournament.maxFatigue) return `Усталость: ${player.boxing.fatigue}/${tournament.maxFatigue} максимум.`;
  return getNeedsRequirementFailure(player.needs, { minEnergy: 40, minHealth: 50, minHunger: 15, minThirst: 15 });
}

export function applyBoxingTournament(input: {
  player: Player;
  time: GameTime;
  gym: BoxingGym;
  tournament: BoxingTournament;
  opponents: BoxingOpponent[];
  schedule?: WeeklySchedule;
}): BoxingOperationOutput {
  const { player, time, gym, tournament, opponents } = input;
  const failure = getBoxingTournamentFailure(input);
  if (failure) return failed(player, time, tournament.name, failure);
  const semifinalOpponent = opponents[0];
  const finalOpponent = opponents[1] ?? opponents[0];
  if (!semifinalOpponent || !finalOpponent) return failed(player, time, tournament.name, 'Сетка турнира не собрана.');

  const semifinal = simulateBout(player.boxing, semifinalOpponent, `${time.day}:${semifinalOpponent.id}:semi`);
  const semifinalRating = ratingDeltaFor(semifinal.result, semifinalOpponent.rating, player.boxing.rating, true);
  const semifinalEntry = createFightHistoryEntry({ time, kind: 'tournament', opponent: semifinalOpponent, ratingDelta: semifinalRating, tournament, ...semifinal });
  const reachedFinal = semifinal.result === 'win';
  const finalProfile = reachedFinal ? { ...player.boxing, fatigue: clamp(player.boxing.fatigue + 18), form: clamp(player.boxing.form - 6) } : player.boxing;
  const final = reachedFinal ? simulateBout(finalProfile, finalOpponent, `${time.day}:${finalOpponent.id}:final`) : undefined;
  const finalRating = final ? ratingDeltaFor(final.result, finalOpponent.rating, player.boxing.rating + semifinalRating, true) : 0;
  const finalEntry = final
    ? createFightHistoryEntry({ time, kind: 'tournament', opponent: finalOpponent, ratingDelta: finalRating, tournament, ...final })
    : undefined;
  const wonTournament = reachedFinal && final?.result === 'win';
  let officialRecord = updateRecord(player.boxing.officialRecord, semifinal.result);
  if (final) officialRecord = updateRecord(officialRecord, final.result);
  const experienceGain = reachedFinal ? (wonTournament ? 80 : 55) : 30;
  const nextExperience = player.boxing.experience + experienceGain;
  const needsApplied = applyActivityNeedsDelta(player.needs, {
    energy: reachedFinal ? -32 : -22,
    hunger: reachedFinal ? -10 : -7,
    thirst: reachedFinal ? -15 : -10,
    mood: wonTournament ? 15 : reachedFinal ? 5 : -3
  }, { scaleEnergyCost: true });
  const history = [finalEntry, semifinalEntry, ...player.boxing.fightHistory]
    .filter((entry): entry is BoxingFightHistoryEntry => Boolean(entry))
    .slice(0, 20);
  const nextProfile: BoxingProfile = {
    ...player.boxing,
    level: getLevelFromExperience(nextExperience),
    experience: nextExperience,
    officialRecord,
    rating: Math.max(700, player.boxing.rating + semifinalRating + finalRating),
    fatigue: clamp(player.boxing.fatigue + (reachedFinal ? 35 : 22)),
    form: clamp(player.boxing.form - (reachedFinal ? 12 : 7)),
    tournamentWins: player.boxing.tournamentWins + (wonTournament ? 1 : 0),
    fightHistory: history
  };
  const messages = [
    `Полуфинал: ${semifinal.result === 'win' ? 'победа' : semifinal.result === 'loss' ? 'поражение' : 'ничья'} против ${semifinalOpponent.name}.`,
    final ? `Финал: ${final.result === 'win' ? 'победа' : final.result === 'loss' ? 'поражение' : 'ничья'} против ${finalOpponent.name}.` : 'Выбывание в полуфинале.',
    wonTournament ? `Ты выиграл турнир «${tournament.name}».` : 'Турнир завершён.'
  ];

  return {
    player: {
      ...player,
      money: applyMoneyDelta(player.money, -tournament.entryFee),
      needs: needsApplied.needs,
      boxing: nextProfile
    },
    time: addMinutes(time, reachedFinal ? 210 : 120),
    result: {
      ok: true,
      actionName: tournament.name,
      timeDeltaMinutes: reachedFinal ? 210 : 120,
      moneyDelta: -tournament.entryFee,
      needsDelta: needsApplied.delta,
      messages
    }
  };
}

function failed(player: Player, time: GameTime, actionName: string, message: string): BoxingOperationOutput {
  return {
    player,
    time,
    result: { ok: false, actionName, timeDeltaMinutes: 0, messages: [message] }
  };
}

export type { League, Sport } from '../../types/sport';
export type {
  BoxingFightHistoryEntry,
  BoxingGym,
  BoxingOpponent,
  BoxingProfile,
  BoxingTournament,
  BoxingTrainer,
  BoxingTraining
} from '../../types/boxing';

export function applyBoxingStoryProgress(input: {
  profile: BoxingProfile;
  stat: BoxingStatId;
  statDelta: number;
  formDelta?: number;
  fatigueDelta?: number;
}): { profile: BoxingProfile; message?: string } {
  const statGain = Math.max(0, input.statDelta);
  const currentStat = input.profile.stats[input.stat];
  const nextStat = clamp(currentStat + statGain, STAT_MIN, STAT_MAX);
  const actualGain = nextStat - currentStat;
  const nextProfile: BoxingProfile = {
    ...input.profile,
    stats: { ...input.profile.stats, [input.stat]: nextStat },
    form: clamp(input.profile.form + (input.formDelta ?? 0)),
    fatigue: clamp(input.profile.fatigue + (input.fatigueDelta ?? 0))
  };
  return {
    profile: nextProfile,
    message: actualGain > 0 ? `Бокс: ${input.stat} +${actualGain}.` : undefined
  };
}
