export const PROCESS_PALETTE = [
  '#84A282', // Muted Green
  '#B8CFB3', // Sage Green
  '#F6E2E9', // Blush Pink
  '#9EB89D', // Soft Forest Sage
  '#E8D0D8', // Rose Dust
  '#6D8B6B', // Deep Sage
  '#CFDEC9', // Pale Mint
  '#D4A5B3', // Mauve Accent
];

export const IDLE_COLOR = '#ECE6DA';

export function getProcessColor(processId: string, index?: number): string {
  if (processId === 'IDLE') return IDLE_COLOR;
  if (index !== undefined) {
    return PROCESS_PALETTE[index % PROCESS_PALETTE.length];
  }
  // Deterministic hash of process ID
  let hash = 0;
  for (let i = 0; i < processId.length; i++) {
    hash = processId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PROCESS_PALETTE.length;
  return PROCESS_PALETTE[idx];
}
