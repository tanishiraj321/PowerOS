export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0.0s';
  return `${seconds.toFixed(1)}s`;
}

export function formatEnergy(wh: number): string {
  if (isNaN(wh)) return '0.0000 Wh';
  if (wh < 0.01 && wh > 0) {
    return `${(wh * 1000).toFixed(2)} mWh`;
  }
  return `${wh.toFixed(4)} Wh`;
}

export function formatPower(watts: number): string {
  if (isNaN(watts)) return '0.0 W';
  return `${watts.toFixed(1)} W`;
}

export function formatPercentage(pct: number): string {
  if (isNaN(pct)) return '0.0%';
  return `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`;
}

export function formatDateTime(isoStringOrTimestamp: string | number): string {
  const date = new Date(isoStringOrTimestamp);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
