export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export type RiskProfile = {
  level: RiskLevel;
  score: number;
};
