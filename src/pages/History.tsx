import React, { useState } from 'react';
import { Trash2, RotateCcw, Download, Eye, Eraser } from 'lucide-react';
import type { SavedExperiment } from '../types/history';
import type { SimulationResult } from '../types/scheduling';
import type { Process } from '../types/process';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { GanttChart } from '../components/charts/GanttChart';
import { Modal } from '../components/common/Modal';
import {
  exportSchedulingResultsCSV,
  exportExperimentJSON,
} from '../utils/exportUtils';
import { formatEnergy, formatPercentage, formatTime } from '../utils/formatters';

interface HistoryProps {
  experiments: SavedExperiment[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onReload: (experiment: SavedExperiment) => void;
  onSetResult: (result: SimulationResult) => void;
}

export const History: React.FC<HistoryProps> = ({
  experiments,
  onDelete,
  onClearAll,
  onReload,
  onSetResult,
}) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [preview, setPreview] = useState<SavedExperiment | null>(null);

  const handleExportAllCSV = () => {
    if (experiments.length === 0) return;
    const headers = [
      'Experiment Name',
      'Timestamp',
      'Algorithm',
      'Workload',
      'Processes',
      'Avg Waiting (s)',
      'Avg Turnaround (s)',
      'Avg Response (s)',
      'Energy (Wh)',
      'Final Battery (%)',
      'Makespan (s)',
    ];
    const rows = experiments.map((e) => {
      const m = e.result.aggregateMetrics;
      return [
        `"${e.name.replace(/"/g, '""')}"`,
        e.dateFormatted,
        e.result.algorithm,
        `"${e.workloadName.replace(/"/g, '""')}"`,
        e.processes.length,
        m.avgWaitingTime.toFixed(2),
        m.avgTurnaroundTime.toFixed(2),
        m.avgResponseTime.toFixed(2),
        m.totalEnergyWh.toFixed(4),
        m.finalBatteryPercentage.toFixed(1),
        m.makespan.toFixed(2),
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'poweros_simulation_history.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-[#DFE7DD] bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#26352B]">Saved Experiments</h2>
          <p className="mt-0.5 text-xs text-[#596D5F]">
            {experiments.length} experiment{experiments.length === 1 ? '' : 's'} stored locally
            (max 50)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportAllCSV}
            disabled={experiments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3.5 py-2 text-sm font-medium text-[#26352B] hover:bg-[#FAF6EE] disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-[#84A282]" /> Export All CSV
          </button>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            disabled={experiments.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <Eraser className="h-4 w-4" /> Clear History
          </button>
        </div>
      </div>

      {experiments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DFE7DD] bg-white px-6 py-16 text-center shadow-soft">
          <p className="text-sm text-[#596D5F]">
            No saved simulations yet. Run the simulator and click{' '}
            <strong className="text-[#26352B]">Save to History</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp) => {
            const m = exp.result.aggregateMetrics;
            return (
              <div
                key={exp.id}
                className="rounded-xl border border-[#DFE7DD] bg-white p-4 shadow-soft sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#26352B]">{exp.name}</h3>
                      <Badge variant="muted" size="sm">
                        {exp.result.algorithm}
                      </Badge>
                      {exp.result.operatingMode && (
                        <Badge variant="sage" size="sm">
                          {exp.result.operatingMode}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#596D5F]">
                      {exp.dateFormatted} · {exp.workloadName} · {exp.processes.length} processes
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#26352B]">
                      <span>
                        Wait <strong>{m.avgWaitingTime.toFixed(2)}s</strong>
                      </span>
                      <span>
                        TAT <strong>{m.avgTurnaroundTime.toFixed(2)}s</strong>
                      </span>
                      <span>
                        Energy <strong>{formatEnergy(m.totalEnergyWh)}</strong>
                      </span>
                      <span>
                        Battery <strong>{formatPercentage(m.finalBatteryPercentage)}</strong>
                      </span>
                      <span>
                        Makespan <strong>{formatTime(m.makespan)}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreview(exp)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DFE7DD] px-2.5 py-1.5 text-xs font-medium text-[#26352B] hover:bg-[#FEFAF3]"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#84A282]" /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onReload(exp);
                        onSetResult(exp.result);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DFE7DD] px-2.5 py-1.5 text-xs font-medium text-[#26352B] hover:bg-[#FEFAF3]"
                      title="Reload processes and result"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-[#84A282]" /> Reload
                    </button>
                    <button
                      type="button"
                      onClick={() => exportSchedulingResultsCSV(exp.result)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DFE7DD] px-2.5 py-1.5 text-xs font-medium text-[#26352B] hover:bg-[#FEFAF3]"
                    >
                      <Download className="h-3.5 w-3.5 text-[#84A282]" /> CSV
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        exportExperimentJSON(exp, `poweros_${exp.result.algorithm}_${exp.id}.json`)
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DFE7DD] px-2.5 py-1.5 text-xs font-medium text-[#26352B] hover:bg-[#FEFAF3]"
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(exp.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
          setDeleteId(null);
        }}
        title="Delete Experiment"
        message="Remove this saved simulation from history? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={onClearAll}
        title="Clear All History"
        message="Delete every saved experiment from local storage?"
        confirmLabel="Clear All"
        variant="danger"
      />

      <Modal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name || 'Experiment Preview'}
        subtitle={preview ? `${preview.result.algorithmName} · ${preview.dateFormatted}` : undefined}
        maxWidth="4xl"
      >
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                <p className="text-[10px] uppercase text-[#596D5F]">Waiting</p>
                <p className="font-semibold text-[#26352B]">
                  {preview.result.aggregateMetrics.avgWaitingTime.toFixed(2)}s
                </p>
              </div>
              <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                <p className="text-[10px] uppercase text-[#596D5F]">Turnaround</p>
                <p className="font-semibold text-[#26352B]">
                  {preview.result.aggregateMetrics.avgTurnaroundTime.toFixed(2)}s
                </p>
              </div>
              <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                <p className="text-[10px] uppercase text-[#596D5F]">Energy</p>
                <p className="font-semibold text-[#26352B]">
                  {formatEnergy(preview.result.aggregateMetrics.totalEnergyWh)}
                </p>
              </div>
              <div className="rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3">
                <p className="text-[10px] uppercase text-[#596D5F]">Battery</p>
                <p className="font-semibold text-[#26352B]">
                  {formatPercentage(preview.result.aggregateMetrics.finalBatteryPercentage)}
                </p>
              </div>
            </div>
            <GanttChart blocks={preview.result.ganttBlocks} />
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#596D5F]">
                Workload Processes
              </h4>
              <ul className="space-y-1 text-xs text-[#26352B]">
                {preview.processes.map((p: Process) => (
                  <li key={p.id}>
                    {p.id} · {p.name} — arrival {p.arrivalTime}s, burst {p.burstTime}s,{' '}
                    {p.powerDemand} W
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
