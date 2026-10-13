import type { Process, ProcessExecutionState } from '../types/process';
import type { BatteryConfig, EnergyDataPoint } from '../types/battery';
import type { GanttBlock, EventLog } from '../types/scheduling';
import { EnergyCalculator } from '../engine/energyCalculator';
import { getProcessColor } from '../utils/colors';

export function runRoundRobin(
  processes: Process[],
  batteryConfig: BatteryConfig,
  timeQuantum: number = 2
): {
  ganttBlocks: GanttBlock[];
  eventLogs: EventLog[];
  energyDataPoints: EnergyDataPoint[];
  batteryExhausted: boolean;
  batteryExhaustionTime?: number;
  finalBatteryPercentage: number;
  totalEnergyWh: number;
} {
  const quantum = Math.max(1, timeQuantum);

  if (processes.length === 0) {
    return {
      ganttBlocks: [],
      eventLogs: [],
      energyDataPoints: [],
      batteryExhausted: false,
      finalBatteryPercentage: batteryConfig.initialPercentage,
      totalEnergyWh: 0,
    };
  }

  // Deep clone processes with execution states
  const processStates: ProcessExecutionState[] = processes.map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    waitingTime: 0,
  }));

  const energyCalc = new EnergyCalculator(batteryConfig);
  const ganttBlocks: GanttBlock[] = [];
  const eventLogs: EventLog[] = [];
  const energyDataPoints: EnergyDataPoint[] = [];

  let currentTime = 0;
  let batteryExhausted = false;
  let batteryExhaustionTime: number | undefined;

  // Track processes that haven't entered the ready queue yet
  let unarrived = [...processStates].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.id.localeCompare(b.id);
  });

  const readyQueue: ProcessExecutionState[] = [];

  // Enqueue initial processes arriving at t=0
  const initialArrivals = unarrived.filter((p) => p.arrivalTime <= currentTime);
  for (const p of initialArrivals) {
    readyQueue.push(p);
    eventLogs.push({
      id: `evt-arr-${p.id}-${currentTime}`,
      time: currentTime,
      type: 'ARRIVAL',
      processId: p.id,
      message: `${p.id} (${p.name}) arrived at t=${p.arrivalTime}s and entered ready queue.`,
    });
  }
  unarrived = unarrived.filter((p) => p.arrivalTime > currentTime);

  energyDataPoints.push({
    time: 0,
    batteryPercentage: energyCalc.getBatteryPercentage(),
    remainingEnergyWh: energyCalc.getState(0, null).remainingEnergyWh,
    cumulativeEnergyWh: 0,
    currentPowerWatts: energyCalc.getPowerWatts(null),
    runningProcessId: null,
  });

  while ((readyQueue.length > 0 || unarrived.length > 0) && !batteryExhausted) {
    if (readyQueue.length === 0) {
      // CPU Idle: advance time to earliest unarrived arrival
      const nextArrival = Math.min(...unarrived.map((p) => p.arrivalTime));
      const idleDuration = nextArrival - currentTime;
      const stepRes = energyCalc.step(idleDuration, null);

      ganttBlocks.push({
        id: `idle-${currentTime}-${nextArrival}`,
        processId: 'IDLE',
        processName: 'CPU Idle',
        startTime: currentTime,
        endTime: nextArrival,
        duration: idleDuration,
        powerWatts: stepRes.currentPowerWatts,
        energyConsumedWh: stepRes.energyConsumedWh,
        color: '#ECE6DA',
      });

      eventLogs.push({
        id: `evt-idle-${currentTime}`,
        time: currentTime,
        type: 'IDLE',
        message: `Ready queue empty. CPU idle for ${idleDuration}s awaiting arrivals.`,
      });

      currentTime = nextArrival;

      // Enqueue all newly arrived
      const arrivalsAtNow = unarrived.filter((p) => p.arrivalTime <= currentTime);
      for (const p of arrivalsAtNow) {
        readyQueue.push(p);
        eventLogs.push({
          id: `evt-arr-${p.id}-${currentTime}`,
          time: currentTime,
          type: 'ARRIVAL',
          processId: p.id,
          message: `${p.id} (${p.name}) arrived and joined ready queue.`,
        });
      }
      unarrived = unarrived.filter((p) => p.arrivalTime > currentTime);

      energyDataPoints.push({
        time: currentTime,
        batteryPercentage: stepRes.batteryPercentage,
        remainingEnergyWh: stepRes.remainingEnergyWh,
        cumulativeEnergyWh: energyCalc.getState(currentTime, null).cumulativeEnergyWh,
        currentPowerWatts: stepRes.currentPowerWatts,
        runningProcessId: null,
      });

      if (stepRes.isExhausted) {
        batteryExhausted = true;
        batteryExhaustionTime = currentTime;
        eventLogs.push({
          id: `evt-exhaust-${currentTime}`,
          type: 'EXHAUSTION',
          time: currentTime,
          message: `Battery exhausted at t=${currentTime}s during idle.`,
        });
        break;
      }
      continue;
    }

    // Dequeue next ready process
    const current = readyQueue.shift()!;
    const execDuration = Math.min(quantum, current.remainingTime);
    const endTime = currentTime + execDuration;

    eventLogs.push({
      id: `evt-exec-${current.id}-${currentTime}`,
      time: currentTime,
      type: 'EXECUTE',
      processId: current.id,
      message: `Running ${current.id} for time slice ${execDuration}s (quantum=${quantum}s, remaining: ${current.remainingTime}s).`,
    });

    const stepRes = energyCalc.step(execDuration, current.powerDemand);

    ganttBlocks.push({
      id: `block-${current.id}-${currentTime}`,
      processId: current.id,
      processName: current.name,
      startTime: currentTime,
      endTime,
      duration: execDuration,
      powerWatts: stepRes.currentPowerWatts,
      energyConsumedWh: stepRes.energyConsumedWh,
      color: getProcessColor(current.id),
      isPreempted: current.remainingTime > execDuration,
    });

    current.remainingTime -= execDuration;

    // Check newly arrived processes during (currentTime, endTime] and enqueue them FIRST
    const newlyArrived = unarrived.filter((p) => p.arrivalTime <= endTime);
    // Sort arrivals deterministically
    newlyArrived.sort((a, b) => {
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.id.localeCompare(b.id);
    });

    for (const p of newlyArrived) {
      readyQueue.push(p);
      eventLogs.push({
        id: `evt-arr-${p.id}-${p.arrivalTime}`,
        time: p.arrivalTime,
        type: 'ARRIVAL',
        processId: p.id,
        message: `${p.id} arrived during time slice at t=${p.arrivalTime}s. Added to ready queue.`,
      });
    }
    unarrived = unarrived.filter((p) => p.arrivalTime > endTime);

    // If current process still has work, requeue it at the end
    if (current.remainingTime > 0) {
      readyQueue.push(current);
      eventLogs.push({
        id: `evt-preempt-${current.id}-${endTime}`,
        time: endTime,
        type: 'PREEMPT',
        processId: current.id,
        message: `Quantum expired for ${current.id}. Preempted with ${current.remainingTime}s remaining.`,
      });
    } else {
      eventLogs.push({
        id: `evt-done-${current.id}-${endTime}`,
        time: endTime,
        type: 'COMPLETION',
        processId: current.id,
        message: `Process ${current.id} completed all CPU bursts at t=${endTime}s.`,
      });
    }

    currentTime = endTime;

    energyDataPoints.push({
      time: currentTime,
      batteryPercentage: stepRes.batteryPercentage,
      remainingEnergyWh: stepRes.remainingEnergyWh,
      cumulativeEnergyWh: energyCalc.getState(currentTime, null).cumulativeEnergyWh,
      currentPowerWatts: stepRes.currentPowerWatts,
      runningProcessId: current.id,
    });

    if (stepRes.isExhausted) {
      batteryExhausted = true;
      batteryExhaustionTime = currentTime;
      eventLogs.push({
        id: `evt-exhaust-${currentTime}`,
        time: currentTime,
        type: 'EXHAUSTION',
        message: `Battery fully exhausted at t=${currentTime}s. Simulation halted.`,
      });
      break;
    }
  }

  const finalState = energyCalc.getState(currentTime, null);

  return {
    ganttBlocks,
    eventLogs,
    energyDataPoints,
    batteryExhausted,
    batteryExhaustionTime,
    finalBatteryPercentage: finalState.batteryPercentage,
    totalEnergyWh: finalState.cumulativeEnergyWh,
  };
}
