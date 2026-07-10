import type {
  BoxingGymId,
  BoxingOpponentId,
  BoxingTournamentId,
  BoxingTrainerId,
  BoxingTrainingId,
  LocationId
} from './ids';
import type { NeedsState } from './needs';

export type BoxingStatId = 'technique' | 'speed' | 'power' | 'defense' | 'stamina';
export type BoxingStats = Record<BoxingStatId, number>;
export type BoxingFightResult = 'win' | 'loss' | 'draw';
export type BoxingFightKind = 'sparring' | 'tournament';
export type BoxingStyle = 'outboxer' | 'pressure' | 'counterpuncher' | 'slugger' | 'balanced';

export type BoxingRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type BoxingMembership = {
  gymId: BoxingGymId;
  expiresOnDay: number;
};

export type BoxingFightHistoryEntry = {
  id: string;
  day: number;
  kind: BoxingFightKind;
  opponentId: BoxingOpponentId;
  opponentName: string;
  result: BoxingFightResult;
  method: string;
  ratingDelta: number;
  summary: string[];
  tournamentId?: BoxingTournamentId;
  tournamentName?: string;
};

export type BoxingProfile = {
  level: number;
  experience: number;
  stats: BoxingStats;
  form: number;
  fatigue: number;
  rating: number;
  officialRecord: BoxingRecord;
  sparringRecord: BoxingRecord;
  sparringCount: number;
  membership?: BoxingMembership;
  selectedTrainerId?: BoxingTrainerId;
  fightHistory: BoxingFightHistoryEntry[];
  tournamentWins: number;
};

export type BoxingGym = {
  id: BoxingGymId;
  name: string;
  locationId: LocationId;
  monthlyPrice: number;
  equipmentMultiplier: number;
  trainerIds: BoxingTrainerId[];
};

export type BoxingTrainer = {
  id: BoxingTrainerId;
  name: string;
  specialty: BoxingStatId | 'balanced';
  sessionPrice: number;
  experienceMultiplier: number;
  specialtyMultiplier: number;
};

export type BoxingTraining = {
  id: BoxingTrainingId;
  name: string;
  durationMinutes: number;
  experienceReward: number;
  fatigueDelta: number;
  needsDelta: Partial<NeedsState>;
  statRewards: Partial<BoxingStats>;
  minEnergy: number;
};

export type BoxingOpponent = {
  id: BoxingOpponentId;
  name: string;
  age: number;
  club: string;
  weightKg: number;
  rating: number;
  style: BoxingStyle;
  stats: BoxingStats;
};

export type BoxingTournament = {
  id: BoxingTournamentId;
  name: string;
  locationId: LocationId;
  entryFee: number;
  minSparrings: number;
  minTechnique: number;
  minStamina: number;
  minForm: number;
  maxFatigue: number;
  opponentIds: BoxingOpponentId[];
};

export type BoxingLevelProgress = {
  level: number;
  experience: number;
  currentLevelExperience: number;
  nextLevelExperience: number;
  experienceRemaining: number;
  progressPercent: number;
  isMaxLevel: boolean;
};
