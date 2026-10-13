import type { BatteryConfig, EnergyDataPoint } from './battery';

export type AlgorithmType = 'FCFS' | 'SJF' | 'RR' | 'Priority' | 'BAAS';

export type BAASOperatingMode = 'Performance' | 'Balanced' | 'PowerSaving';

export interface BAASThresholds {
  highBatteryThreshold: number; // e.g. 60%
  lowBatteryThreshold: number; // e.g. 25%
}

export interface BAASWeights {
  priorityWeight: number;
  powerWeight: number;
  burstWeight: number;
  waitingWeight: number;
}

export interface GanttBlock {
  id: string;
  processId: string; // 'IDLE' if CPU is unallocated
  processName: string;
  startTime: number;
  endTime: number;
  duration: number;
  powerWatts: number;
  energyConsumedWh: number;
  color?: string;
  isPreempted?: boolean;
}

export type EventType =
  | 'ARRIVAL'
  | 'SCHEDULE'
  | 'EXECUTE'
  | 'PREEMPT'
  | 'IDLE'
  | 'COMPLETION'
  | 'BATTERY_ALERT'
  | 'EXHAUSTION';

export interface EventLog {
  id: string;
  time: number;
  type: EventType;
  processId?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ProcessScoreDetail {
  processId: string;
  processName: string;
  totalScore: number;
  normPriority: number;
  normPower: number;
  normBurst: number;
  normWait: number;
  currentWait: number;
  remainingBurst: number;
  powerDemand: number;
}

export interface BAASDecision {
  time: number;
  previousProcessId: string | null;
  selectedProcessId: string | null;
  batteryLevel: number;
  operatingMode: BAASOperatingMode;
  scores: ProcessScoreDetail[];
  explanation: string;
}

export interface ProcessMetrics {
  processId: string;
  processName: string;
  arrivalTime: number;
  burstTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  energyConsumedWh: number;
  completed: boolean;
}

export interface SimulationMetrics {
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  makespan: number;
  cpuUtilization: number;
  throughput: number;
  totalEnergyWh: number;
  finalBatteryPercentage: number;
  isExhausted: boolean;
  completedCount: number;
  totalProcesses: number;
}

export interface SimulationResult {
  algorithm: AlgorithmType;
  algorithmName: string;
  operatingMode?: BAASOperatingMode;
  timeQuantum?: number;
  ganttBlocks: GanttBlock[];
  eventLogs: EventLog[];
  decisions: BAASDecision[];
  processMetrics: ProcessMetrics[];
  aggregateMetrics: SimulationMetrics;
  energyDataPoints: EnergyDataPoint[];
  batteryExhausted: boolean;
  batteryExhaustionTime?: number;
  batteryConfig: BatteryConfig;
  workloadName?: string;
  executedAt: string;
}
