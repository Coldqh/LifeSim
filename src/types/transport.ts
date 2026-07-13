export type TravelModeId = 'walk' | 'bus' | 'metro' | 'taxi' | 'car';

export type TravelMode = {
  id: TravelModeId;
  name: string;
  description: string;
};
