import type { Process, ProcessExecutionState } from '../types/process';
import type { BatteryConfig, EnergyDataPoint } from '../types/battery';
import type {
  GanttBlock,
  EventLog,
  BAASOperatingMode,
  BAASDecision,
  ProcessScoreDetail,
  BAASThresholds,
  BAASWeights,
} from '../types/scheduling';
import { EnergyCalculator } from '../engine/energyCalculator';
import { getProcessColor } from '../utils/colors';

export const DEFAULT_BAAS_THRESHOLDS: BAASThresholds = {
  highBatteryThreshold: 60,
  lowBatteryThreshold: 25,
};

export function getEffectiveWeights(
  mode: BAASOperatingMode,
  batteryPct: number,
  isAC: boolean,
  thresholds: BAASThresholds = DEFAULT_BAAS_THRESHOLDS
): { effectiveMode: BAASOperatingMode; weights: BAASWeights; reason: string } {
  if (isAC) {
    return {
      effectiveMode: 'Performance',
      weights: { priorityWeight: 0.45, burstWeight: 0.25, waitingWeight: 0.25, powerWeight: 0.05 },
      reason: 'AC mains connected: unlimited power allows maximum performance prioritization.',
    };
  }

  if (mode === 'Performance') {
    return {
      effectiveMode: 'Performance',
      weights: { priorityWeight: 0.45, burstWeight: 0.25, waitingWeight: 0.25, powerWeight: 0.05 },
      reason: 'User-forced Performance Mode: prioritizing high-priority tasks and low response latency.',
    };
  }

  if (mode === 'PowerSaving') {
    return {
      effectiveMode: 'PowerSaving',
      weights: { priorityWeight: 0.10, powerWeight: 0.55, burstWeight: 0.15, waitingWeight: 0.20 },
      reason: 'User-forced Power Saving Mode: prioritizing low-wattage tasks with DVFS power reduction.',
    };
  }

  // Balanced Mode (Dynamic battery adaptive):
  if (batteryPct > thresholds.highBatteryThreshold) {
    return {
      effectiveMode: 'Balanced',
      weights: { priorityWeight: 0.30, powerWeight: 0.25, burstWeight: 0.25, waitingWeight: 0.20 },
      reason: `Battery healthy (${batteryPct.toFixed(1)}% > ${thresholds.highBatteryThreshold}%): balanced performance and energy efficiency.`,
    };
  } else if (batteryPct >= thresholds.lowBatteryThreshold) {
    return {
      effectiveMode: 'Balanced',
      weights: { priorityWeight: 0.15, powerWeight: 0.45, burstWeight: 0.20, waitingWeight: 0.20 },
      reason: `Battery moderate (${batteryPct.toFixed(1)}%): shifting weights toward low-power execution.`,
    };
  } else {
    return {
      effectiveMode: 'PowerSaving',
      weights: { priorityWeight: 0.10, powerWeight: 0.55, burstWeight: 0.15, waitingWeight: 0.20 },
      reason: `Critical battery state (${batteryPct.toFixed(1)}% < ${thresholds.lowBatteryThreshold}%): maximum power conservation active.`,
    };
  }
}

