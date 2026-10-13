import React from 'react';
import { Zap, Printer, Download, Battery } from 'lucide-react';
import type { BatteryConfig } from '../../types/battery';
import type { SimulationResult } from '../../types/scheduling';
import { exportExperimentJSON } from '../../utils/exportUtils';
import { formatPercentage } from '../../utils/formatters';

interface HeaderProps {
  title: string;
  subtitle?: string;
  batteryConfig: BatteryConfig;
  onUpdateBatteryConfig: (newConfig: BatteryConfig) => void;
  lastResult?: SimulationResult | null;
  processCount: number;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  batteryConfig,
  onUpdateBatteryConfig,
  lastResult,
  processCount,
  onOpenReportModal,
}) => {
  const toggleAC = () => {
    onUpdateBatteryConfig({
      ...batteryConfig,
      externalPowerConnected: !batteryConfig.externalPowerConnected,
    });
  };

  const handleExportJSON = () => {
    if (lastResult) {
      exportExperimentJSON(
        {
          project: 'PowerOS',
          timestamp: new Date().toISOString(),
          configuration: batteryConfig,
          result: lastResult,
        },
        `poweros_${lastResult.algorithm}_experiment.json`
      );
    }
  };

  const currentBatteryPct = lastResult
    ? lastResult.aggregateMetrics.finalBatteryPercentage
    : batteryConfig.initialPercentage;

  return (
    <header className="no-print sticky top-0 z-30 bg-[#FEFAF3]/90 backdrop-blur-md border-b border-[#DFE7DD] px-6 py-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title and context */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#26352B]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#596D5F] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Global Controls & Status Pill Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Workload badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DFE7DD] text-xs text-[#26352B] shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84A282]" />
            <span className="font-medium">{processCount} Processes</span>
          </div>

          {/* AC Power status toggle */}
          <button
            onClick={toggleAC}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 shadow-xs ${
              batteryConfig.externalPowerConnected
                ? 'bg-[#B8CFB3]/40 text-[#26352B] border-[#84A282]'
                : 'bg-white text-[#596D5F] border-[#DFE7DD] hover:bg-[#FAF6EE]'
            }`}
            title="Toggle simulated AC mains power supply"
          >
            <Zap
              className={`w-3.5 h-3.5 ${
                batteryConfig.externalPowerConnected
                  ? 'text-[#84A282] fill-[#84A282]'
                  : 'text-[#596D5F]'
              }`}
            />
            <span>
              {batteryConfig.externalPowerConnected ? 'AC Mains Plugged In' : 'On Battery'}
            </span>
          </button>

          {/* Battery level status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DFE7DD] text-xs font-medium text-[#26352B] shadow-xs">
            <Battery className="w-3.5 h-3.5 text-[#84A282]" />
            <span>{formatPercentage(currentBatteryPct)}</span>
          </div>

          {/* Print Academic Report Button */}
          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEFAF3] hover:bg-[#FAF6EE] text-[#26352B] border border-[#DFE7DD] text-xs font-medium transition-colors shadow-xs"
            title="Generate academic evaluation report"
          >
            <Printer className="w-3.5 h-3.5 text-[#84A282]" />
            <span className="hidden sm:inline">Academic Report</span>
          </button>

          {/* JSON Export Button */}
          {lastResult && (
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#84A282] hover:bg-[#698767] text-white text-xs font-medium transition-colors shadow-xs"
              title="Download experiment as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export JSON</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
