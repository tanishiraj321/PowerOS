import React from 'react';
import {
  Battery,
  Cpu,
  Layers,
  Clock,
  Zap,
  ArrowRight,
  Activity,
  Gauge,
} from 'lucide-react';
import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';
import type { SimulationResult } from '../types/scheduling';
import type { NavPage } from '../components/layout/Sidebar';
import { MetricCard } from '../components/common/MetricCard';
import { BatteryGauge } from '../components/common/BatteryGauge';
import { Badge } from '../components/common/Badge';
import { GanttChart } from '../components/charts/GanttChart';
import {
  formatEnergy,
  formatPercentage,
  formatTime,
  formatDateTime,
} from '../utils/formatters';

interface DashboardProps {
  processes: Process[];
  batteryConfig: BatteryConfig;
  lastResult: SimulationResult | null;
  experimentCount: number;
  onNavigate: (page: NavPage) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  processes,
  batteryConfig,
  lastResult,
  experimentCount,
  onNavigate,
}) => {
  const metrics = lastResult?.aggregateMetrics;
  const remainingWh = metrics
    ? (metrics.finalBatteryPercentage / 100) * batteryConfig.capacityWh
    : (batteryConfig.initialPercentage / 100) * batteryConfig.capacityWh;

  const quickLinks: Array<{ page: NavPage; label: string; desc: string; icon: React.ReactNode }> = [
    {
      page: 'processes',
      label: 'Manage Processes',
      desc: 'Add or edit workload processes',
      icon: <Layers className="h-4 w-4" />,
    },
    {
      page: 'simulator',
      label: 'Run Simulator',
      desc: 'Execute FCFS, SJF, RR, Priority, BAAS',
      icon: <Cpu className="h-4 w-4" />,
    },
    {
      page: 'comparison',
      label: 'Compare Algorithms',
      desc: 'Benchmark waiting, TAT, energy',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      page: 'history',
      label: 'View History',
      desc: `${experimentCount} saved experiment${experimentCount === 1 ? '' : 's'}`,
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Processes"
          value={processes.length}
          subtitle="Active workload size"
          icon={<Layers className="h-4 w-4" />}
          variant="sage"
        />
        <MetricCard
          title="Battery Level"
          value={formatPercentage(
            metrics ? metrics.finalBatteryPercentage : batteryConfig.initialPercentage
          )}
          subtitle={
            batteryConfig.externalPowerConnected ? 'AC mains connected' : 'Running on battery'
          }
          icon={<Battery className="h-4 w-4" />}
          variant="accent"
        />
        <MetricCard
          title="Avg Waiting Time"
          value={metrics ? metrics.avgWaitingTime.toFixed(2) : '—'}
          unit={metrics ? 's' : undefined}
          subtitle={lastResult ? lastResult.algorithmName : 'No simulation yet'}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="Energy Consumed"
          value={metrics ? formatEnergy(metrics.totalEnergyWh) : '—'}
          subtitle={lastResult ? `Makespan ${formatTime(metrics!.makespan)}` : 'Run a simulation'}
          icon={<Zap className="h-4 w-4" />}
          variant="pink"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Battery panel */}
        <div className="space-y-4 lg:col-span-1">
          <BatteryGauge
            percentage={
              metrics ? metrics.finalBatteryPercentage : batteryConfig.initialPercentage
            }
            remainingWh={remainingWh}
            capacityWh={batteryConfig.capacityWh}
            isACConnected={batteryConfig.externalPowerConnected}
            isExhausted={metrics?.isExhausted ?? false}
          />

          <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold text-[#26352B]">System Snapshot</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[#596D5F]">Capacity</dt>
                <dd className="font-medium text-[#26352B]">{batteryConfig.capacityWh} Wh</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#596D5F]">Idle Power</dt>
                <dd className="font-medium text-[#26352B]">{batteryConfig.idlePowerWatts} W</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#596D5F]">DVFS Multiplier</dt>
                <dd className="font-medium text-[#26352B]">
                  {batteryConfig.powerSavingMultiplier.toFixed(2)}×
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#596D5F]">Saved Runs</dt>
                <dd className="font-medium text-[#26352B]">{experimentCount}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Last run + quick actions */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#26352B]">Last Simulation</h3>
              {lastResult && (
                <Badge variant="muted" size="sm">
                  {lastResult.algorithm}
                  {lastResult.operatingMode ? ` · ${lastResult.operatingMode}` : ''}
                </Badge>
              )}
            </div>

            {lastResult && metrics ? (
              <div className="space-y-4">
                <p className="text-xs text-[#596D5F]">
                  {lastResult.workloadName || 'Custom Workload'} ·{' '}
                  {formatDateTime(lastResult.executedAt)}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#596D5F]">Waiting</p>
                    <p className="mt-1 text-lg font-semibold text-[#26352B]">
                      {metrics.avgWaitingTime.toFixed(2)}s
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#596D5F]">Turnaround</p>
                    <p className="mt-1 text-lg font-semibold text-[#26352B]">
                      {metrics.avgTurnaroundTime.toFixed(2)}s
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#596D5F]">Response</p>
                    <p className="mt-1 text-lg font-semibold text-[#26352B]">
                      {metrics.avgResponseTime.toFixed(2)}s
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[#596D5F]">CPU Util.</p>
                    <p className="mt-1 text-lg font-semibold text-[#26352B]">
                      {metrics.cpuUtilization.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#84A282] hover:text-[#698767]"
                >
                  Open in Simulator <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 py-4">
                <div className="flex items-center gap-2 text-[#596D5F]">
                  <Gauge className="h-5 w-5 text-[#84A282]" />
                  <p className="text-sm">No simulation has been run yet.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="rounded-lg bg-[#84A282] px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-[#698767]"
                >
                  Launch Scheduling Simulator
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <button
                key={link.page}
                type="button"
                onClick={() => onNavigate(link.page)}
                className="flex items-start gap-3 rounded-xl border border-[#DFE7DD] bg-white p-4 text-left shadow-soft transition-colors hover:border-[#84A282]/50 hover:bg-[#FEFAF3]"
              >
                <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-2 text-[#84A282]">
                  {link.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#26352B]">{link.label}</p>
                  <p className="mt-0.5 text-xs text-[#596D5F]">{link.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {lastResult && lastResult.ganttBlocks.length > 0 && (
        <GanttChart blocks={lastResult.ganttBlocks} title="Last Run — Gantt Chart" />
      )}
    </div>
  );
};
