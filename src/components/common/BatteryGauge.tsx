import React from 'react';
import { Zap, Battery, BatteryCharging, BatteryWarning } from 'lucide-react';
import { formatEnergy, formatPercentage } from '../../utils/formatters';

interface BatteryGaugeProps {
  percentage: number;
  remainingWh?: number;
  capacityWh?: number;
  isACConnected?: boolean;
  isExhausted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const BatteryGauge: React.FC<BatteryGaugeProps> = ({
  percentage,
  remainingWh,
  capacityWh = 50,
  isACConnected = false,
  isExhausted = false,
  size = 'md',
  showDetails = true,
}) => {
  const safePct = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : percentage));

  // Determine fill color based on palette
  const getFillColor = () => {
    if (isExhausted || safePct <= 0) return 'bg-rose-500';
    if (safePct < 25) return 'bg-[#E89BAE]'; // Soft rose/pink alert
    if (safePct <= 60) return 'bg-[#84A282]'; // Muted green
    return 'bg-[#84A282]'; // Muted green
  };

  const getStatusText = () => {
    if (isExhausted) return 'Battery Depleted';
    if (isACConnected) return 'AC Connected (Infinite Mains)';
    if (safePct < 25) return 'Critical Battery (Power-Saving)';
    if (safePct <= 60) return 'Moderate Battery (Energy-Aware)';
    return 'Optimal Battery Level';
  };

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-7 h-4 rounded border border-[#84A282] p-0.5 flex items-center">
          <div
            className={`h-full rounded-sm transition-all duration-300 ${getFillColor()}`}
            style={{ width: `${safePct}%` }}
          />
          <div className="absolute -right-1 top-1 w-0.5 h-2 bg-[#84A282] rounded-r-xs" />
        </div>
        <span className="text-xs font-semibold text-[#26352B]">
          {formatPercentage(safePct)}
        </span>
        {isACConnected && <Zap className="w-3.5 h-3.5 text-[#84A282] fill-[#84A282]" />}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white border border-[#DFE7DD] shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isACConnected ? (
            <BatteryCharging className="w-5 h-5 text-[#84A282]" />
          ) : isExhausted ? (
            <BatteryWarning className="w-5 h-5 text-rose-600" />
          ) : (
            <Battery className="w-5 h-5 text-[#84A282]" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-[#596D5F]">
            Simulated Battery State
          </span>
        </div>
        {isACConnected && (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#B8CFB3]/30 text-[#26352B] font-medium border border-[#B8CFB3]">
            <Zap className="w-3 h-3 text-[#84A282]" /> AC Mains
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[#26352B] tracking-tight">
            {formatPercentage(safePct)}
          </span>
          <span className="text-xs text-[#596D5F] font-medium">remaining</span>
        </div>
        {remainingWh !== undefined && (
          <div className="text-right">
            <span className="text-sm font-semibold text-[#26352B]">
              {formatEnergy(remainingWh)}
            </span>
            <span className="text-xs text-[#596D5F]"> / {capacityWh} Wh</span>
          </div>
        )}
      </div>

      {/* Battery bar container */}
      <div className="relative w-full h-3.5 rounded-full bg-[#FEFAF3] border border-[#DFE7DD] p-0.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getFillColor()}`}
          style={{ width: `${safePct}%` }}
        />
      </div>

      {showDetails && (
        <div className="mt-3 pt-2.5 border-t border-[#DFE7DD]/70 flex items-center justify-between text-xs text-[#596D5F]">
          <span className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isExhausted ? 'bg-rose-500' : isACConnected ? 'bg-[#84A282]' : safePct < 25 ? 'bg-[#E89BAE]' : 'bg-[#84A282]'
              }`}
            />
            {getStatusText()}
          </span>
          <span>{capacityWh} Wh Li-ion model</span>
        </div>
      )}
    </div>
  );
};
