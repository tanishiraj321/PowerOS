import React, { useMemo } from 'react';
import type { GanttBlock } from '../../types/scheduling';
import { getProcessColor, IDLE_COLOR } from '../../utils/colors';
import { formatTime, formatEnergy, formatPower } from '../../utils/formatters';

interface GanttChartProps {
  blocks: GanttBlock[];
  title?: string;
  className?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  blocks,
  title = 'CPU Execution Timeline (Gantt Chart)',
  className = '',
}) => {
  const { maxTime, processIds, coloredBlocks } = useMemo(() => {
    if (!blocks.length) {
      return { maxTime: 1, processIds: [] as string[], coloredBlocks: [] as GanttBlock[] };
    }
    const max = Math.max(...blocks.map((b) => b.endTime), 1);
    const ids = Array.from(
      new Set(blocks.filter((b) => b.processId !== 'IDLE').map((b) => b.processId))
    );
    const colored = blocks.map((b) => ({
      ...b,
      color:
        b.processId === 'IDLE'
          ? IDLE_COLOR
          : b.color || getProcessColor(b.processId, ids.indexOf(b.processId)),
    }));
    return { maxTime: max, processIds: ids, coloredBlocks: colored };
  }, [blocks]);

  if (!blocks.length) {
    return (
      <div className={`rounded-xl border border-[#DFE7DD] bg-white p-8 text-center shadow-soft ${className}`}>
        <p className="text-sm text-[#596D5F]">Run a simulation to generate the Gantt chart.</p>
      </div>
    );
  }

  const tickCount = Math.min(12, Math.max(4, Math.ceil(maxTime)));
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxTime * i) / tickCount);

  return (
    <div className={`rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#26352B]">{title}</h3>
        <span className="text-xs text-[#596D5F]">Makespan: {formatTime(maxTime)}</span>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        {processIds.map((id, idx) => {
          const name = coloredBlocks.find((b) => b.processId === id)?.processName || id;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#DFE7DD] bg-[#FEFAF3] px-2.5 py-1 text-xs text-[#26352B]"
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: getProcessColor(id, idx) }}
              />
              {id} · {name}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DFE7DD] bg-[#FEFAF3] px-2.5 py-1 text-xs text-[#596D5F]">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: IDLE_COLOR }} />
          IDLE
        </span>
      </div>

      {/* Chart track */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[480px]">
          <div className="relative h-14 w-full overflow-hidden rounded-lg border border-[#DFE7DD] bg-[#FEFAF3]">
            {coloredBlocks.map((block) => {
              const left = (block.startTime / maxTime) * 100;
              const width = Math.max(((block.endTime - block.startTime) / maxTime) * 100, 0.4);
              const isIdle = block.processId === 'IDLE';
              return (
                <div
                  key={block.id}
                  className="absolute top-1 bottom-1 flex items-center justify-center overflow-hidden rounded-md border border-black/5 text-[10px] font-semibold transition-opacity hover:opacity-90"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: block.color,
                    color: isIdle ? '#596D5F' : '#26352B',
                  }}
                  title={`${block.processName}\n${formatTime(block.startTime)} → ${formatTime(block.endTime)}\nDuration: ${formatTime(block.duration)}\nPower: ${formatPower(block.powerWatts)}\nEnergy: ${formatEnergy(block.energyConsumedWh)}${block.isPreempted ? '\nPreempted' : ''}`}
                >
                  {width > 6 ? (isIdle ? 'IDLE' : block.processId) : ''}
                </div>
              );
            })}
          </div>

          {/* Time axis */}
          <div className="relative mt-2 h-5 w-full">
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 -translate-x-1/2 text-[10px] text-[#596D5F]"
                style={{ left: `${(t / maxTime) * 100}%` }}
              >
                {t.toFixed(t % 1 === 0 ? 0 : 1)}s
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Block details table (compact) */}
      <div className="mt-4 max-h-40 overflow-auto rounded-lg border border-[#DFE7DD]">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#FEFAF3] text-[#596D5F]">
            <tr>
              <th className="px-3 py-2 font-semibold">Process</th>
              <th className="px-3 py-2 font-semibold">Start</th>
              <th className="px-3 py-2 font-semibold">End</th>
              <th className="px-3 py-2 font-semibold">Duration</th>
              <th className="px-3 py-2 font-semibold">Power</th>
              <th className="px-3 py-2 font-semibold">Energy</th>
            </tr>
          </thead>
          <tbody>
            {coloredBlocks.map((b) => (
              <tr key={b.id} className="border-t border-[#DFE7DD]/70 text-[#26352B]">
                <td className="px-3 py-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ backgroundColor: b.color }}
                    />
                    {b.processId === 'IDLE' ? 'IDLE' : `${b.processId} (${b.processName})`}
                    {b.isPreempted && (
                      <span className="rounded bg-[#F6E2E9] px-1 text-[9px] text-[#26352B]">preempt</span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-1.5 font-mono">{b.startTime.toFixed(1)}</td>
                <td className="px-3 py-1.5 font-mono">{b.endTime.toFixed(1)}</td>
                <td className="px-3 py-1.5 font-mono">{b.duration.toFixed(1)}</td>
                <td className="px-3 py-1.5 font-mono">{formatPower(b.powerWatts)}</td>
                <td className="px-3 py-1.5 font-mono">{formatEnergy(b.energyConsumedWh)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
