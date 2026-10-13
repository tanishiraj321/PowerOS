import type { Process } from '../types/process';
import type { BatteryConfig, EnergyDataPoint } from '../types/battery';
import type { GanttBlock, EventLog } from '../types/scheduling';
import { EnergyCalculator } from '../engine/energyCalculator';
import { getProcessColor } from '../utils/colors';

export function runSJF(
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

  const remaining = processes.map((p) => ({ ...p }));
  const energyCalc = new EnergyCalculator(batteryConfig);
  const ganttBlocks: GanttBlock[] = [];
  const eventLogs: EventLog[] = [];
  const energyDataPoints: EnergyDataPoint[] = [];

  let currentTime = 0;
  let batteryExhausted = false;
  let batteryExhaustionTime: number | undefined;

  energyDataPoints.push({
    time: 0,
    batteryPercentage: energyCalc.getBatteryPercentage(),
    remainingEnergyWh: energyCalc.getState(0, null).remainingEnergyWh,
    cumulativeEnergyWh: 0,
    currentPowerWatts: energyCalc.getPowerWatts(null),
    runningProcessId: null,
  });

  while (remaining.length > 0 && !batteryExhausted) {
    // Find ready processes at currentTime
    const ready = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (ready.length === 0) {
      // CPU Idle: advance to earliest arrival time among remaining
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
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
        message: `CPU Idle for ${idleDuration}s awaiting next arrival at t=${nextArrival}s.`,
      });

      currentTime = nextArrival;

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
          message: `Battery depleted during CPU idle at t=${currentTime}s.`,
        });
        break;
      }
      continue;
    }

    // Select shortest burst time; tie breaker: arrival time, then PID
    ready.sort((a, b) => {
      if (a.burstTime !== b.burstTime) return a.burstTime - b.burstTime;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.id.localeCompare(b.id);
    });

    const selected = ready[0];
    const indexInRemaining = remaining.findIndex((p) => p.id === selected.id);
    remaining.splice(indexInRemaining, 1);

    eventLogs.push({
      id: `evt-sched-${selected.id}-${currentTime}`,
      time: currentTime,
      type: 'SCHEDULE',
      processId: selected.id,
      message: `Selected ${selected.id} (${selected.name}) with shortest burst (${selected.burstTime}s). Power: ${selected.powerDemand}W.`,
    });

    const execDuration = selected.burstTime;
    const stepRes = energyCalc.step(execDuration, selected.powerDemand);
    const endTime = currentTime + execDuration;

    ganttBlocks.push({
      id: `block-${selected.id}-${currentTime}`,
      processId: selected.id,
      processName: selected.name,
      startTime: currentTime,
      endTime,
      duration: execDuration,
      powerWatts: stepRes.currentPowerWatts,
      energyConsumedWh: stepRes.energyConsumedWh,
      color: getProcessColor(selected.id),
    });

    eventLogs.push({
      id: `evt-done-${selected.id}-${endTime}`,
      time: endTime,
      type: 'COMPLETION',
      processId: selected.id,
      message: `Completed ${selected.id} (${selected.name}) at t=${endTime}s.`,
    });

    currentTime = endTime;

    energyDataPoints.push({
      time: currentTime,
      batteryPercentage: stepRes.batteryPercentage,
      remainingEnergyWh: stepRes.remainingEnergyWh,
      cumulativeEnergyWh: energyCalc.getState(currentTime, null).cumulativeEnergyWh,
      currentPowerWatts: stepRes.currentPowerWatts,
      runningProcessId: selected.id,
    });

    if (stepRes.isExhausted) {
      batteryExhausted = true;
      batteryExhaustionTime = currentTime;
      eventLogs.push({
        id: `evt-exhaust-${currentTime}`,
        time: currentTime,
        type: 'EXHAUSTION',
        message: `Battery depleted at t=${currentTime}s during ${selected.id}.`,
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
