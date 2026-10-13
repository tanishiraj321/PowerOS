import { useCallback, useEffect, useState } from 'react';
import { Sidebar, type NavPage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AcademicReportModal } from './components/report/AcademicReportModal';
import { Dashboard } from './pages/Dashboard';
import { ProcessManager } from './pages/ProcessManager';
import { Simulator } from './pages/Simulator';
import { BatteryPower } from './pages/BatteryPower';
import { Comparison } from './pages/Comparison';
import { History } from './pages/History';
import { About } from './pages/About';
import type { Process } from './types/process';
import type { BatteryConfig } from './types/battery';
import type { SimulationResult } from './types/scheduling';
import type { SavedExperiment } from './types/history';
import {
  loadSavedProcesses,
  saveProcesses,
  loadBatteryConfig,
  saveBatteryConfig,
  loadExperiments,
  saveExperiment,
  deleteExperiment,
  clearAllExperiments,
} from './utils/storage';

const PAGE_META: Record<NavPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Battery status, process overview, and scheduling performance',
  },
  processes: {
    title: 'Process Manager',
    subtitle: 'Create, edit, and organize simulation workloads',
  },
  simulator: {
    title: 'Scheduling Simulator',
    subtitle: 'Run FCFS, SJF, Round Robin, Priority, and BAAS',
  },
  battery: {
    title: 'Battery & Power',
    subtitle: 'Configure energy model and inspect discharge dynamics',
  },
  comparison: {
    title: 'Algorithm Comparison',
    subtitle: 'Benchmark waiting time, turnaround, response, and energy',
  },
  history: {
    title: 'Simulation History',
    subtitle: 'Reload, preview, and export saved experiments',
  },
  about: {
    title: 'About Project',
    subtitle: 'PowerOS — Battery-Aware Process Scheduling Simulator',
  },
};

function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [processes, setProcesses] = useState<Process[]>(() => loadSavedProcesses());
  const [batteryConfig, setBatteryConfig] = useState<BatteryConfig>(() => loadBatteryConfig());
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const [experiments, setExperiments] = useState<SavedExperiment[]>(() => loadExperiments());
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    saveProcesses(processes);
  }, [processes]);

  useEffect(() => {
    saveBatteryConfig(batteryConfig);
  }, [batteryConfig]);

  const handleUpdateProcesses = useCallback((next: Process[]) => {
    setProcesses(next);
  }, []);

  const handleUpdateBatteryConfig = useCallback((next: BatteryConfig) => {
    setBatteryConfig(next);
  }, []);

  const handleSaveExperiment = useCallback((experiment: SavedExperiment) => {
    saveExperiment(experiment);
    setExperiments(loadExperiments());
  }, []);

  const handleDeleteExperiment = useCallback((id: string) => {
    deleteExperiment(id);
    setExperiments(loadExperiments());
  }, []);

  const handleClearExperiments = useCallback(() => {
    clearAllExperiments();
    setExperiments([]);
  }, []);

  const handleReloadExperiment = useCallback((experiment: SavedExperiment) => {
    setProcesses(experiment.processes.map((p) => ({ ...p })));
    setBatteryConfig({ ...experiment.result.batteryConfig });
    setLastResult(experiment.result);
    setActivePage('simulator');
  }, []);

  const meta = PAGE_META[activePage];

  return (
    <div className="flex min-h-screen bg-[#FEFAF3]">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          batteryConfig={batteryConfig}
          onUpdateBatteryConfig={handleUpdateBatteryConfig}
          lastResult={lastResult}
          processCount={processes.length}
          onOpenReportModal={() => setReportOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {activePage === 'dashboard' && (
            <Dashboard
              processes={processes}
              batteryConfig={batteryConfig}
              lastResult={lastResult}
              experimentCount={experiments.length}
              onNavigate={setActivePage}
            />
          )}
          {activePage === 'processes' && (
            <ProcessManager
              processes={processes}
              onUpdateProcesses={handleUpdateProcesses}
            />
          )}
          {activePage === 'simulator' && (
            <Simulator
              processes={processes}
              batteryConfig={batteryConfig}
              lastResult={lastResult}
              onResult={setLastResult}
              onSaveExperiment={handleSaveExperiment}
            />
          )}
          {activePage === 'battery' && (
            <BatteryPower
              batteryConfig={batteryConfig}
              onUpdateBatteryConfig={handleUpdateBatteryConfig}
              lastResult={lastResult}
            />
          )}
          {activePage === 'comparison' && (
            <Comparison processes={processes} batteryConfig={batteryConfig} />
          )}
          {activePage === 'history' && (
            <History
              experiments={experiments}
              onDelete={handleDeleteExperiment}
              onClearAll={handleClearExperiments}
              onReload={handleReloadExperiment}
              onSetResult={setLastResult}
            />
          )}
          {activePage === 'about' && <About />}
        </main>
      </div>

      <AcademicReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        lastResult={lastResult}
        processes={processes}
        batteryConfig={batteryConfig}
      />
    </div>
  );
}

export default App;
