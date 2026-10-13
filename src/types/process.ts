export type ProcessCategory = 'CPU-bound' | 'I/O-bound' | 'Interactive' | 'Background';

export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number; // Lower numerical value = higher priority
  powerDemand: number; // Watts, estimated active CPU power demand
  deadline?: number; // Optional deadline in simulation time units
  category: ProcessCategory;
}

export interface ProcessExecutionState extends Process {
  remainingTime: number;
  waitingTime: number;
  responseTime?: number;
  completionTime?: number;
  startTime?: number;
  firstStartTime?: number;
}
