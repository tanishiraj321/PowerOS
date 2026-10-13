import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';
import type {
  AlgorithmType,
  BAASOperatingMode,
  BAASThresholds,
  SimulationResult,
} from '../types/scheduling';
import { runFCFS } from './fcfs';
import { runSJF } from './sjf';
import { runRoundRobin } from './roundRobin';
import { runPriority } from './priority';
import { runBAAS, DEFAULT_BAAS_THRESHOLDS } from './baas';
import { calculateMetrics } from '../engine/metricsCalculator';

export interface SimulationParams {
  algorithm: AlgorithmType;
  processes: Process[];
  batteryConfig: BatteryConfig;
  operatingMode?: BAASOperatingMode;
  timeQuantum?: number;
  thresholds?: BAASThresholds;
  workloadName?: string;
}

export const ALGORITHM_NAMES: Record<AlgorithmType, string> = {
  FCFS: 'First Come First Served (FCFS)',
  SJF: 'Shortest Job First (SJF)',
  RR: 'Round Robin (RR)',
  Priority: 'Priority Scheduling',
  BAAS: 'Battery-Aware Adaptive Scheduler (BAAS)',
};

export const ALGORITHM_DESCRIPTIONS: Record<AlgorithmType, string> = {
  FCFS: 'Classic non-preemptive queue scheduling. Processes execute strictly in order of arrival. Simple and predictable, but prone to high waiting times under long burst processes (convoy effect) with no energy awareness.',
  SJF: 'Non-preemptive optimal waiting time algorithm. Always selects the arrived job with the shortest remaining burst time. Minimizes average waiting time, but can starve long compute-heavy jobs and ignores power demand.',
  RR: 'Preemptive fair-share algorithm with fixed time slices. Ensures responsive interactive times and prevents starvation, but frequent context switches and indiscriminate scheduling can cause rapid battery discharge.',
  Priority: 'Non-preemptive prioritization based on static process criticality. Highest priority jobs run first. Does not take battery state into account and lower priority jobs may suffer starvation under continuous high-priority traffic.',
  BAAS: 'Proposed adaptive multi-objective scheduler. Dynamically weights process priority, energy demand, burst time, and waiting time (aging). Adapts to remaining battery levels and AC mains status to optimize energy-efficiency while strictly preventing starvation.',
};

export function runSimulation({
  algorithm,
  processes,
  batteryConfig,
  operatingMode = 'Balanced',
  timeQuantum = 2,
  thresholds = DEFAULT_BAAS_THRESHOLDS,
  workloadName = 'Custom Workload',
}: SimulationParams): SimulationResult {
  let executionResult: ReturnType<typeof runFCFS> & {
    decisions?: SimulationResult['decisions'];
  };

  switch (algorithm) {
    case 'FCFS':
      executionResult = runFCFS(processes, batteryConfig);
      break;
    case 'SJF':
      executionResult = runSJF(processes, batteryConfig);
      break;
    case 'RR':
      executionResult = runRoundRobin(processes, batteryConfig, timeQuantum);
      break;
    case 'Priority':
      executionResult = runPriority(processes, batteryConfig);
      break;
    case 'BAAS':
      executionResult = runBAAS(processes, batteryConfig, operatingMode, thresholds);
      break;
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const { processMetrics, aggregateMetrics } = calculateMetrics(
    processes,
    executionResult.ganttBlocks,
    executionResult.totalEnergyWh,
    executionResult.finalBatteryPercentage,
    executionResult.batteryExhausted,
    0
  );

  return {
    algorithm,
    algorithmName: ALGORITHM_NAMES[algorithm],
    operatingMode: algorithm === 'BAAS' ? operatingMode : undefined,
    timeQuantum: algorithm === 'RR' ? timeQuantum : undefined,
    ganttBlocks: executionResult.ganttBlocks,
    eventLogs: executionResult.eventLogs,
    decisions: executionResult.decisions || [],
    processMetrics,
    aggregateMetrics,
    energyDataPoints: executionResult.energyDataPoints,
    batteryExhausted: executionResult.batteryExhausted,
    batteryExhaustionTime: executionResult.batteryExhaustionTime,
    batteryConfig,
    workloadName,
    executedAt: new Date().toISOString(),
  };
}
