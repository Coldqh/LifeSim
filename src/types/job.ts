import type { JobId } from './ids';

export type Job = {
  id: JobId;
  title: string;
  basePay: number;
};
