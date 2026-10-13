import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';
import type { AlgorithmType, SimulationResult, BAASOperatingMode, BAASThresholds } from '../types/scheduling';
import { runSimulation } from '../algorithms';

export interface ComparisonRecommendation {
  category: 'Lowest Energy' | 'Lowest Waiting Time' | 'Lowest Turnaround Time' | 'Best Balanced Performance';
  algorithm: AlgorithmType;
  algorithmName: string;
  metricValue: string;
  explanation: string;
}

export interface ComparisonReport {
  results: Record<AlgorithmType, SimulationResult>;
  recommendations: ComparisonRecommendation[];
  comparisonTableData: Array<{
    algorithm: AlgorithmType;
    algorithmName: string;
    avgWaitingTime: number;
    avgTurnaroundTime: number;
    avgResponseTime: number;
    cpuUtilization: number;
    throughput: number;
    makespan: number;
    totalEnergyWh: number;
    finalBatteryPercentage: number;
    isExhausted: boolean;
  }>;
}

export function runAllComparisons(
  processes: Process[],
  batteryConfig: BatteryConfig,
  timeQuantum: number = 2,
  baasMode: BAASOperatingMode = 'Balanced',
  thresholds?: BAASThresholds,
  workloadName?: string
): ComparisonReport {
  const algorithms: AlgorithmType[] = ['FCFS', 'SJF', 'RR', 'Priority', 'BAAS'];
  const results = {} as Record<AlgorithmType, SimulationResult>;

  for (const algo of algorithms) {
    results[algo] = runSimulation({
      algorithm: algo,
      processes,
      batteryConfig,
      operatingMode: baasMode,
      timeQuantum,
      thresholds,
      workloadName,
    });
  }

  const comparisonTableData = algorithms.map((algo) => {
    const res = results[algo];
    return {
      algorithm: algo,
      algorithmName: res.algorithmName,
      avgWaitingTime: res.aggregateMetrics.avgWaitingTime,
      avgTurnaroundTime: res.aggregateMetrics.avgTurnaroundTime,
      avgResponseTime: res.aggregateMetrics.avgResponseTime,
      cpuUtilization: res.aggregateMetrics.cpuUtilization,
      throughput: res.aggregateMetrics.throughput,
      makespan: res.aggregateMetrics.makespan,
      totalEnergyWh: res.aggregateMetrics.totalEnergyWh,
      finalBatteryPercentage: res.aggregateMetrics.finalBatteryPercentage,
      isExhausted: res.aggregateMetrics.isExhausted,
    };
  });

  // Calculate true objective recommendations dynamically
  const recommendations: ComparisonRecommendation[] = [];

  if (processes.length > 0) {
    // 1. Lowest Energy Consumption
    const sortedByEnergy = [...comparisonTableData].sort((a, b) => a.totalEnergyWh - b.totalEnergyWh);
    const lowestEnergy = sortedByEnergy[0];
    recommendations.push({
      category: 'Lowest Energy',
      algorithm: lowestEnergy.algorithm,
      algorithmName: lowestEnergy.algorithmName,
      metricValue: `${lowestEnergy.totalEnergyWh.toFixed(4)} Wh`,
      explanation: `${lowestEnergy.algorithmName} consumed the least electrical energy (${lowestEnergy.totalEnergyWh.toFixed(4)} Wh), maximizing battery longevity.`,
    });

    // 2. Lowest Waiting Time
    const sortedByWait = [...comparisonTableData].sort((a, b) => a.avgWaitingTime - b.avgWaitingTime);
    const lowestWait = sortedByWait[0];
    recommendations.push({
      category: 'Lowest Waiting Time',
      algorithm: lowestWait.algorithm,
      algorithmName: lowestWait.algorithmName,
      metricValue: `${lowestWait.avgWaitingTime.toFixed(2)} s`,
      explanation: `${lowestWait.algorithmName} achieved minimal ready-queue delay with an average waiting time of ${lowestWait.avgWaitingTime.toFixed(2)}s.`,
    });

    // 3. Lowest Turnaround Time
    const sortedByTat = [...comparisonTableData].sort((a, b) => a.avgTurnaroundTime - b.avgTurnaroundTime);
    const lowestTat = sortedByTat[0];
    recommendations.push({
      category: 'Lowest Turnaround Time',
      algorithm: lowestTat.algorithm,
      algorithmName: lowestTat.algorithmName,
      metricValue: `${lowestTat.avgTurnaroundTime.toFixed(2)} s`,
      explanation: `${lowestTat.algorithmName} processed jobs fastest from submission to completion (${lowestTat.avgTurnaroundTime.toFixed(2)}s average).`,
    });

    // 4. Best Balanced Performance (Energy-Delay Product trade-off)
    // Find min and max across all candidates
    const minWait = Math.min(...comparisonTableData.map((d) => d.avgWaitingTime));
    const maxWait = Math.max(...comparisonTableData.map((d) => d.avgWaitingTime));
    const waitRange = Math.max(0.001, maxWait - minWait);

    const minEnergy = Math.min(...comparisonTableData.map((d) => d.totalEnergyWh));
    const maxEnergy = Math.max(...comparisonTableData.map((d) => d.totalEnergyWh));
    const energyRange = Math.max(0.00001, maxEnergy - minEnergy);

    // Composite score (lower is better): 50% normalized energy + 50% normalized waiting time
    const rankedBalanced = comparisonTableData.map((item) => {
      const normE = (item.totalEnergyWh - minEnergy) / energyRange;
      const normW = (item.avgWaitingTime - minWait) / waitRange;
      const compositePenalty = 0.5 * normE + 0.5 * normW;
      return { ...item, compositePenalty };
    });

    rankedBalanced.sort((a, b) => a.compositePenalty - b.compositePenalty);
    const bestBalanced = rankedBalanced[0];

    recommendations.push({
      category: 'Best Balanced Performance',
      algorithm: bestBalanced.algorithm,
      algorithmName: bestBalanced.algorithmName,
      metricValue: `Score: ${(1 - bestBalanced.compositePenalty).toFixed(2)} / 1.00`,
      explanation: `${bestBalanced.algorithmName} provides the most optimal compromise between low power drain (${bestBalanced.totalEnergyWh.toFixed(4)} Wh) and system responsiveness (${bestBalanced.avgWaitingTime.toFixed(2)}s wait).`,
    });
  }

  return {
    results,
    recommendations,
    comparisonTableData,
  };
}
