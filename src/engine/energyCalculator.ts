import type { BatteryConfig, BatteryState } from '../types/battery';

export class EnergyCalculator {
  private config: BatteryConfig;
  private currentEnergyWh: number;
  private cumulativeEnergyWh: number;
  private isExhausted: boolean;

  constructor(config: BatteryConfig) {
    this.config = config;
    const initialFraction = Math.max(0, Math.min(100, config.initialPercentage)) / 100;
    this.currentEnergyWh = Math.max(0, config.capacityWh * initialFraction);
    this.cumulativeEnergyWh = 0;
    this.isExhausted = this.currentEnergyWh <= 0 && !config.externalPowerConnected;
  }

  /**
   * Calculates power demand (Watts) during a given slice.
   * If runningProcessPower is null or 0, system consumes idle power.
   */
  public getPowerWatts(runningProcessPower: number | null, isPowerSavingMode: boolean = false): number {
    const idle = Math.max(0, this.config.idlePowerWatts);
    if (runningProcessPower === null || runningProcessPower <= 0) {
      return idle;
    }

    const multiplier = isPowerSavingMode ? Math.max(0.1, this.config.powerSavingMultiplier) : 1.0;
    return idle + (runningProcessPower * multiplier);
  }

  /**
   * Integrates power over a time step duration in seconds.
   * Energy (Wh) = Power (W) * duration (s) / 3600
   * Returns: { energyConsumedWh, stepDischargedWh, batteryExhausted }
   */
  public step(
    durationSeconds: number,
    runningProcessPower: number | null,
    isPowerSavingMode: boolean = false
  ): {
    energyConsumedWh: number;
    stepDischargedWh: number;
    isExhausted: boolean;
    remainingEnergyWh: number;
    batteryPercentage: number;
    currentPowerWatts: number;
  } {
    if (durationSeconds <= 0) {
      return {
        energyConsumedWh: 0,
        stepDischargedWh: 0,
        isExhausted: this.isExhausted,
        remainingEnergyWh: this.currentEnergyWh,
        batteryPercentage: this.getBatteryPercentage(),
        currentPowerWatts: this.getPowerWatts(runningProcessPower, isPowerSavingMode),
      };
    }

    const currentPowerWatts = this.getPowerWatts(runningProcessPower, isPowerSavingMode);
    const energyConsumedWh = (currentPowerWatts * durationSeconds) / 3600;
    this.cumulativeEnergyWh += energyConsumedWh;

    let stepDischargedWh = 0;
    if (!this.config.externalPowerConnected) {
      stepDischargedWh = energyConsumedWh;
      this.currentEnergyWh = Math.max(0, this.currentEnergyWh - stepDischargedWh);
      if (this.currentEnergyWh <= 0.000001) {
        this.currentEnergyWh = 0;
        this.isExhausted = true;
      }
    } else {
      // Plugged into AC mains: no battery drain
      this.isExhausted = false;
    }

    return {
      energyConsumedWh,
      stepDischargedWh,
      isExhausted: this.isExhausted,
      remainingEnergyWh: this.currentEnergyWh,
      batteryPercentage: this.getBatteryPercentage(),
      currentPowerWatts,
    };
  }

  public getBatteryPercentage(): number {
    if (this.config.capacityWh <= 0) return 0;
    return Math.max(0, Math.min(100, (this.currentEnergyWh / this.config.capacityWh) * 100));
  }

  public getState(time: number, runningProcessPower: number | null, isPowerSavingMode: boolean = false): BatteryState {
    return {
      time,
      batteryPercentage: this.getBatteryPercentage(),
      remainingEnergyWh: this.currentEnergyWh,
      cumulativeEnergyWh: this.cumulativeEnergyWh,
      currentPowerWatts: this.getPowerWatts(runningProcessPower, isPowerSavingMode),
      isExhausted: this.isExhausted,
      externalPowerConnected: this.config.externalPowerConnected,
    };
  }
}
