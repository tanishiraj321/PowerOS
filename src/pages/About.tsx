import React from 'react';
import { Zap, Cpu, BatteryCharging, BarChart3 } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border border-[#DFE7DD] bg-white p-6 shadow-soft sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#84A282] text-white shadow-soft">
            <Zap className="h-6 w-6 fill-white/90" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#26352B]">
              Power<span className="text-[#84A282]">OS</span>
            </h2>
            <p className="text-sm text-[#596D5F]">
              Operating System Power Management Simulator
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[#596D5F]">
          PowerOS is an academic simulation environment for studying battery-aware process
          scheduling. It models CPU scheduling algorithms alongside a discrete-event energy model so
          you can measure waiting time, turnaround time, response time, and electrical energy
          consumption under constrained battery capacity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
          <Cpu className="mb-3 h-5 w-5 text-[#84A282]" />
          <h3 className="text-sm font-semibold text-[#26352B]">Classic Schedulers</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#596D5F]">
            FCFS, SJF, Round Robin, and Priority — with full Gantt timelines and per-process metrics.
          </p>
        </div>
        <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
          <BatteryCharging className="mb-3 h-5 w-5 text-[#84A282]" />
          <h3 className="text-sm font-semibold text-[#26352B]">Energy Model</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#596D5F]">
            Energy (Wh) = Power (W) × time (s) / 3600, with idle draw, AC mains, and DVFS scaling.
          </p>
        </div>
        <div className="rounded-xl border border-[#DFE7DD] bg-white p-5 shadow-soft">
          <BarChart3 className="mb-3 h-5 w-5 text-[#84A282]" />
          <h3 className="text-sm font-semibold text-[#26352B]">BAAS</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#596D5F]">
            Battery-Aware Adaptive Scheduling balances priority, power demand, burst length, and aging.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#DFE7DD] bg-white p-6 shadow-soft">
        <h3 className="mb-3 text-sm font-semibold text-[#26352B]">Algorithms Implemented</h3>
        <ul className="space-y-2 text-sm text-[#596D5F]">
          <li>
            <strong className="text-[#26352B]">FCFS</strong> — First Come First Served (non-preemptive)
          </li>
          <li>
            <strong className="text-[#26352B]">SJF</strong> — Shortest Job First (non-preemptive)
          </li>
          <li>
            <strong className="text-[#26352B]">RR</strong> — Round Robin with configurable time quantum
          </li>
          <li>
            <strong className="text-[#26352B]">Priority</strong> — Static priority (lower number = higher)
          </li>
          <li>
            <strong className="text-[#26352B]">BAAS</strong> — Battery-Aware Adaptive Scheduler with
            Performance / Balanced / PowerSaving modes
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-[#DFE7DD] bg-[#FEFAF3] p-5 text-center text-xs text-[#596D5F]">
        Operating Systems academic project · Battery-Aware Process Scheduling · Palette: Blush Pink
        #F6E2E9 · Warm Ivory #FEFAF3 · Sage #B8CFB3 · Muted Green #84A282
      </div>
    </div>
  );
};
