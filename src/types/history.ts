import type { Process } from './process';
import type { SimulationResult } from './scheduling';

export interface SavedExperiment {
  id: string;
  name: string;
  timestamp: number;
  dateFormatted: string;
  workloadName: string;
  processes: Process[];
  result: SimulationResult;
  notes?: string;
}
