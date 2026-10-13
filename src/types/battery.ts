export interface BatteryConfig {
  capacityWh: number; // Battery capacity in Watt-hours
  initialPercentage: number; // Starting battery percentage (0-100)
  idlePowerWatts: number; // Base system idle power in Watts
  externalPowerConnected: boolean; // AC mains plugged in
  powerSavingMultiplier: number; // Dynamic voltage/frequency scaling multiplier (0.5 to 1.0)
  schedulingInterval: number; // Time slice interval for adaptive re-evaluation (seconds)
}

export interface BatteryState {
  time: number;
  batteryPercentage: number; // 0-100%
  remainingEnergyWh: number; // Watt-hours remaining
  cumulativeEnergyWh: number; // Total energy consumed since start
  currentPowerWatts: number; // Active + Idle power demand at this instant
  isExhausted: boolean; // True if battery reached 0% without AC
  externalPowerConnected: boolean;
}

export interface EnergyDataPoint {
  time: number;
  batteryPercentage: number;
  remainingEnergyWh: number;
  cumulativeEnergyWh: number;
  currentPowerWatts: number;
  runningProcessId: string | null;
}
