import type { Process } from '../types/process';
import type { GanttBlock, ProcessMetrics, SimulationMetrics } from '../types/scheduling';

export function calculateMetrics(
  processes: Process[],
  ganttBlocks: GanttBlock[],
  totalEnergyWh: number,
  finalBatteryPercentage: number,
  isExhausted: boolean,
  initialTime: number = 0
): { processMetrics: ProcessMetrics[]; aggregateMetrics: SimulationMetrics } {
  if (processes.length === 0) {
    return {
      processMetrics: [],
      aggregateMetrics: {
        avgWaitingTime: 0,
        avgTurnaroundTime: 0,
        avgResponseTime: 0,
        makespan: 0,
        cpuUtilization: 0,
        throughput: 0,
        totalEnergyWh: 0,
        finalBatteryPercentage,
        isExhausted,
        completedCount: 0,
        totalProcesses: 0,
      },
    };
  }

  // Find first start times, completion times, and total executed time for each process
  const firstStartTimeMap = new Map<string, number>();
  const lastEndTimeMap = new Map<string, number>();
  const executedTimeMap = new Map<string, number>();
  const energyByProcessMap = new Map<string, number>();

  let finalTime = initialTime;
  let totalCpuBusyTime = 0;

  for (const block of ganttBlocks) {
    if (block.endTime > finalTime) {
      finalTime = block.endTime;
    }

    if (block.processId !== 'IDLE') {
      totalCpuBusyTime += block.duration;

      if (!firstStartTimeMap.has(block.processId)) {
        firstStartTimeMap.set(block.processId, block.startTime);
      }
      lastEndTimeMap.set(block.processId, block.endTime);

      const currentExec = executedTimeMap.get(block.processId) || 0;
      executedTimeMap.set(block.processId, currentExec + block.duration);

      const currentEnergy = energyByProcessMap.get(block.processId) || 0;
      energyByProcessMap.set(block.processId, currentEnergy + block.energyConsumedWh);
    }
  }

  const makespan = Math.max(0, finalTime - initialTime);
  const processMetrics: ProcessMetrics[] = [];

  let completedCount = 0;
  let totalWaitingTime = 0;
  let totalTurnaroundTime = 0;
  let totalResponseTime = 0;

  for (const p of processes) {
    const executed = executedTimeMap.get(p.id) || 0;
    // Completed if executed time >= burst time (within floating precision tolerance)
    const completed = executed >= p.burstTime - 0.0001;
    const completionTime = completed ? (lastEndTimeMap.get(p.id) ?? p.arrivalTime) : (lastEndTimeMap.get(p.id) ?? 0);
    const firstStart = firstStartTimeMap.get(p.id);

    const turnaroundTime = completed ? Math.max(0, completionTime - p.arrivalTime) : 0;
    const waitingTime = completed ? Math.max(0, turnaroundTime - p.burstTime) : 0;
    const responseTime = firstStart !== undefined ? Math.max(0, firstStart - p.arrivalTime) : 0;
    const energyConsumedWh = energyByProcessMap.get(p.id) || 0;

    if (completed) {
      completedCount++;
      totalWaitingTime += waitingTime;
      totalTurnaroundTime += turnaroundTime;
      totalResponseTime += responseTime;
    }

    processMetrics.push({
      processId: p.id,
      processName: p.name,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
      energyConsumedWh,
      completed,
    });
  }

  // Denominator for averages: completed processes count, or total if all finished
  const divisor = completedCount > 0 ? completedCount : processes.length;
  const avgWaitingTime = totalWaitingTime / divisor;
  const avgTurnaroundTime = totalTurnaroundTime / divisor;
  const avgResponseTime = totalResponseTime / divisor;

  const cpuUtilization = makespan > 0 ? Math.min(100, Math.max(0, (totalCpuBusyTime / makespan) * 100)) : 0;
  const throughput = makespan > 0 ? completedCount / makespan : 0;

  return {
    processMetrics,
    aggregateMetrics: {
      avgWaitingTime,
      avgTurnaroundTime,
      avgResponseTime,
      makespan,
      cpuUtilization,
      throughput,
      totalEnergyWh,
      finalBatteryPercentage,
      isExhausted,
      completedCount,
      totalProcesses: processes.length,
    },
  };
}
