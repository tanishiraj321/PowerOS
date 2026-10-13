import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Play, Download, Award } from 'lucide-react';
import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';
import type { BAASOperatingMode } from '../types/scheduling';
import {
  runAllComparisons,
  type ComparisonReport,
} from '../engine/comparisonEngine';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { GanttChart } from '../components/charts/GanttChart';
import { exportComparisonCSV } from '../utils/exportUtils';
import { formatEnergy } from '../utils/formatters';

interface ComparisonProps {
  processes: Process[];
  batteryConfig: BatteryConfig;
}

export const Comparison: React.FC<ComparisonProps> = ({ processes, batteryConfig }) => {
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [baasMode, setBaasMode] = useState<BAASOperatingMode>('Balanced');
  const [selectedAlgo, setSelectedAlgo] = useState<keyof ComparisonReport['results'] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    setError(null);
    if (processes.length === 0) {
      setError('Add at least one process before comparing algorithms.');
      return;
    }
    const result = runAllComparisons(
      processes,
      batteryConfig,
      timeQuantum,
      baasMode,
      undefined,
      'Comparison Workload'
    );
    setReport(result);
    setSelectedAlgo('BAAS');
  };

  const chartData =
    report?.comparisonTableData.map((d) => ({
      name: d.algorithm,
      waiting: Number(d.avgWaitingTime.toFixed(2)),
      turnaround: Number(d.avgTurnaroundTime.toFixed(2)),
      response: Number(d.avgResponseTime.toFixed(2)),
      energy: Number(d.totalEnergyWh.toFixed(4)),
      battery: Number(d.finalBatteryPercentage.toFixed(1)),
    })) ?? [];

  const tooltipStyle = {
    backgroundColor: '#FEFAF3',
    border: '1px solid #DFE7DD',
    borderRadius: '8px',
    fontSize: '12px',
  };

  const selectedResult = report && selectedAlgo ? report.results[selectedAlgo] : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
        <h2 className="mb-4 text-sm font-semibold text-[#26352B]">
          Benchmark All Scheduling Algorithms
        </h2>
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#26352B]">
              RR Time Quantum (s)
            </label>
            <input
              type="number"
              min={1}
              value={timeQuantum}
              onChange={(e) => setTimeQuantum(Math.max(1, Number(e.target.value) || 1))}
              className="w-32 rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#26352B]">
              BAAS Mode
            </label>
            <select
              value={baasMode}
              onChange={(e) => setBaasMode(e.target.value as BAASOperatingMode)}
              className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282]"
            >
              <option value="Performance">Performance</option>
              <option value="Balanced">Balanced</option>
              <option value="PowerSaving">Power Saving</option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleRun}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#84A282] px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-[#698767]"
          >
            <Play className="h-4 w-4" /> Run Comparison
          </button>
          {report && (
            <button
              type="button"
              onClick={() => exportComparisonCSV(report)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-4 py-2.5 text-sm font-medium text-[#26352B] hover:bg-[#FAF6EE]"
            >
              <Download className="h-4 w-4 text-[#84A282]" /> Export CSV
            </button>
          )}
        </div>
        <p className="text-xs text-[#596D5F]">
          Runs FCFS, SJF, Round Robin, Priority, and BAAS on the current workload (
          {processes.length} processes) with identical battery settings.
        </p>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>

      {report && (
        <>
          {/* Recommendations */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {report.recommendations.map((rec) => (
              <div
                key={rec.category}
                className="rounded-xl border border-[#DFE7DD] bg-white p-4 shadow-soft"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#84A282]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#596D5F]">
                    {rec.category}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#26352B]">{rec.algorithm}</p>
                <p className="mt-1 text-lg font-semibold text-[#84A282]">{rec.metricValue}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#596D5F]">{rec.explanation}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
              <h3 className="mb-4 text-sm font-semibold text-[#26352B]">
                Timing Metrics Comparison
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DFE7DD" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#596D5F' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#596D5F' }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="waiting" name="Avg Waiting (s)" fill="#84A282" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="turnaround" name="Avg TAT (s)" fill="#B8CFB3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="response" name="Avg Response (s)" fill="#D4A5B3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
              <h3 className="mb-4 text-sm font-semibold text-[#26352B]">
                Energy & Remaining Battery
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DFE7DD" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#596D5F' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#596D5F' }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#596D5F' }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="energy"
                      name="Energy (Wh)"
                      fill="#84A282"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="battery"
                      name="Final Battery %"
                      fill="#F6E2E9"
                      stroke="#D4A5B3"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div className="overflow-hidden rounded-xl border border-[#DFE7DD] bg-white shadow-soft">
            <div className="border-b border-[#DFE7DD] bg-[#FEFAF3] px-5 py-3">
              <h3 className="text-sm font-semibold text-[#26352B]">Full Metrics Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-[#DFE7DD] text-xs uppercase tracking-wider text-[#596D5F]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Algorithm</th>
                    <th className="px-4 py-2.5 font-semibold">Waiting</th>
                    <th className="px-4 py-2.5 font-semibold">Turnaround</th>
                    <th className="px-4 py-2.5 font-semibold">Response</th>
                    <th className="px-4 py-2.5 font-semibold">CPU %</th>
                    <th className="px-4 py-2.5 font-semibold">Makespan</th>
                    <th className="px-4 py-2.5 font-semibold">Energy</th>
                    <th className="px-4 py-2.5 font-semibold">Battery</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.comparisonTableData.map((row) => (
                    <tr
                      key={row.algorithm}
                      className={`cursor-pointer border-t border-[#DFE7DD]/70 hover:bg-[#FEFAF3] ${
                        selectedAlgo === row.algorithm ? 'bg-[#B8CFB3]/15' : ''
                      }`}
                      onClick={() => setSelectedAlgo(row.algorithm)}
                    >
                      <td className="px-4 py-2.5 font-medium text-[#26352B]">{row.algorithm}</td>
                      <td className="px-4 py-2.5 font-mono">{row.avgWaitingTime.toFixed(2)}s</td>
                      <td className="px-4 py-2.5 font-mono">{row.avgTurnaroundTime.toFixed(2)}s</td>
                      <td className="px-4 py-2.5 font-mono">{row.avgResponseTime.toFixed(2)}s</td>
                      <td className="px-4 py-2.5 font-mono">{row.cpuUtilization.toFixed(1)}%</td>
                      <td className="px-4 py-2.5 font-mono">{row.makespan.toFixed(1)}s</td>
                      <td className="px-4 py-2.5 font-mono">{formatEnergy(row.totalEnergyWh)}</td>
                      <td className="px-4 py-2.5 font-mono">
                        {row.finalBatteryPercentage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={row.isExhausted ? 'danger' : 'sage'} size="sm">
                          {row.isExhausted ? 'Exhausted' : 'OK'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#26352B]">
                  Gantt Preview — {selectedResult.algorithm}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(report.results) as Array<keyof typeof report.results>).map(
                    (algo) => (
                      <button
                        key={algo}
                        type="button"
                        onClick={() => setSelectedAlgo(algo)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selectedAlgo === algo
                            ? 'border-[#84A282] bg-[#84A282] text-white'
                            : 'border-[#DFE7DD] bg-white text-[#26352B] hover:bg-[#FEFAF3]'
                        }`}
                      >
                        {algo}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  title="Waiting"
                  value={selectedResult.aggregateMetrics.avgWaitingTime.toFixed(2)}
                  unit="s"
                />
                <MetricCard
                  title="Turnaround"
                  value={selectedResult.aggregateMetrics.avgTurnaroundTime.toFixed(2)}
                  unit="s"
                />
                <MetricCard
                  title="Energy"
                  value={formatEnergy(selectedResult.aggregateMetrics.totalEnergyWh)}
                />
                <MetricCard
                  title="Battery"
                  value={`${selectedResult.aggregateMetrics.finalBatteryPercentage.toFixed(1)}%`}
                />
              </div>
              <GanttChart blocks={selectedResult.ganttBlocks} />
            </div>
          )}
        </>
      )}

      {!report && !error && (
        <div className="rounded-xl border border-dashed border-[#DFE7DD] bg-white px-6 py-16 text-center shadow-soft">
          <p className="text-sm text-[#596D5F]">
            Click <strong className="text-[#26352B]">Run Comparison</strong> to benchmark all five
            algorithms on the current workload.
          </p>
        </div>
      )}
    </div>
  );
};
