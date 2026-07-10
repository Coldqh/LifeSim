export type TravelModeId = 'walk' | 'bus' | 'metro' | 'taxi';

export type TravelMode = {
  id: TravelModeId;
  name: string;
  description: string;
};
