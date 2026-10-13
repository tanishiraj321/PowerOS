import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Cpu,
  BatteryCharging,
  BarChart3,
  History,
  Info,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

export type NavPage =
  | 'dashboard'
  | 'processes'
  | 'simulator'
  | 'battery'
  | 'comparison'
  | 'history'
  | 'about';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems: Array<{ id: NavPage; label: string; icon: React.ReactNode; subtitle: string }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4.5 h-4.5" />,
      subtitle: 'Overview & KPIs',
    },
    {
      id: 'processes',
      label: 'Process Manager',
      icon: <Layers className="w-4.5 h-4.5" />,
      subtitle: 'Workloads & CRUD',
    },
    {
      id: 'simulator',
      label: 'Scheduling Simulator',
      icon: <Cpu className="w-4.5 h-4.5" />,
      subtitle: 'Execution & Gantt',
    },
    {
      id: 'battery',
      label: 'Battery & Power',
      icon: <BatteryCharging className="w-4.5 h-4.5" />,
      subtitle: 'Energy Dynamics',
    },
    {
      id: 'comparison',
      label: 'Algorithm Comparison',
      icon: <BarChart3 className="w-4.5 h-4.5" />,
      subtitle: 'Benchmark & Tradeoffs',
    },
    {
      id: 'history',
      label: 'Simulation History',
      icon: <History className="w-4.5 h-4.5" />,
      subtitle: 'Saved Experiments',
    },
    {
      id: 'about',
      label: 'About Project',
      icon: <Info className="w-4.5 h-4.5" />,
      subtitle: 'Academic Documentation',
    },
  ];

  return (
    <aside
      className={`no-print flex flex-col justify-between h-screen sticky top-0 bg-[#FEFAF3] border-r border-[#DFE7DD] transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top brand header */}
      <div>
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#DFE7DD]/70">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#84A282] flex items-center justify-center text-white shadow-soft shrink-0">
              <Zap className="w-5 h-5 fill-white/90" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold tracking-tight text-[#26352B] leading-none">
                  Power<span className="text-[#84A282]">OS</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#596D5F] mt-1">
                  Battery Scheduler
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-[#596D5F] hover:text-[#26352B] hover:bg-[#B8CFB3]/25 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items list */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-[#84A282] text-white font-medium shadow-xs'
                    : 'text-[#26352B] hover:bg-[#B8CFB3]/20 hover:text-[#26352B]'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={`shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-[#84A282] group-hover:text-[#26352B]'
                  }`}
                >
                  {item.icon}
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate">{item.label}</span>
                    <span
                      className={`text-[10px] truncate ${
                        isActive ? 'text-white/80' : 'text-[#596D5F]'
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                )}

                {/* Subtle active pill indicator on left */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-white/40 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer label */}
      <div className="p-4 border-t border-[#DFE7DD]/70 bg-[#FAF6EE]/60">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#84A282] animate-pulse" />
              <span className="text-xs font-semibold text-[#26352B]">
                Operating Systems Project
              </span>
            </div>
            <p className="text-[11px] text-[#596D5F] leading-tight">
              Battery-Aware Process Scheduling
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="Operating Systems Project">
            <span className="w-2.5 h-2.5 rounded-full bg-[#84A282]" />
          </div>
        )}
      </div>
    </aside>
  );
};
