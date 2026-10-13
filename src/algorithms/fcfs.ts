import type { Process } from '../types/process';
import type { BatteryConfig, EnergyDataPoint } from '../types/battery';
import type { GanttBlock, EventLog } from '../types/scheduling';
import { EnergyCalculator } from '../engine/energyCalculator';
import { getProcessColor } from '../utils/colors';

export function runFCFS(
  processes: Process[],
  batteryConfig: BatteryConfig
): {
  ganttBlocks: GanttBlock[];
  eventLogs: EventLog[];
  energyDataPoints: EnergyDataPoint[];
  batteryExhausted: boolean;
  batteryExhaustionTime?: number;
  finalBatteryPercentage: number;
  totalEnergyWh: number;
} {
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

  // Clone and sort deterministically: arrival time ascending, then ID ascending
  const sorted = [...processes].sort((a, b) => {
    if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
    return a.id.localeCompare(b.id);
  });

  const energyCalc = new EnergyCalculator(batteryConfig);
  const ganttBlocks: GanttBlock[] = [];
  const eventLogs: EventLog[] = [];
  const energyDataPoints: EnergyDataPoint[] = [];

  let currentTime = 0;
  let batteryExhausted = false;
  let batteryExhaustionTime: number | undefined;

  // Record initial state
  energyDataPoints.push({
    time: 0,
    batteryPercentage: energyCalc.getBatteryPercentage(),
    remainingEnergyWh: energyCalc.getState(0, null).remainingEnergyWh,
    cumulativeEnergyWh: 0,
    currentPowerWatts: energyCalc.getPowerWatts(null),
    runningProcessId: null,
  });

  for (const p of sorted) {
    if (batteryExhausted) break;

    // Handle CPU Idle time if process arrives in the future
    if (currentTime < p.arrivalTime) {
      const idleDuration = p.arrivalTime - currentTime;
      const stepRes = energyCalc.step(idleDuration, null);

      ganttBlocks.push({
        id: `idle-${currentTime}-${p.arrivalTime}`,
        processId: 'IDLE',
        processName: 'CPU Idle',
        startTime: currentTime,
        endTime: p.arrivalTime,
        duration: idleDuration,
        powerWatts: stepRes.currentPowerWatts,
        energyConsumedWh: stepRes.energyConsumedWh,
        color: '#ECE6DA',
      });

      eventLogs.push({
        id: `evt-idle-${currentTime}`,
        time: currentTime,
        type: 'IDLE',
        message: `CPU Idle for ${idleDuration}s awaiting next arrival.`,
      });

      currentTime = p.arrivalTime;

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
          time: currentTime,
          type: 'EXHAUSTION',
          message: `Battery fully depleted at t=${currentTime}s during CPU idle state.`,
        });
        break;
      }
    }

    // Process arrives and is ready
    eventLogs.push({
      id: `evt-sched-${p.id}-${currentTime}`,
      time: currentTime,
      type: 'SCHEDULE',
      processId: p.id,
      message: `Scheduled ${p.id} (${p.name}) in FCFS order. Burst: ${p.burstTime}s, Power: ${p.powerDemand}W.`,
    });

    const execDuration = p.burstTime;
    const stepRes = energyCalc.step(execDuration, p.powerDemand);
    const endTime = currentTime + execDuration;

    ganttBlocks.push({
      id: `block-${p.id}-${currentTime}`,
      processId: p.id,
      processName: p.name,
      startTime: currentTime,
      endTime,
      duration: execDuration,
      powerWatts: stepRes.currentPowerWatts,
      energyConsumedWh: stepRes.energyConsumedWh,
      color: getProcessColor(p.id),
    });

    eventLogs.push({
      id: `evt-done-${p.id}-${endTime}`,
      time: endTime,
      type: 'COMPLETION',
      processId: p.id,
      message: `Completed ${p.id} (${p.name}) at t=${endTime}s.`,
    });

    currentTime = endTime;

    energyDataPoints.push({
      time: currentTime,
      batteryPercentage: stepRes.batteryPercentage,
      remainingEnergyWh: stepRes.remainingEnergyWh,
      cumulativeEnergyWh: energyCalc.getState(currentTime, null).cumulativeEnergyWh,
      currentPowerWatts: stepRes.currentPowerWatts,
      runningProcessId: p.id,
    });

    if (stepRes.isExhausted) {
      batteryExhausted = true;
      batteryExhaustionTime = currentTime;
      eventLogs.push({
        id: `evt-exhaust-${currentTime}`,
        time: currentTime,
        type: 'EXHAUSTION',
        message: `Battery depleted at t=${currentTime}s. Simulation halted.`,
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
