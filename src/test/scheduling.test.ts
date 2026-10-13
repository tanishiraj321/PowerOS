import { describe, it, expect } from 'vitest';
import { runFCFS } from '../algorithms/fcfs';
import { runSJF } from '../algorithms/sjf';
import { runRoundRobin } from '../algorithms/roundRobin';
import { runPriority } from '../algorithms/priority';
import { runBAAS } from '../algorithms/baas';
import { runSimulation } from '../algorithms';
import { EnergyCalculator } from '../engine/energyCalculator';
import type { BatteryConfig } from '../types/battery';
import type { Process } from '../types/process';

const baseConfig: BatteryConfig = {
  capacityWh: 50,
  initialPercentage: 100,
  idlePowerWatts: 5,
  externalPowerConnected: false,
  powerSavingMultiplier: 0.75,
  schedulingInterval: 2,
};

describe('PowerOS Scheduling & Energy Test Suite', () => {
  // Test 1: FCFS with staggered arrivals
  it('1. FCFS runs strictly in arrival order and handles idle gaps', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'Task 1', arrivalTime: 2, burstTime: 3, priority: 1, powerDemand: 20, category: 'Interactive' },
      { id: 'P2', name: 'Task 2', arrivalTime: 0, burstTime: 2, priority: 2, powerDemand: 15, category: 'Interactive' },
    ];

    const result = runFCFS(processes, baseConfig);
    expect(result.ganttBlocks[0].processId).toBe('P2'); // P2 arrived at 0
    expect(result.ganttBlocks[0].startTime).toBe(0);
    expect(result.ganttBlocks[0].endTime).toBe(2);

    expect(result.ganttBlocks[1].processId).toBe('P1'); // P1 arrived at 2
    expect(result.ganttBlocks[1].startTime).toBe(2);
    expect(result.ganttBlocks[1].endTime).toBe(5);
  });

  // Test 2: SJF with shorter process arriving during execution
  it('2. SJF selects shortest burst among arrived processes without preemption', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'Long Task', arrivalTime: 0, burstTime: 6, priority: 3, powerDemand: 30, category: 'CPU-bound' },
      { id: 'P2', name: 'Short Task', arrivalTime: 1, burstTime: 2, priority: 1, powerDemand: 20, category: 'Interactive' },
      { id: 'P3', name: 'Medium Task', arrivalTime: 2, burstTime: 4, priority: 2, powerDemand: 25, category: 'CPU-bound' },
    ];

    const result = runSJF(processes, baseConfig);
    // Non-preemptive: P1 starts at 0 and runs until 6
    expect(result.ganttBlocks[0].processId).toBe('P1');
    expect(result.ganttBlocks[0].endTime).toBe(6);
    // At t=6, both P2 (burst 2) and P3 (burst 4) are ready. P2 must be selected next!
    expect(result.ganttBlocks[1].processId).toBe('P2');
    expect(result.ganttBlocks[1].endTime).toBe(8);
    // P3 runs next
    expect(result.ganttBlocks[2].processId).toBe('P3');
    expect(result.ganttBlocks[2].endTime).toBe(12);
  });

  // Test 3: Round Robin with known time quantum
  it('3. Round Robin preempts according to time quantum and respects ready queue order', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'Task 1', arrivalTime: 0, burstTime: 5, priority: 1, powerDemand: 20, category: 'Interactive' },
      { id: 'P2', name: 'Task 2', arrivalTime: 0, burstTime: 3, priority: 2, powerDemand: 20, category: 'Interactive' },
    ];

    const result = runRoundRobin(processes, baseConfig, 2);
    // Quantum = 2
    // t=0-2: P1 (3 left)
    expect(result.ganttBlocks[0].processId).toBe('P1');
    expect(result.ganttBlocks[0].duration).toBe(2);
    // t=2-4: P2 (1 left)
    expect(result.ganttBlocks[1].processId).toBe('P2');
    expect(result.ganttBlocks[1].duration).toBe(2);
    // t=4-6: P1 (1 left)
    expect(result.ganttBlocks[2].processId).toBe('P1');
    expect(result.ganttBlocks[2].duration).toBe(2);
    // t=6-7: P2 (done)
    expect(result.ganttBlocks[3].processId).toBe('P2');
    expect(result.ganttBlocks[3].duration).toBe(1);
    // t=7-8: P1 (done)
    expect(result.ganttBlocks[4].processId).toBe('P1');
    expect(result.ganttBlocks[4].duration).toBe(1);
  });

  // Test 4: Priority Scheduling with tie breaking
  it('4. Priority scheduling selects lowest numerical priority with deterministic tie breaking', () => {
    const processes: Process[] = [
      { id: 'P2', name: 'Medium Prio', arrivalTime: 0, burstTime: 4, priority: 2, powerDemand: 20, category: 'Interactive' },
      { id: 'P1', name: 'High Prio', arrivalTime: 0, burstTime: 4, priority: 1, powerDemand: 20, category: 'Interactive' },
      { id: 'P3', name: 'Tied High Prio', arrivalTime: 0, burstTime: 2, priority: 1, powerDemand: 20, category: 'Interactive' },
    ];

    const result = runPriority(processes, baseConfig);
    // Between P1 and P3, priority is tied (1). Tie breaker: arrival time (both 0), then PID ('P1' < 'P3')
    expect(result.ganttBlocks[0].processId).toBe('P1');
    expect(result.ganttBlocks[1].processId).toBe('P3');
    expect(result.ganttBlocks[2].processId).toBe('P2');
  });

  // Test 5: CPU Idle periods
  it('5. Handles CPU idle periods correctly when no jobs have arrived', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'Late Arrival', arrivalTime: 5, burstTime: 3, priority: 1, powerDemand: 25, category: 'Interactive' },
    ];

    const result = runFCFS(processes, baseConfig);
    expect(result.ganttBlocks[0].processId).toBe('IDLE');
    expect(result.ganttBlocks[0].startTime).toBe(0);
    expect(result.ganttBlocks[0].endTime).toBe(5);
    expect(result.ganttBlocks[1].processId).toBe('P1');
    expect(result.ganttBlocks[1].startTime).toBe(5);
  });

  // Test 6: Battery energy calculation accuracy
  it('6. Energy equation matches theoretical power integration', () => {
    const calc = new EnergyCalculator(baseConfig);
    // System power = idle (5W) + active (31W) = 36W
    // 36W for 100 seconds: 36 * 100 / 3600 = 1.0 Wh
    const step = calc.step(100, 31);
    expect(step.currentPowerWatts).toBe(36);
    expect(step.energyConsumedWh).toBeCloseTo(1.0, 4);

    const state = calc.getState(100, 31);
    expect(state.remainingEnergyWh).toBeCloseTo(49.0, 4);
    expect(state.batteryPercentage).toBeCloseTo((49 / 50) * 100, 2);
  });

  // Test 7: Starvation prevention in BAAS via aging
  it('7. BAAS prevents indefinite starvation via waiting-time aging', () => {
    const processes: Process[] = [
      { id: 'P_HUNGRY', name: 'Power Hungry Low Prio', arrivalTime: 0, burstTime: 6, priority: 5, powerDemand: 70, category: 'CPU-bound' },
      { id: 'P_GREEN1', name: 'Low Power 1', arrivalTime: 0, burstTime: 4, priority: 1, powerDemand: 10, category: 'Interactive' },
      { id: 'P_GREEN2', name: 'Low Power 2', arrivalTime: 0, burstTime: 6, priority: 1, powerDemand: 10, category: 'Interactive' },
    ];

    const result = runBAAS(processes, baseConfig, 'PowerSaving');
    // Both low-power processes execute first (4s + 6s = 10s wait for P_HUNGRY).
    // P_HUNGRY should then receive starvation-prevention aging boost and run!
    const hungryBlocks = result.ganttBlocks.filter((b) => b.processId === 'P_HUNGRY');
    expect(hungryBlocks.length).toBeGreaterThan(0);
    expect(result.eventLogs.some((e) => e.message.includes('aging') || e.message.includes('Starvation'))).toBe(true);
  });

  // Test 8: External AC power connection
  it('8. External power connection prevents battery discharge while tracking energy', () => {
    const acConfig: BatteryConfig = {
      ...baseConfig,
      externalPowerConnected: true,
    };

    const processes: Process[] = [
      { id: 'P1', name: 'Task', arrivalTime: 0, burstTime: 10, priority: 1, powerDemand: 50, category: 'CPU-bound' },
    ];

    const result = runSimulation({
      algorithm: 'FCFS',
      processes,
      batteryConfig: acConfig,
    });

    // Total energy is positive
    expect(result.aggregateMetrics.totalEnergyWh).toBeGreaterThan(0);
    // Battery remains at 100%
    expect(result.aggregateMetrics.finalBatteryPercentage).toBe(100);
    expect(result.batteryExhausted).toBe(false);
  });

  // Test 9: Battery exhaustion halts execution cleanly
  it('9. Halts execution when battery is depleted and does not mark incomplete processes as completed', () => {
    // Very tiny battery: 0.001 Wh (will exhaust quickly)
    const tinyBattery: BatteryConfig = {
      ...baseConfig,
      capacityWh: 0.001,
      initialPercentage: 100,
    };

    const processes: Process[] = [
      { id: 'P1', name: 'Heavy Task', arrivalTime: 0, burstTime: 100, priority: 1, powerDemand: 80, category: 'CPU-bound' },
      { id: 'P2', name: 'Never Runs', arrivalTime: 0, burstTime: 10, priority: 2, powerDemand: 20, category: 'Interactive' },
    ];

    const result = runSimulation({
      algorithm: 'FCFS',
      processes,
      batteryConfig: tinyBattery,
    });

    expect(result.batteryExhausted).toBe(true);
    // P2 should NOT be marked completed
    const p2Metric = result.processMetrics.find((m) => m.processId === 'P2');
    expect(p2Metric?.completed).toBe(false);
  });

  // Test 10: Invariants check
  it('10. Invariants hold: no negative metrics, no process before arrival', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'T1', arrivalTime: 3, burstTime: 4, priority: 2, powerDemand: 20, category: 'Interactive' },
      { id: 'P2', name: 'T2', arrivalTime: 0, burstTime: 5, priority: 1, powerDemand: 30, category: 'Interactive' },
    ];

    const result = runSimulation({
      algorithm: 'SJF',
      processes,
      batteryConfig: baseConfig,
    });

    // Check P1 start time >= arrival time (3)
    const p1Block = result.ganttBlocks.find((b) => b.processId === 'P1');
    expect(p1Block!.startTime).toBeGreaterThanOrEqual(3);

    // Non-negative metrics
    for (const m of result.processMetrics) {
      expect(m.waitingTime).toBeGreaterThanOrEqual(0);
      expect(m.turnaroundTime).toBeGreaterThanOrEqual(0);
      expect(m.responseTime).toBeGreaterThanOrEqual(0);
    }
  });
});