export function runBAAS(
  processes: Process[],
  batteryConfig: BatteryConfig,
  operatingMode: BAASOperatingMode = 'Balanced',
  thresholds: BAASThresholds = DEFAULT_BAAS_THRESHOLDS
): {
  ganttBlocks: GanttBlock[];
  eventLogs: EventLog[];
  decisions: BAASDecision[];
  energyDataPoints: EnergyDataPoint[];
  batteryExhausted: boolean;
  batteryExhaustionTime?: number;
  finalBatteryPercentage: number;
  totalEnergyWh: number;
} {
  const schedulingInterval = Math.max(1, batteryConfig.schedulingInterval || 2);

  if (processes.length === 0) {
    return {
      ganttBlocks: [],
      eventLogs: [],
      decisions: [],
      energyDataPoints: [],
      batteryExhausted: false,
      finalBatteryPercentage: batteryConfig.initialPercentage,
      totalEnergyWh: 0,
    };
  }

  const processStates: ProcessExecutionState[] = processes.map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    waitingTime: 0,
  }));

  const energyCalc = new EnergyCalculator(batteryConfig);
  const ganttBlocks: GanttBlock[] = [];
  const eventLogs: EventLog[] = [];
  const decisions: BAASDecision[] = [];
  const energyDataPoints: EnergyDataPoint[] = [];

  let currentTime = 0;
  let batteryExhausted = false;
  let batteryExhaustionTime: number | undefined;
  let previousProcessId: string | null = null;

  energyDataPoints.push({
    time: 0,
    batteryPercentage: energyCalc.getBatteryPercentage(),
    remainingEnergyWh: energyCalc.getState(0, null).remainingEnergyWh,
    cumulativeEnergyWh: 0,
    currentPowerWatts: energyCalc.getPowerWatts(null),
    runningProcessId: null,
  });

  const getUncompleted = () => processStates.filter((p) => p.remainingTime > 0.0001);

  while (getUncompleted().length > 0 && !batteryExhausted) {
    const uncompleted = getUncompleted();
    // Arrived ready processes
    const ready = uncompleted.filter((p) => p.arrivalTime <= currentTime);

    if (ready.length === 0) {
      // CPU Idle: advance time to earliest arrival
      const nextArrival = Math.min(...uncompleted.map((p) => p.arrivalTime));
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
        message: `No processes ready. CPU idle for ${idleDuration}s awaiting arrival at t=${nextArrival}s.`,
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

    // Update accumulated waiting times for all ready processes
    for (const p of ready) {
      const executedSoFar = p.burstTime - p.remainingTime;
      p.waitingTime = Math.max(0, currentTime - p.arrivalTime - executedSoFar);
    }

    const currentBatteryPct = energyCalc.getBatteryPercentage();
    const { effectiveMode, weights, reason: modeReason } = getEffectiveWeights(
      operatingMode,
      currentBatteryPct,
      batteryConfig.externalPowerConnected,
      thresholds
    );

    // Normalize metrics across ready set
    const minPrio = Math.min(...ready.map((p) => p.priority));
    const maxPrio = Math.max(...ready.map((p) => p.priority));
    const prioRange = Math.max(1, maxPrio - minPrio);

    const minPower = Math.min(...ready.map((p) => p.powerDemand));
    const maxPower = Math.max(...ready.map((p) => p.powerDemand));
    const powerRange = Math.max(1, maxPower - minPower);

    const minBurst = Math.min(...ready.map((p) => p.remainingTime));
    const maxBurst = Math.max(...ready.map((p) => p.remainingTime));
    const burstRange = Math.max(1, maxBurst - minBurst);

    const maxWait = Math.max(1, ...ready.map((p) => p.waitingTime));

    const scoreDetails: ProcessScoreDetail[] = ready.map((p) => {
      // Lower numerical priority is better -> 1.0 when p.priority == minPrio
      const normPriority = maxPrio === minPrio ? 1.0 : 1 - (p.priority - minPrio) / prioRange;

      // Lower power demand is better -> 1.0 when p.powerDemand == minPower
      const normPower = maxPower === minPower ? 1.0 : 1 - (p.powerDemand - minPower) / powerRange;

      // Shorter remaining burst is better -> 1.0 when p.remainingTime == minBurst
      const normBurst = maxBurst === minBurst ? 1.0 : 1 - (p.remainingTime - minBurst) / burstRange;

      // Longer waiting time scores higher (aging)
      const normWait = p.waitingTime / maxWait;

      // Hard anti-starvation aging bonus if process has waited excessively
      const agingBonus = p.waitingTime >= 10 ? Math.min(0.4, (p.waitingTime - 10) * 0.05) : 0;

      const baseScore =
        weights.priorityWeight * normPriority +
        weights.powerWeight * normPower +
        weights.burstWeight * normBurst +
        weights.waitingWeight * normWait;

      const totalScore = baseScore + agingBonus;

      return {
        processId: p.id,
        processName: p.name,
        totalScore,
        normPriority,
        normPower,
        normBurst,
        normWait,
        currentWait: p.waitingTime,
        remainingBurst: p.remainingTime,
        powerDemand: p.powerDemand,
      };
    });

    // Sort by highest score; deterministic tie breakers: waitingTime desc, arrivalTime asc, PID asc
    scoreDetails.sort((a, b) => {
      if (Math.abs(b.totalScore - a.totalScore) > 0.00001) {
        return b.totalScore - a.totalScore;
      }
      if (b.currentWait !== a.currentWait) {
        return b.currentWait - a.currentWait;
      }
      return a.processId.localeCompare(b.processId);
    });

    const chosenDetail = scoreDetails[0];
    const selected = ready.find((p) => p.id === chosenDetail.processId)!;

    // Build explanatory justification for decision log
    let explanation = `Chosen with score ${chosenDetail.totalScore.toFixed(3)} under ${effectiveMode} mode. `;
    const hasAgingBoost = chosenDetail.currentWait >= 8;
    if (hasAgingBoost) {
      explanation += `Starvation-prevention aging applied (waited ${chosenDetail.currentWait}s). `;
    } else if (effectiveMode === 'PowerSaving') {
      explanation += `Favored due to low power demand (${chosenDetail.powerDemand}W, power score ${chosenDetail.normPower.toFixed(2)}). `;
    } else if (effectiveMode === 'Performance') {
      explanation += `Favored high priority (${selected.priority}) and prompt response. `;
    } else {
      explanation += `Best weighted balance of priority (${selected.priority}), remaining burst (${selected.remainingTime}s), and power demand (${selected.powerDemand}W). `;
    }
    explanation += modeReason;

    decisions.push({
      time: currentTime,
      previousProcessId,
      selectedProcessId: selected.id,
      batteryLevel: currentBatteryPct,
      operatingMode: effectiveMode,
      scores: scoreDetails,
      explanation,
    });

    eventLogs.push({
      id: `evt-baas-${selected.id}-${currentTime}`,
      time: currentTime,
      type: 'SCHEDULE',
      processId: selected.id,
      message: `[BAAS Decision] ${selected.id} scheduled (Score: ${chosenDetail.totalScore.toFixed(2)}, Mode: ${effectiveMode}, Batt: ${currentBatteryPct.toFixed(1)}%)${hasAgingBoost ? ' [Starvation aging active]' : ''}.`,
      details: {
        score: chosenDetail.totalScore,
        mode: effectiveMode,
        battery: currentBatteryPct,
        explanation,
      },
    });

    // Execute for time slice = min(schedulingInterval, remainingTime)
    // Also check if any new process arrives before time slice ends to allow prompt re-evaluation
    let execDuration = Math.min(schedulingInterval, selected.remainingTime);
    const futureArrivals = uncompleted.filter((p) => p.arrivalTime > currentTime && p.arrivalTime < currentTime + execDuration);
    if (futureArrivals.length > 0) {
      const earliestNextArrival = Math.min(...futureArrivals.map((p) => p.arrivalTime));
      execDuration = earliestNextArrival - currentTime;
    }

    const isPowerSavingApplied = effectiveMode === 'PowerSaving';
    const stepRes = energyCalc.step(execDuration, selected.powerDemand, isPowerSavingApplied);
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
      isPreempted: selected.remainingTime > execDuration,
    });

    selected.remainingTime -= execDuration;
    previousProcessId = selected.id;

    if (selected.remainingTime <= 0.0001) {
      selected.remainingTime = 0;
      eventLogs.push({
        id: `evt-done-${selected.id}-${endTime}`,
        time: endTime,
        type: 'COMPLETION',
        processId: selected.id,
        message: `Completed ${selected.id} (${selected.name}) at t=${endTime}s.`,
      });
    } else if (execDuration < selected.burstTime) {
      eventLogs.push({
        id: `evt-reval-${selected.id}-${endTime}`,
        time: endTime,
        type: 'PREEMPT',
        processId: selected.id,
        message: `Time slice expired for ${selected.id}. Re-evaluating adaptive scores with ${selected.remainingTime.toFixed(1)}s remaining.`,
      });
    }

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
        message: `Battery fully exhausted at t=${currentTime}s. Simulation halted.`,
      });
      break;
    }
  }

  const finalState = energyCalc.getState(currentTime, null);

  return {
    ganttBlocks,
    eventLogs,
    decisions,
    energyDataPoints,
    batteryExhausted,
    batteryExhaustionTime,
    finalBatteryPercentage: finalState.batteryPercentage,
    totalEnergyWh: finalState.cumulativeEnergyWh,
  };
}
