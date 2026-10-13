import { describe, it, expect } from 'vitest';
import { runSimulation, ALGORITHM_NAMES } from '../algorithms';
import { runAllComparisons } from '../engine/comparisonEngine';
import { DEFAULT_PROCESSES } from '../data/presets';
import { DEFAULT_BATTERY_CONFIG } from '../utils/storage';
import type { AlgorithmType } from '../types/scheduling';
import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';
import type { SimulationResult } from '../types/scheduling';

const cfg: BatteryConfig = { ...DEFAULT_BATTERY_CONFIG };
const algos: AlgorithmType[] = ['FCFS', 'SJF', 'RR', 'Priority', 'BAAS'];

function assertResultConsistency(result: SimulationResult, processes: Process[]) {
  const { ganttBlocks: blocks, aggregateMetrics: m, processMetrics } = result;

  // Contiguous Gantt timeline
  for (let i = 1; i < blocks.length; i++) {
    expect(blocks[i].startTime).toBeCloseTo(blocks[i - 1].endTime, 5);
  }

  for (const b of blocks) {
    expect(b.duration).toBeCloseTo(b.endTime - b.startTime, 5);
    expect(b.duration).toBeGreaterThanOrEqual(0);
    expect(b.energyConsumedWh).toBeCloseTo((b.powerWatts * b.duration) / 3600, 5);
    expect(b.startTime).toBeLessThanOrEqual(b.endTime);

    if (b.processId !== 'IDLE') {
      const p = processes.find((x) => x.id === b.processId);
      expect(p).toBeDefined();
      expect(b.startTime).toBeGreaterThanOrEqual(p!.arrivalTime - 1e-6);
    }
  }

  const sumEnergy = blocks.reduce((s, b) => s + b.energyConsumedWh, 0);
  expect(sumEnergy).toBeCloseTo(m.totalEnergyWh, 4);

  const lastEnd = blocks.length ? Math.max(...blocks.map((b) => b.endTime)) : 0;
  expect(m.makespan).toBeCloseTo(lastEnd, 5);

  for (const pm of processMetrics) {
    expect(pm.waitingTime).toBeGreaterThanOrEqual(-1e-6);
    expect(pm.turnaroundTime).toBeGreaterThanOrEqual(-1e-6);
    expect(pm.responseTime).toBeGreaterThanOrEqual(-1e-6);

    if (pm.completed) {
      expect(pm.turnaroundTime).toBeCloseTo(pm.completionTime - pm.arrivalTime, 5);
      expect(pm.waitingTime).toBeCloseTo(pm.turnaroundTime - pm.burstTime, 5);
    }
  }

  // Battery vs cumulative energy when on battery and not exhausted
  if (!result.batteryConfig.externalPowerConnected && !m.isExhausted && blocks.length > 0) {
    const initialWh =
      (result.batteryConfig.capacityWh * result.batteryConfig.initialPercentage) / 100;
    const expectedPct = ((initialWh - m.totalEnergyWh) / result.batteryConfig.capacityWh) * 100;
    expect(m.finalBatteryPercentage).toBeCloseTo(expectedPct, 1);
  }

  if (result.batteryConfig.externalPowerConnected) {
    expect(m.finalBatteryPercentage).toBe(result.batteryConfig.initialPercentage);
    expect(result.batteryExhausted).toBe(false);
  }
}

describe('Cross-algorithm consistency (Gantt / energy / metrics)', () => {
  for (const algorithm of algos) {
    it(`${algorithm}: Gantt, energy formula, and metrics stay consistent`, () => {
      const result = runSimulation({
        algorithm,
        processes: DEFAULT_PROCESSES,
        batteryConfig: cfg,
        timeQuantum: 2,
        operatingMode: 'Balanced',
      });
      expect(result.algorithmName).toBe(ALGORITHM_NAMES[algorithm]);
      expect(result.ganttBlocks.length).toBeGreaterThan(0);
      assertResultConsistency(result, DEFAULT_PROCESSES);
    });
  }

  it('comparison engine returns five consistent results', () => {
    const report = runAllComparisons(DEFAULT_PROCESSES, cfg, 2, 'Balanced');
    expect(report.comparisonTableData).toHaveLength(5);
    expect(report.recommendations.length).toBeGreaterThanOrEqual(4);
    for (const algo of algos) {
      assertResultConsistency(report.results[algo], DEFAULT_PROCESSES);
      const row = report.comparisonTableData.find((r) => r.algorithm === algo)!;
      expect(row.totalEnergyWh).toBeCloseTo(
        report.results[algo].aggregateMetrics.totalEnergyWh,
        5
      );
      expect(row.avgWaitingTime).toBeCloseTo(
        report.results[algo].aggregateMetrics.avgWaitingTime,
        5
      );
    }
  });
});

