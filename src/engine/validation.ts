import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateProcess(process: Partial<Process>, existingProcesses: Process[] = [], isEditingId?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // ID validation
  if (!process.id || !process.id.trim()) {
    errors.push({ field: 'id', message: 'Process ID is required (e.g. P1).' });
  } else {
    const trimmedId = process.id.trim().toUpperCase();
    const isDuplicate = existingProcesses.some(
      (p) => p.id.toUpperCase() === trimmedId && (!isEditingId || p.id.toUpperCase() !== isEditingId.toUpperCase())
    );
    if (isDuplicate) {
      errors.push({ field: 'id', message: `Process ID "${trimmedId}" already exists. Each process ID must be unique.` });
    }
  }

  // Name validation
  if (!process.name || !process.name.trim()) {
    errors.push({ field: 'name', message: 'Process name is required.' });
  }

  // Arrival time validation
  if (process.arrivalTime === undefined || process.arrivalTime === null || isNaN(process.arrivalTime)) {
    errors.push({ field: 'arrivalTime', message: 'Arrival time is required.' });
  } else if (process.arrivalTime < 0) {
    errors.push({ field: 'arrivalTime', message: 'Arrival time cannot be negative (must be >= 0).' });
  }

  // Burst time validation
  if (process.burstTime === undefined || process.burstTime === null || isNaN(process.burstTime)) {
    errors.push({ field: 'burstTime', message: 'CPU burst time is required.' });
  } else if (process.burstTime <= 0) {
    errors.push({ field: 'burstTime', message: 'Burst time must be positive (> 0).' });
  }

  // Priority validation
  if (process.priority === undefined || process.priority === null || isNaN(process.priority)) {
    errors.push({ field: 'priority', message: 'Priority is required.' });
  } else if (process.priority < 1 || !Number.isInteger(process.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be a positive integer (e.g. 1, 2, 3... lower = higher priority).' });
  }

  // Power demand validation
  if (process.powerDemand === undefined || process.powerDemand === null || isNaN(process.powerDemand)) {
    errors.push({ field: 'powerDemand', message: 'Power demand is required.' });
  } else if (process.powerDemand <= 0) {
    errors.push({ field: 'powerDemand', message: 'Active power demand must be greater than 0 Watts.' });
  }

  // Deadline validation (optional)
  if (process.deadline !== undefined && process.deadline !== null && process.deadline !== 0) {
    if (process.deadline < 0) {
      errors.push({ field: 'deadline', message: 'Deadline cannot be negative.' });
    } else if (process.arrivalTime !== undefined && process.deadline < process.arrivalTime) {
      errors.push({ field: 'deadline', message: 'Deadline cannot be earlier than process arrival time.' });
    }
  }

  return errors;
}

export function validateBatteryConfig(config: Partial<BatteryConfig>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (config.capacityWh === undefined || isNaN(config.capacityWh) || config.capacityWh <= 0) {
    errors.push({ field: 'capacityWh', message: 'Battery capacity must be greater than 0 Wh.' });
  }

  if (
    config.initialPercentage === undefined ||
    isNaN(config.initialPercentage) ||
    config.initialPercentage < 0 ||
    config.initialPercentage > 100
  ) {
    errors.push({ field: 'initialPercentage', message: 'Initial battery percentage must be between 0% and 100%.' });
  }

  if (config.idlePowerWatts === undefined || isNaN(config.idlePowerWatts) || config.idlePowerWatts < 0) {
    errors.push({ field: 'idlePowerWatts', message: 'Idle power must be non-negative (>= 0 W).' });
  }

  if (
    config.powerSavingMultiplier !== undefined &&
    (config.powerSavingMultiplier <= 0 || config.powerSavingMultiplier > 1.5)
  ) {
    errors.push({ field: 'powerSavingMultiplier', message: 'Power-saving multiplier must be between 0.1 and 1.5.' });
  }

  return errors;
}
