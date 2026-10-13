import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Download, RotateCcw, Layers } from 'lucide-react';
import type { Process } from '../types/process';
import { WORKLOAD_PRESETS, DEFAULT_PROCESSES } from '../data/presets';
import { ProcessModal } from '../components/processManager/ProcessModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { exportProcessesCSV } from '../utils/exportUtils';
import { getProcessColor } from '../utils/colors';

interface ProcessManagerProps {
  processes: Process[];
  onUpdateProcesses: (processes: Process[]) => void;
}

export const ProcessManager: React.FC<ProcessManagerProps> = ({
  processes,
  onUpdateProcesses,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Process | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Process | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);

  const handleSave = (process: Process) => {
    if (editing) {
      onUpdateProcesses(processes.map((p) => (p.id === editing.id ? process : p)));
    } else {
      onUpdateProcesses([...processes, process]);
    }
    setEditing(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      onUpdateProcesses(processes.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  const loadPreset = (presetId: string) => {
    const preset = WORKLOAD_PRESETS.find((w) => w.id === presetId);
    if (preset) {
      onUpdateProcesses(preset.processes.map((p) => ({ ...p })));
    }
  };

  const categoryVariant = (
    cat: Process['category']
  ): 'sage' | 'muted' | 'pink' | 'ivory' | 'neutral' => {
    switch (cat) {
      case 'CPU-bound':
        return 'muted';
      case 'Interactive':
        return 'sage';
      case 'I/O-bound':
        return 'pink';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#DFE7DD] bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#26352B]">Workload Processes</h2>
          <p className="mt-0.5 text-xs text-[#596D5F]">
            {processes.length} process{processes.length === 1 ? '' : 'es'} in the ready workload
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#84A282] px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:bg-[#698767]"
          >
            <Plus className="h-4 w-4" /> Add Process
          </button>
          <button
            type="button"
            onClick={() => exportProcessesCSV(processes)}
            disabled={processes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3.5 py-2 text-sm font-medium text-[#26352B] hover:bg-[#FAF6EE] disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-[#84A282]" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => onUpdateProcesses(DEFAULT_PROCESSES.map((p) => ({ ...p })))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE7DD] bg-white px-3.5 py-2 text-sm font-medium text-[#596D5F] hover:bg-[#FEFAF3]"
          >
            <RotateCcw className="h-4 w-4" /> Reset Default
          </button>
          <button
            type="button"
            onClick={() => setClearAllOpen(true)}
            disabled={processes.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Clear All
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {WORKLOAD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => loadPreset(preset.id)}
            className="rounded-xl border border-[#DFE7DD] bg-white p-4 text-left shadow-soft transition-colors hover:border-[#84A282]/50 hover:bg-[#FEFAF3]"
          >
            <div className="mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#84A282]" />
              <span className="text-sm font-semibold text-[#26352B]">{preset.name}</span>
            </div>
            <p className="text-xs leading-relaxed text-[#596D5F]">{preset.description}</p>
            <p className="mt-2 text-[11px] font-medium text-[#84A282]">
              Load {preset.processes.length} processes →
            </p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#DFE7DD] bg-white shadow-soft">
        {processes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-[#596D5F]">No processes yet. Add one or load a preset.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#DFE7DD] bg-[#FEFAF3] text-xs uppercase tracking-wider text-[#596D5F]">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Arrival</th>
                  <th className="px-4 py-3 font-semibold">Burst</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Power</th>
                  <th className="px-4 py-3 font-semibold">Deadline</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p, idx) => (
                  <tr key={p.id} className="border-t border-[#DFE7DD]/70 hover:bg-[#FEFAF3]/60">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-[#26352B]">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: getProcessColor(p.id, idx) }}
                        />
                        {p.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#26352B]">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-[#26352B]">{p.arrivalTime}s</td>
                    <td className="px-4 py-3 font-mono text-[#26352B]">{p.burstTime}s</td>
                    <td className="px-4 py-3 font-mono text-[#26352B]">{p.priority}</td>
                    <td className="px-4 py-3 font-mono text-[#26352B]">{p.powerDemand} W</td>
                    <td className="px-4 py-3 font-mono text-[#596D5F]">
                      {p.deadline != null ? `${p.deadline}s` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={categoryVariant(p.category)} size="sm">
                        {p.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(p);
                            setModalOpen(true);
                          }}
                          className="rounded-lg p-2 text-[#596D5F] hover:bg-[#B8CFB3]/25 hover:text-[#26352B]"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="rounded-lg p-2 text-[#596D5F] hover:bg-rose-50 hover:text-rose-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProcessModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initialProcess={editing}
        existingProcesses={processes}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Process"
        message={`Remove process ${deleteTarget?.id} (${deleteTarget?.name}) from the workload?`}
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={() => onUpdateProcesses([])}
        title="Clear All Processes"
        message="This will remove every process from the current workload. You can reload a preset afterward."
        confirmLabel="Clear All"
        variant="danger"
      />
    </div>
  );
};
