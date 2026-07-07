export type TravelModeId = 'walk' | 'metro' | 'taxi';

export type TravelMode = {
  id: TravelModeId;
  name: string;
  description: string;
};
