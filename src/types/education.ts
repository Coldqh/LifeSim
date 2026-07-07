import type { EducationProgramId } from './ids';

export type EducationProgram = {
  id: EducationProgramId;
  title: string;
  durationDays: number;
  price: number;
};
