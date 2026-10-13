import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { BatteryConfig } from '../types/battery';
import type { SimulationResult } from '../types/scheduling';
import { validateBatteryConfig } from '../engine/validation';
import { BatteryGauge } from '../components/common/BatteryGauge';
import { MetricCard } from '../components/common/MetricCard';
import { formatEnergy, formatPower, formatPercentage } from '../utils/formatters';

interface BatteryPowerProps {
  batteryConfig: BatteryConfig;
  onUpdateBatteryConfig: (config: BatteryConfig) => void;
  lastResult: SimulationResult | null;
}

export const BatteryPower: React.FC<BatteryPowerProps> = ({
  batteryConfig,
  onUpdateBatteryConfig,
  lastResult,
}) => {
  const [draft, setDraft] = useState<BatteryConfig>(batteryConfig);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(batteryConfig);
  }, [batteryConfig]);

  const handleSave = () => {
    const validation = validateBatteryConfig(draft);
    if (validation.length > 0) {
      const map: Record<string, string> = {};
      validation.forEach((e) => {
        map[e.field] = e.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    onUpdateBatteryConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const chartData = useMemo(() => {
    if (!lastResult?.energyDataPoints.length) return [];
    return lastResult.energyDataPoints.map((p) => ({
      time: Number(p.time.toFixed(2)),
      battery: Number(p.batteryPercentage.toFixed(2)),
      power: Number(p.currentPowerWatts.toFixed(2)),
      cumulative: Number(p.cumulativeEnergyWh.toFixed(5)),
    }));
  }, [lastResult]);

  const metrics = lastResult?.aggregateMetrics;
  const remainingWh = metrics
    ? (metrics.finalBatteryPercentage / 100) * batteryConfig.capacityWh
    : (batteryConfig.initialPercentage / 100) * batteryConfig.capacityWh;

  const tooltipStyle = {
    backgroundColor: '#FEFAF3',
    border: '1px solid #DFE7DD',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Config form */}
        <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-[#26352B]">Battery Configuration</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352B]">
                Capacity (Wh)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={draft.capacityWh}
                onChange={(e) => setDraft({ ...draft, capacityWh: Number(e.target.value) })}
                className={`w-full rounded-lg border bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282] ${
                  errors.capacityWh ? 'border-rose-400' : 'border-[#DFE7DD]'
                }`}
              />
              {errors.capacityWh && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.capacityWh}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352B]">
                Initial Charge (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={draft.initialPercentage}
                onChange={(e) =>
                  setDraft({ ...draft, initialPercentage: Number(e.target.value) })
                }
                className={`w-full rounded-lg border bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282] ${
                  errors.initialPercentage ? 'border-rose-400' : 'border-[#DFE7DD]'
                }`}
              />
              {errors.initialPercentage && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.initialPercentage}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352B]">
                Idle Power (W)
              </label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={draft.idlePowerWatts}
                onChange={(e) => setDraft({ ...draft, idlePowerWatts: Number(e.target.value) })}
                className={`w-full rounded-lg border bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282] ${
                  errors.idlePowerWatts ? 'border-rose-400' : 'border-[#DFE7DD]'
                }`}
              />
              {errors.idlePowerWatts && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.idlePowerWatts}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352B]">
                Power-Saving Multiplier (DVFS)
              </label>
              <input
                type="number"
                min={0.1}
                max={1.5}
                step={0.05}
                value={draft.powerSavingMultiplier}
                onChange={(e) =>
                  setDraft({ ...draft, powerSavingMultiplier: Number(e.target.value) })
                }
                className={`w-full rounded-lg border bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282] ${
                  errors.powerSavingMultiplier ? 'border-rose-400' : 'border-[#DFE7DD]'
                }`}
              />
              <p className="mt-1 text-[11px] text-[#596D5F]">
                Applied in BAAS PowerSaving mode (e.g. 0.75 = 25% reduction)
              </p>
              {errors.powerSavingMultiplier && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.powerSavingMultiplier}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#26352B]">
                Scheduling Interval (s)
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={draft.schedulingInterval}
                onChange={(e) =>
                  setDraft({ ...draft, schedulingInterval: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#84A282]"
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] px-3 py-2.5 text-sm text-[#26352B]">
                <input
                  type="checkbox"
                  checked={draft.externalPowerConnected}
                  onChange={(e) =>
                    setDraft({ ...draft, externalPowerConnected: e.target.checked })
                  }
                  className="rounded border-[#DFE7DD] text-[#84A282] focus:ring-[#84A282]"
                />
                AC mains connected (no battery drain)
              </label>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-[#84A282] px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-[#698767]"
            >
              Apply Configuration
            </button>
            {saved && (
              <span className="text-xs font-medium text-[#84A282]">Configuration saved</span>
            )}
          </div>

          <div className="mt-5 rounded-lg border border-[#DFE7DD] bg-[#FEFAF3] p-3 text-xs leading-relaxed text-[#596D5F]">
            <strong className="text-[#26352B]">Energy model:</strong> Energy (Wh) = Power (W) ×
            duration (s) / 3600. Active power = process powerDemand (+ idle). Under BAAS PowerSaving,
            active demand is scaled by the DVFS multiplier. AC mode prevents battery discharge.
          </div>
        </div>

        <div className="space-y-4">
          <BatteryGauge
            percentage={
              metrics ? metrics.finalBatteryPercentage : batteryConfig.initialPercentage
            }
            remainingWh={remainingWh}
            capacityWh={batteryConfig.capacityWh}
            isACConnected={batteryConfig.externalPowerConnected}
            isExhausted={metrics?.isExhausted ?? false}
          />
          {metrics && (
            <div className="grid grid-cols-1 gap-3">
              <MetricCard
                title="Total Energy"
                value={formatEnergy(metrics.totalEnergyWh)}
                variant="pink"
              />
              <MetricCard
                title="Final Battery"
                value={formatPercentage(metrics.finalBatteryPercentage)}
                variant="sage"
              />
            </div>
          )}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-[#26352B]">
              Battery Discharge Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFE7DD" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11, fill: '#596D5F' }}
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#596D5F' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#596D5F' }}
                    label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#596D5F' }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="battery"
                    name="Battery %"
                    stroke="#84A282"
                    fill="#B8CFB3"
                    fillOpacity={0.45}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-[#26352B]">
              Instantaneous Power Draw
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFE7DD" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#596D5F' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#596D5F' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatPower(Number(value))}
                  />
                  <Legend />
                  <Line
                    type="stepAfter"
                    dataKey="power"
                    name="Power (W)"
                    stroke="#84A282"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft xl:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-[#26352B]">
              Cumulative Energy Consumption
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DFE7DD" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#596D5F' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#596D5F' }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatEnergy(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative Wh"
                    stroke="#D4A5B3"
                    fill="#F6E2E9"
                    fillOpacity={0.7}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#DFE7DD] bg-white px-6 py-12 text-center shadow-soft">
          <p className="text-sm text-[#596D5F]">
            Run a simulation to plot battery discharge, power draw, and cumulative energy from real
            results.
          </p>
        </div>
      )}
    </div>
  );
};
