import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Process, ProcessCategory } from '../../types/process';
import { validateProcess } from '../../engine/validation';

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (process: Process) => void;
  initialProcess?: Process | null;
  existingProcesses: Process[];
}

export const ProcessModal: React.FC<ProcessModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProcess,
  existingProcesses,
}) => {
  const [formData, setFormData] = useState<Partial<Process>>({
    id: '',
    name: '',
    arrivalTime: 0,
    burstTime: 4,
    priority: 1,
    powerDemand: 25,
    deadline: 15,
    category: 'Interactive',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialProcess) {
      setFormData(initialProcess);
    } else {
      // Suggest next PID
      const nextNum = existingProcesses.length + 1;
      setFormData({
        id: `P${nextNum}`,
        name: `Process ${nextNum}`,
        arrivalTime: 0,
        burstTime: 4,
        priority: 2,
        powerDemand: 25,
        deadline: 20,
        category: 'Interactive',
      });
    }
    setErrors({});
  }, [initialProcess, isOpen, existingProcesses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateProcess(
      formData,
      existingProcesses,
      initialProcess ? initialProcess.id : undefined
    );

    if (validationErrors.length > 0) {
      const errMap: Record<string, string> = {};
      validationErrors.forEach((err) => {
        errMap[err.field] = err.message;
      });
      setErrors(errMap);
      return;
    }

    onSave({
      id: formData.id!.trim().toUpperCase(),
      name: formData.name!.trim(),
      arrivalTime: Number(formData.arrivalTime),
      burstTime: Number(formData.burstTime),
      priority: Number(formData.priority),
      powerDemand: Number(formData.powerDemand),
      deadline: formData.deadline ? Number(formData.deadline) : undefined,
      category: (formData.category as ProcessCategory) || 'Interactive',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProcess ? `Edit Process ${initialProcess.id}` : 'Create New Process'}
      subtitle="Define execution parameters, CPU power demand, and priority"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: ID & Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#26352B] mb-1">
              Process ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.id || ''}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="e.g. P1"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282] transition-colors ${
                errors.id ? 'border-rose-400' : 'border-[#DFE7DD]'
              }`}
            />
            {errors.id && <p className="text-[11px] text-rose-600 mt-1">{errors.id}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#26352B] mb-1">
              Process Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Video Transcoder"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282] transition-colors ${
                errors.name ? 'border-rose-400' : 'border-[#DFE7DD]'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Row 2: Arrival Time & Burst Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#26352B] mb-1">
              Arrival Time (s) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.arrivalTime ?? ''}
              onChange={(e) => setFormData({ ...formData, arrivalTime: Number(e.target.value) })}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282] transition-colors ${
                errors.arrivalTime ? 'border-rose-400' : 'border-[#DFE7DD]'
              }`}
            />
            {errors.arrivalTime && <p className="text-[11px] text-rose-600 mt-1">{errors.arrivalTime}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26352B] mb-1">
              CPU Burst Time (s) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.burstTime ?? ''}
              onChange={(e) => setFormData({ ...formData, burstTime: Number(e.target.value) })}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282] transition-colors ${
                errors.burstTime ? 'border-rose-400' : 'border-[#DFE7DD]'
              }`}
            />
            {errors.burstTime && <p className="text-[11px] text-rose-600 mt-1">{errors.burstTime}</p>}
          </div>
        </div>

        {/* Row 3: Priority & Power Demand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#26352B]">
                Priority (Lower = Higher) <span className="text-rose-500">*</span>
              </label>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.priority ?? ''}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              placeholder="1, 2, 3..."
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282] transition-colors ${
                errors.priority ? 'border-rose-400' : 'border-[#DFE7DD]'
              }`}
            />
            <p className="text-[11px] text-[#596D5F] mt-1">
              1 is highest priority; 5+ is lower priority
            </p>
            {errors.priority && <p className="text-[11px] text-rose-600 mt-1">{errors.priority}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26352B] mb-1">
              Active Power Demand (Watts) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={formData.powerDemand ?? ''}
              onChange={(e) => setFormData({ ...formData, powerDemand: Number(e.target.value) })}
              placeholder="e.g. 25"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282] transition-colors ${
                errors.powerDemand ? 'border-rose-400' : 'border-[#DFE7DD]'
              }`}
            />
            <p className="text-[11px] text-[#596D5F] mt-1">
              Active CPU load power (TDP)
            </p>
            {errors.powerDemand && <p className="text-[11px] text-rose-600 mt-1">{errors.powerDemand}</p>}
          </div>
        </div>

        {/* Row 4: Category & Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#26352B] mb-1">
              Process Category
            </label>
            <select
              value={formData.category || 'Interactive'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ProcessCategory })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282]"
            >
              <option value="Interactive">Interactive (UI / Low Latency)</option>
              <option value="CPU-bound">CPU-bound (Heavy Math / Compute)</option>
              <option value="I/O-bound">I/O-bound (Network / Disk Sync)</option>
              <option value="Background">Background (Batch Daemon)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26352B] mb-1">
              Optional Deadline (s)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.deadline ?? ''}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Optional target time"
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-[#FEFAF3] focus:outline-hidden focus:ring-2 focus:ring-[#84A282] ${
                errors.deadline ? 'border-rose-400' : 'border-[#DFE7DD]'
              }`}
            />
            {errors.deadline && <p className="text-[11px] text-rose-600 mt-1">{errors.deadline}</p>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFE7DD]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[#596D5F] hover:bg-[#FEFAF3] border border-[#DFE7DD] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg text-sm font-medium bg-[#84A282] hover:bg-[#698767] text-white transition-colors shadow-xs"
          >
            {initialProcess ? 'Save Changes' : 'Add Process'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
