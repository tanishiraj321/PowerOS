import React from 'react';
import { Printer } from 'lucide-react';
import { Modal } from '../common/Modal';
import { GanttChart } from '../charts/GanttChart';
import type { SimulationResult } from '../../types/scheduling';
import type { Process } from '../../types/process';
import type { BatteryConfig } from '../../types/battery';
import {
  formatDateTime,
  formatEnergy,
  formatPercentage,
  formatTime,
} from '../../utils/formatters';

interface AcademicReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastResult: SimulationResult | null;
  processes: Process[];
  batteryConfig: BatteryConfig;
}

export const AcademicReportModal: React.FC<AcademicReportModalProps> = ({
  isOpen,
  onClose,
  lastResult,
  processes,
  batteryConfig,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Academic Evaluation Report"
      subtitle="Printable summary of the latest simulation experiment"
      maxWidth="4xl"
    >
      {!lastResult ? (
        <p className="py-8 text-center text-sm text-[#596D5F]">
          Run a simulation first to generate an academic report.
        </p>
      ) : (
        <div className="space-y-5">
          <div className="no-print flex justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#84A282] px-4 py-2 text-sm font-medium text-white hover:bg-[#698767]"
            >
              <Printer className="h-4 w-4" /> Print Report
            </button>
          </div>

          <div className="print-card space-y-4 rounded-xl border border-[#DFE7DD] bg-[#FEFAF3] p-5">
            <div>
              <h2 className="text-lg font-bold text-[#26352B]">
                PowerOS — Simulation Report
              </h2>
              <p className="text-xs text-[#596D5F]">
                Generated {formatDateTime(new Date().toISOString())}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-[#596D5F]">Algorithm</p>
                <p className="font-semibold text-[#26352B]">{lastResult.algorithmName}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-[#596D5F]">Executed At</p>
                <p className="font-semibold text-[#26352B]">
                  {formatDateTime(lastResult.executedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-[#596D5F]">Workload</p>
                <p className="font-semibold text-[#26352B]">
                  {lastResult.workloadName || 'Custom'} ({processes.length} processes)
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-[#596D5F]">Battery Config</p>
                <p className="font-semibold text-[#26352B]">
                  {batteryConfig.capacityWh} Wh · {batteryConfig.initialPercentage}% start ·{' '}
                  {batteryConfig.externalPowerConnected ? 'AC' : 'Battery'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat
                label="Avg Waiting Time"
                value={`${lastResult.aggregateMetrics.avgWaitingTime.toFixed(2)} s`}
              />
              <Stat
                label="Avg Turnaround"
                value={`${lastResult.aggregateMetrics.avgTurnaroundTime.toFixed(2)} s`}
              />
              <Stat
                label="Avg Response"
                value={`${lastResult.aggregateMetrics.avgResponseTime.toFixed(2)} s`}
              />
              <Stat
                label="Makespan"
                value={formatTime(lastResult.aggregateMetrics.makespan)}
              />
              <Stat
                label="CPU Utilization"
                value={`${lastResult.aggregateMetrics.cpuUtilization.toFixed(1)}%`}
              />
              <Stat
                label="Total Energy"
                value={formatEnergy(lastResult.aggregateMetrics.totalEnergyWh)}
              />
              <Stat
                label="Final Battery"
                value={formatPercentage(lastResult.aggregateMetrics.finalBatteryPercentage)}
              />
              <Stat
                label="Completed"
                value={`${lastResult.aggregateMetrics.completedCount}/${lastResult.aggregateMetrics.totalProcesses}`}
              />
              <Stat
                label="Exhausted"
                value={lastResult.batteryExhausted ? 'Yes' : 'No'}
              />
            </div>
          </div>

          <GanttChart blocks={lastResult.ganttBlocks} />

          <div className="overflow-hidden rounded-xl border border-[#DFE7DD]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FEFAF3] text-[#596D5F]">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">TAT</th>
                  <th className="px-3 py-2">Wait</th>
                  <th className="px-3 py-2">Response</th>
                  <th className="px-3 py-2">Energy</th>
                </tr>
              </thead>
              <tbody>
                {lastResult.processMetrics.map((pm) => (
                  <tr key={pm.processId} className="border-t border-[#DFE7DD]">
                    <td className="px-3 py-1.5 font-medium">{pm.processId}</td>
                    <td className="px-3 py-1.5">{pm.processName}</td>
                    <td className="px-3 py-1.5 font-mono">{pm.turnaroundTime.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-mono">{pm.waitingTime.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-mono">{pm.responseTime.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-mono">
                      {formatEnergy(pm.energyConsumedWh)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#DFE7DD] bg-white p-3">
      <p className="text-[10px] uppercase tracking-wider text-[#596D5F]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#26352B]">{value}</p>
    </div>
  );
}
