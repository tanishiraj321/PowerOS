import type { Process } from '../types/process';
import type { BatteryConfig } from '../types/battery';
import type { SavedExperiment } from '../types/history';
import { DEFAULT_PROCESSES } from '../data/presets';

const STORAGE_KEYS = {
  PROCESSES: 'poweros_processes',
  BATTERY_CONFIG: 'poweros_battery_config',
  EXPERIMENTS: 'poweros_experiments',
  LAST_RUN: 'poweros_last_simulation',
};

export const DEFAULT_BATTERY_CONFIG: BatteryConfig = {
  capacityWh: 50,
  initialPercentage: 100,
  idlePowerWatts: 5,
  externalPowerConnected: false,
  powerSavingMultiplier: 0.75, // 25% power reduction under throttled DVFS
  schedulingInterval: 2,
};

export function loadSavedProcesses(): Process[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROCESSES);
    if (!raw) return DEFAULT_PROCESSES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load processes from localStorage, using defaults', err);
  }
  return DEFAULT_PROCESSES;
}

export function saveProcesses(processes: Process[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROCESSES, JSON.stringify(processes));
  } catch (err) {
    console.error('Failed to save processes', err);
  }
}

export function loadBatteryConfig(): BatteryConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BATTERY_CONFIG);
    if (!raw) return DEFAULT_BATTERY_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_BATTERY_CONFIG, ...parsed };
  } catch (err) {
    console.warn('Failed to load battery config, using defaults', err);
  }
  return DEFAULT_BATTERY_CONFIG;
}

export function saveBatteryConfig(config: BatteryConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BATTERY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save battery config', err);
  }
}

export function loadExperiments(): SavedExperiment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPERIMENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && item.id && item.result);
    }
  } catch (err) {
    console.warn('Failed to parse saved experiments', err);
  }
  return [];
}

export function saveExperiment(experiment: SavedExperiment): void {
  try {
    const existing = loadExperiments();
    // Keep last 50 experiments
    const updated = [experiment, ...existing.filter((e) => e.id !== experiment.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.EXPERIMENTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save experiment to history', err);
  }
}

export function deleteExperiment(id: string): void {
  try {
    const existing = loadExperiments();
    const filtered = existing.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPERIMENTS, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete experiment', err);
  }
}

export function clearAllExperiments(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.EXPERIMENTS);
  } catch (err) {
    console.error('Failed to clear experiments', err);
  }
}
