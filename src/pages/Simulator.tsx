import React, { useState } from 'react';
import { Play, Save, Download, ScrollText } from 'lucide-react';
import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';
import type {
  AlgorithmType,
  BAASOperatingMode,
  SimulationResult,
} from '../types/scheduling';
import type { SavedExperiment } from '../types/history';
import {
  runSimulation,
  ALGORITHM_NAMES,
  ALGORITHM_DESCRIPTIONS,
} from '../algorithms';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { GanttChart } from '../components/charts/GanttChart';
import { exportSchedulingResultsCSV } from '../utils/exportUtils';
import {
  formatEnergy,
  formatTime,
  formatPercentage,
  formatDateTime,
} from '../utils/formatters';

interface SimulatorProps {
  processes: Process[];
  batteryConfig: BatteryConfig;
  lastResult: SimulationResult | null;
  onResult: (result: SimulationResult) => void;
  onSaveExperiment: (experiment: SavedExperiment) => void;
}

const ALGORITHMS: AlgorithmType[] = ['FCFS', 'SJF', 'RR', 'Priority', 'BAAS'];

export const Simulator: React.FC<SimulatorProps> = ({
  processes,
  batteryConfig,
  lastResult,
  onResult,
  onSaveExperiment,
}) => {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('BAAS');
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [operatingMode, setOperatingMode] = useState<BAASOperatingMode>('Balanced');
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleRun = () => {
    setError(null);
    setSavedMsg(false);
    if (processes.length === 0) {
      setError('Add at least one process before running a simulation.');
      return;
    }
    try {
      const result = runSimulation({
        algorithm,
        processes,
        batteryConfig,
        timeQuantum,
        operatingMode,
        workloadName: 'Custom Workload',
      });
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed.');
    }
  };

  const handleSave = () => {
    if (!lastResult) return;
    const now = Date.now();
    const experiment: SavedExperiment = {
      id: `exp_${now}`,
      name: `${lastResult.algorithm} · ${formatDateTime(now)}`,
      timestamp: now,
      dateFormatted: formatDateTime(now),
      workloadName: lastResult.workloadName || 'Custom Workload',
      processes: processes.map((p) => ({ ...p })),
      result: lastResult,
    };
    onSaveExperiment(experiment);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const metrics = lastResult?.aggregateMetrics;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold text-[#26352B]">Simulation Configuration</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {ALGORITHMS.map((algo) => (
            <button
              key={algo}
              type="button"
              onClick={() => setAlgorithm(algo)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                algorithm === algo
                  ? 'border-[#84A282] bg-[#84A282] text-white shadow-xs'
                  : 'border-[#DFE7DD] bg-[#FEFAF3] text-[#26352B] hover:border-[#B8CFB3]'
              }`}
            >
              {algo}
            </button>
          ))}
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[#596D5F]">
          {ALGORITHM_DESCRIPTIONS[algorithm]}
        </p>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {algorithm === 'RR' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352B]">
                Time Quantum (s)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={timeQuantum}
                onChange={(e) => setTimeQuantum(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282]"
              />
            </div>
          )}
          {algorithm === 'BAAS' && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352B]">
                BAAS Operating Mode
              </label>
              <select
                value={operatingMode}
                onChange={(e) => setOperatingMode(e.target.value as BAASOperatingMode)}
                className="w-full rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282]"
              >
                <option value="Performance">Performance</option>
                <option value="Balanced">Balanced</option>
                <option value="PowerSaving">Power Saving</option>
              </select>
            </div>
          )}
          <div className="flex items-end">
            <p className="text-xs text-[#596D5F]">
              Workload: <span className="font-medium text-[#26352B]">{processes.length} processes</span>
              {' · '}
              Battery:{' '}
              <span className="font-medium text-[#26352B]">
                {batteryConfig.initialPercentage}%
                {batteryConfig.externalPowerConnected ? ' (AC)' : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRun}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#84A282] px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-[#698767]"
          >
            <Play className="h-4 w-4" /> Run Simulation
          </button>
          {lastResult && (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-4 py-2.5 text-sm font-medium text-[#26352B] hover:bg-[#FAF6EE]"
              >
                <Save className="h-4 w-4 text-[#84A282]" /> Save to History
              </button>
              <button
                type="button"
                onClick={() => exportSchedulingResultsCSV(lastResult)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE7DD] bg-white px-4 py-2.5 text-sm font-medium text-[#26352B] hover:bg-[#FEFAF3]"
              >
                <Download className="h-4 w-4 text-[#84A282]" /> Export CSV
              </button>
            </>
          )}
          {savedMsg && (
            <Badge variant="sage" size="sm">
              Saved to history
            </Badge>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>

      {lastResult && metrics && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{ALGORITHM_NAMES[lastResult.algorithm]}</Badge>
            {lastResult.operatingMode && (
              <Badge variant="sage">Mode: {lastResult.operatingMode}</Badge>
            )}
            {lastResult.timeQuantum != null && (
              <Badge variant="ivory">Quantum: {lastResult.timeQuantum}s</Badge>
            )}
            {lastResult.batteryExhausted && <Badge variant="danger">Battery Exhausted</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
            <MetricCard title="Avg Waiting" value={metrics.avgWaitingTime.toFixed(2)} unit="s" />
            <MetricCard
              title="Avg Turnaround"
              value={metrics.avgTurnaroundTime.toFixed(2)}
              unit="s"
            />
            <MetricCard title="Avg Response" value={metrics.avgResponseTime.toFixed(2)} unit="s" />
            <MetricCard title="Makespan" value={metrics.makespan.toFixed(1)} unit="s" />
            <MetricCard
              title="CPU Utilization"
              value={metrics.cpuUtilization.toFixed(1)}
              unit="%"
            />
            <MetricCard
              title="Energy / Battery"
              value={formatEnergy(metrics.totalEnergyWh)}
              subtitle={`${formatPercentage(metrics.finalBatteryPercentage)} remaining`}
              variant="pink"
            />
          </div>

          <GanttChart blocks={lastResult.ganttBlocks} />

          {/* Process metrics table */}
          <div className="overflow-hidden rounded-xl border border-[#DFE7DD] bg-white shadow-soft">
            <div className="border-b border-[#DFE7DD] bg-[#FEFAF3] px-5 py-3">
              <h3 className="text-sm font-semibold text-[#26352B]">Per-Process Metrics</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-[#DFE7DD] text-xs uppercase tracking-wider text-[#596D5F]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Process</th>
                    <th className="px-4 py-2.5 font-semibold">Arrival</th>
                    <th className="px-4 py-2.5 font-semibold">Burst</th>
                    <th className="px-4 py-2.5 font-semibold">Completion</th>
                    <th className="px-4 py-2.5 font-semibold">TAT</th>
                    <th className="px-4 py-2.5 font-semibold">Waiting</th>
                    <th className="px-4 py-2.5 font-semibold">Response</th>
                    <th className="px-4 py-2.5 font-semibold">Energy</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lastResult.processMetrics.map((pm) => (
                    <tr key={pm.processId} className="border-t border-[#DFE7DD]/70">
                      <td className="px-4 py-2.5 font-medium text-[#26352B]">
                        {pm.processId} · {pm.processName}
                      </td>
                      <td className="px-4 py-2.5 font-mono">{pm.arrivalTime}</td>
                      <td className="px-4 py-2.5 font-mono">{pm.burstTime}</td>
                      <td className="px-4 py-2.5 font-mono">{pm.completionTime.toFixed(1)}</td>
                      <td className="px-4 py-2.5 font-mono">{pm.turnaroundTime.toFixed(1)}</td>
                      <td className="px-4 py-2.5 font-mono">{pm.waitingTime.toFixed(1)}</td>
                      <td className="px-4 py-2.5 font-mono">{pm.responseTime.toFixed(1)}</td>
                      <td className="px-4 py-2.5 font-mono">{formatEnergy(pm.energyConsumedWh)}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={pm.completed ? 'sage' : 'danger'} size="sm">
                          {pm.completed ? 'Done' : 'Incomplete'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Event log */}
          <div className="rounded-xl border border-[#DFE7DD] bg-white shadow-soft">
            <div className="flex items-center gap-2 border-b border-[#DFE7DD] bg-[#FEFAF3] px-5 py-3">
              <ScrollText className="h-4 w-4 text-[#84A282]" />
              <h3 className="text-sm font-semibold text-[#26352B]">Event Log</h3>
              <span className="text-xs text-[#596D5F]">({lastResult.eventLogs.length} events)</span>
            </div>
            <div className="max-h-56 overflow-y-auto font-mono text-xs">
              {lastResult.eventLogs.map((ev) => (
                <div
                  key={ev.id}
                  className="flex gap-3 border-t border-[#DFE7DD]/50 px-5 py-1.5 hover:bg-[#FEFAF3]/50"
                >
                  <span className="w-14 shrink-0 text-[#84A282]">{formatTime(ev.time)}</span>
                  <span className="w-24 shrink-0 font-semibold text-[#26352B]">{ev.type}</span>
                  <span className="text-[#596D5F]">{ev.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BAAS decisions */}
          {lastResult.decisions.length > 0 && (
            <div className="rounded-xl border border-[#DFE7DD] bg-white shadow-soft">
              <div className="border-b border-[#DFE7DD] bg-[#FEFAF3] px-5 py-3">
                <h3 className="text-sm font-semibold text-[#26352B]">
                  BAAS Scheduling Decisions
                </h3>
              </div>
              <div className="max-h-64 space-y-3 overflow-y-auto p-5">
                {lastResult.decisions.map((d, i) => (
                  <div
                    key={`${d.time}-${i}`}
                    className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="ivory" size="sm">
                        t={d.time.toFixed(1)}s
                      </Badge>
                      <Badge variant="sage" size="sm">
                        {d.operatingMode}
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        Battery {d.batteryLevel.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-[#26352B]">{d.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!lastResult && (
        <div className="rounded-xl border border-dashed border-[#DFE7DD] bg-white px-6 py-16 text-center shadow-soft">
          <p className="text-sm text-[#596D5F]">
            Configure an algorithm and click <strong className="text-[#26352B]">Run Simulation</strong>{' '}
            to generate metrics, Gantt chart, and event logs.
          </p>
        </div>
      )}
    </div>
  );
};
