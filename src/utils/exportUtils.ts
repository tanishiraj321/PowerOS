import type { Process } from '../types/process';
import type { SimulationResult } from '../types/scheduling';
import type { ComparisonReport } from '../engine/comparisonEngine';

function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProcessesCSV(processes: Process[], filename = 'poweros_processes.csv'): void {
  const headers = ['Process ID', 'Name', 'Arrival Time (s)', 'Burst Time (s)', 'Priority', 'Power Demand (W)', 'Deadline (s)', 'Category'];
  const rows = processes.map((p) => [
    p.id,
    `"${p.name.replace(/"/g, '""')}"`,
    p.arrivalTime,
    p.burstTime,
    p.priority,
    p.powerDemand,
    p.deadline ?? '',
    p.category,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportSchedulingResultsCSV(result: SimulationResult, filename = `poweros_${result.algorithm}_results.csv`): void {
  const meta = [
    `# PowerOS Simulation Results`,
    `# Algorithm: ${result.algorithmName}`,
    `# Mode: ${result.operatingMode || 'N/A'}`,
    `# Battery Capacity: ${result.batteryConfig.capacityWh} Wh`,
    `# Total Energy Consumed: ${result.aggregateMetrics.totalEnergyWh.toFixed(4)} Wh`,
    `# Final Battery: ${result.aggregateMetrics.finalBatteryPercentage.toFixed(1)}%`,
    `# Makespan: ${result.aggregateMetrics.makespan.toFixed(2)} s`,
    `# CPU Utilization: ${result.aggregateMetrics.cpuUtilization.toFixed(1)}%`,
    `# Average Waiting Time: ${result.aggregateMetrics.avgWaitingTime.toFixed(2)} s`,
    `# Average Turnaround Time: ${result.aggregateMetrics.avgTurnaroundTime.toFixed(2)} s`,
    ``,
  ];

  const headers = ['Process ID', 'Name', 'Arrival Time', 'Burst Time', 'Completion Time', 'Turnaround Time', 'Waiting Time', 'Response Time', 'Energy Consumed (Wh)', 'Completed'];
  const rows = result.processMetrics.map((p) => [
    p.processId,
    `"${p.processName.replace(/"/g, '""')}"`,
    p.arrivalTime,
    p.burstTime,
    p.completionTime,
    p.turnaroundTime,
    p.waitingTime,
    p.responseTime,
    p.energyConsumedWh.toFixed(5),
    p.completed ? 'YES' : 'NO',
  ]);

  const csvContent = [...meta, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportComparisonCSV(report: ComparisonReport, filename = 'poweros_algorithm_comparison.csv'): void {
  const headers = [
    'Algorithm',
    'Avg Waiting Time (s)',
    'Avg Turnaround Time (s)',
    'Avg Response Time (s)',
    'CPU Utilization (%)',
    'Throughput (proc/s)',
    'Makespan (s)',
    'Total Energy (Wh)',
    'Final Battery (%)',
    'Battery Exhausted',
  ];

  const rows = report.comparisonTableData.map((d) => [
    `"${d.algorithmName}"`,
    d.avgWaitingTime.toFixed(2),
    d.avgTurnaroundTime.toFixed(2),
    d.avgResponseTime.toFixed(2),
    d.cpuUtilization.toFixed(1),
    d.throughput.toFixed(3),
    d.makespan.toFixed(2),
    d.totalEnergyWh.toFixed(4),
    d.finalBatteryPercentage.toFixed(1),
    d.isExhausted ? 'YES' : 'NO',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

export function exportExperimentJSON(data: unknown, filename = 'poweros_experiment.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
}
