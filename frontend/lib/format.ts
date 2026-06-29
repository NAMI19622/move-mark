export function shortAddr(addr?: string | null): string {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export function gateLabel(gate: string): string {
  return gate.replace(/_/g, ' ');
}

export function gateColor(gate: string): string {
  switch (gate) {
    case 'CLAIM_SUPPORTED':
      return 'var(--green)';
    case 'CLAIM_PARTIALLY_SUPPORTED':
      return 'var(--brass)';
    case 'PREEXISTING_ISSUE':
      return 'var(--evidence)';
    case 'NORMAL_WEAR':
      return 'var(--sage)';
    case 'INSUFFICIENT_EVIDENCE':
      return 'var(--ink-3)';
    case 'CLAIM_UNSUPPORTED':
      return 'var(--rust)';
    case 'HUMAN_REVIEW_REQUIRED':
      return 'var(--amber)';
    default:
      return 'var(--ink-3)';
  }
}

// Whether a gate result upholds the claim, at least partially.
export function isSupport(gate: string): boolean {
  return gate === 'CLAIM_SUPPORTED' || gate === 'CLAIM_PARTIALLY_SUPPORTED';
}

export function bps(value: number): string {
  return (value / 100).toFixed(0) + '%';
}

export function credits(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function severityWeight(severity: string): number {
  const map: Record<string, number> = {
    none: 0,
    cosmetic: 1,
    minor: 2,
    moderate: 3,
    major: 4,
    severe: 5,
  };
  return map[severity] ?? 0;
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