describe('Known textbook scheduling cases', () => {
  const acCfg: BatteryConfig = { ...cfg, externalPowerConnected: true };

  it('FCFS classic: P1=24, P2=3, P3=3 → waiting 0, 24, 27 avg 17', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 24, priority: 1, powerDemand: 10, category: 'CPU-bound' },
      { id: 'P2', name: 'P2', arrivalTime: 0, burstTime: 3, priority: 1, powerDemand: 10, category: 'Interactive' },
      { id: 'P3', name: 'P3', arrivalTime: 0, burstTime: 3, priority: 1, powerDemand: 10, category: 'Interactive' },
    ];
    const result = runSimulation({ algorithm: 'FCFS', processes, batteryConfig: acCfg });
    expect(result.ganttBlocks.map((b) => b.processId)).toEqual(['P1', 'P2', 'P3']);
    const byId = Object.fromEntries(result.processMetrics.map((p) => [p.processId, p]));
    expect(byId.P1.waitingTime).toBe(0);
    expect(byId.P2.waitingTime).toBe(24);
    expect(byId.P3.waitingTime).toBe(27);
    expect(result.aggregateMetrics.avgWaitingTime).toBeCloseTo(17, 5);
    expect(byId.P1.turnaroundTime).toBe(24);
    expect(byId.P2.turnaroundTime).toBe(27);
    expect(byId.P3.turnaroundTime).toBe(30);
  });

  it('SJF classic: bursts 6,8,7,3 → order P4,P1,P3,P2 avg wait 7', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 6, priority: 1, powerDemand: 10, category: 'CPU-bound' },
      { id: 'P2', name: 'P2', arrivalTime: 0, burstTime: 8, priority: 1, powerDemand: 10, category: 'CPU-bound' },
      { id: 'P3', name: 'P3', arrivalTime: 0, burstTime: 7, priority: 1, powerDemand: 10, category: 'CPU-bound' },
      { id: 'P4', name: 'P4', arrivalTime: 0, burstTime: 3, priority: 1, powerDemand: 10, category: 'CPU-bound' },
    ];
    const result = runSimulation({ algorithm: 'SJF', processes, batteryConfig: acCfg });
    expect(result.ganttBlocks.map((b) => b.processId)).toEqual(['P4', 'P1', 'P3', 'P2']);
    const byId = Object.fromEntries(result.processMetrics.map((p) => [p.processId, p]));
    expect(byId.P4.waitingTime).toBe(0);
    expect(byId.P1.waitingTime).toBe(3);
    expect(byId.P3.waitingTime).toBe(9);
    expect(byId.P2.waitingTime).toBe(16);
    expect(result.aggregateMetrics.avgWaitingTime).toBeCloseTo(7, 5);
  });

  it('RR classic q=4: P1=24,P2=3,P3=3 → avg wait 5.66…', () => {
    // Silberschatz: quantum 4 → WT P1=6, P2=4, P3=7, avg ≈ 5.67
    const processes: Process[] = [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 24, priority: 1, powerDemand: 10, category: 'CPU-bound' },
      { id: 'P2', name: 'P2', arrivalTime: 0, burstTime: 3, priority: 1, powerDemand: 10, category: 'Interactive' },
      { id: 'P3', name: 'P3', arrivalTime: 0, burstTime: 3, priority: 1, powerDemand: 10, category: 'Interactive' },
    ];
    const result = runSimulation({
      algorithm: 'RR',
      processes,
      batteryConfig: acCfg,
      timeQuantum: 4,
    });
    const byId = Object.fromEntries(result.processMetrics.map((p) => [p.processId, p]));
    expect(byId.P1.waitingTime).toBe(6);
    expect(byId.P2.waitingTime).toBe(4);
    expect(byId.P3.waitingTime).toBe(7);
    expect(result.aggregateMetrics.avgWaitingTime).toBeCloseTo(17 / 3, 5);
    // First slice P1 for 4s, then P2 for 3s, then P3 for 3s
    expect(result.ganttBlocks[0]).toMatchObject({ processId: 'P1', duration: 4 });
    expect(result.ganttBlocks[1]).toMatchObject({ processId: 'P2', duration: 3 });
    expect(result.ganttBlocks[2]).toMatchObject({ processId: 'P3', duration: 3 });
  });

  it('Priority classic: lower number first', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 10, priority: 3, powerDemand: 10, category: 'Background' },
      { id: 'P2', name: 'P2', arrivalTime: 0, burstTime: 1, priority: 1, powerDemand: 10, category: 'Interactive' },
      { id: 'P3', name: 'P3', arrivalTime: 0, burstTime: 2, priority: 4, powerDemand: 10, category: 'Background' },
      { id: 'P4', name: 'P4', arrivalTime: 0, burstTime: 1, priority: 5, powerDemand: 10, category: 'Background' },
      { id: 'P5', name: 'P5', arrivalTime: 0, burstTime: 5, priority: 2, powerDemand: 10, category: 'CPU-bound' },
    ];
    const result = runSimulation({ algorithm: 'Priority', processes, batteryConfig: acCfg });
    expect(result.ganttBlocks.map((b) => b.processId)).toEqual(['P2', 'P5', 'P1', 'P3', 'P4']);
    const byId = Object.fromEntries(result.processMetrics.map((p) => [p.processId, p]));
    // Waiting: P2=0, P5=1, P1=6, P3=16, P4=18 → avg 8.2
    expect(byId.P2.waitingTime).toBe(0);
    expect(byId.P5.waitingTime).toBe(1);
    expect(byId.P1.waitingTime).toBe(6);
    expect(byId.P3.waitingTime).toBe(16);
    expect(byId.P4.waitingTime).toBe(18);
    expect(result.aggregateMetrics.avgWaitingTime).toBeCloseTo(8.2, 5);
  });

  it('energy on AC matches integrated power without draining battery', () => {
    const processes: Process[] = [
      { id: 'P1', name: 'P1', arrivalTime: 0, burstTime: 10, priority: 1, powerDemand: 31, category: 'CPU-bound' },
    ];
    const result = runSimulation({ algorithm: 'FCFS', processes, batteryConfig: acCfg });
    // power = idle 5 + 31 = 36W for 10s → 36*10/3600 = 0.1 Wh
    expect(result.aggregateMetrics.totalEnergyWh).toBeCloseTo(0.1, 5);
    expect(result.aggregateMetrics.finalBatteryPercentage).toBe(100);
    expect(result.ganttBlocks[0].energyConsumedWh).toBeCloseTo(0.1, 5);
  });
});
