export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x2f27B3b57879Ec3Bd5D9CACE30ea8Aa6d85907d7') as `0x${string}`;

export const NETWORK = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || 'testnet-bradbury';

export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || 'https://explorer-bradbury.genlayer.com';

// Coarse adjudication outcomes returned by the GenLayer gate.
export const GATE_VALUES = [
  'CLAIM_SUPPORTED',
  'CLAIM_PARTIALLY_SUPPORTED',
  'PREEXISTING_ISSUE',
  'NORMAL_WEAR',
  'INSUFFICIENT_EVIDENCE',
  'CLAIM_UNSUPPORTED',
  'HUMAN_REVIEW_REQUIRED',
] as const;

export const CLAIM_TYPES = [
  'new_damage',
  'preexisting_damage',
  'normal_wear',
  'missing_item',
  'cleaning_required',
  'unauthorized_modification',
  'late_return',
  'other',
] as const;

export const ASSET_TYPES = [
  'apartment',
  'vehicle',
  'equipment',
  'instrument',
  'tool',
  'venue',
  'furniture',
  'wardrobe',
  'other',
] as const;

export const REQUESTED_OUTCOMES = [
  'full_deduction',
  'partial_deduction',
  'repair_cost',
  'replacement_cost',
  'no_deduction',
  'mediation',
] as const;

export const ISSUE_TYPES = [
  'none',
  'scratch',
  'stain',
  'crack',
  'dent',
  'break',
  'missing',
  'wear',
  'dirt',
  'malfunction',
  'odor',
  'other',
] as const;

export const SEVERITIES = [
  'none',
  'cosmetic',
  'minor',
  'moderate',
  'major',
  'severe',
] as const;

export const CERTAINTIES = ['low', 'medium', 'high'] as const;

export const TX_STATUS: Record<number, string> = {
  1: 'PENDING',
  2: 'PROPOSING',
  3: 'COMMITTING',
  4: 'REVEALING',
  5: 'ACCEPTED',
  6: 'UNDETERMINED',
  7: 'FINALIZED',
  8: 'CANCELED',
  12: 'VALIDATORS_TIMEOUT',
  13: 'LEADER_TIMEOUT',
};

// Validator panel labels, matching the keys emitted by the contract.
export const VALIDATOR_LABELS: Record<string, string> = {
  evidence_consistency: 'Evidence Consistency',
  preexisting_match: 'Pre-existing Evidence',
  missing_item_consistency: 'Contradiction',
  evidence_sufficiency: 'Evidence Sufficiency',
  proportionality: 'Claim Amount Proportionality',
  settlement_consistency: 'Settlement Consistency',
};

export function explorerTx(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerAddress(addr: string): string {
  return `${EXPLORER_BASE}/address/${addr}`;
}

