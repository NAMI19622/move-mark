'use client';

import { createClient, createAccount } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';
import { CONTRACT_ADDRESS } from './config';
import type {
  Summary,
  ConditionCase,
  Snapshot,
  Claim,
  Evaluation,
  SettlementReceipt,
  Page,
} from './types';

type AnyClient = ReturnType<typeof createClient>;

let readClient: AnyClient | null = null;
let walletClient: AnyClient | null = null;
let connectedAddress: string | null = null;

// A read-only client backed by an ephemeral account. Reads never sign anything,
// but genlayer-js wants an account present.
export function getReadClient(): AnyClient {
  if (!readClient) {
    const account = createAccount();
    readClient = createClient({ chain: testnetBradbury, account });
  }
  return readClient;
}

export function getConnectedAddress(): string | null {
  return connectedAddress;
}

// Connect the browser wallet (MetaMask / Snap) for write transactions.
export async function connectWallet(): Promise<string> {
  const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
  if (!eth) {
    throw new Error('No browser wallet found. Install MetaMask to record snapshots or file claims.');
  }
  const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet returned no accounts.');
  }
  connectedAddress = accounts[0];
  walletClient = createClient({
    chain: testnetBradbury,
    account: connectedAddress as `0x${string}`,
  });
  try {
    await (walletClient as any).initializeConsensusSmartContract?.();
  } catch {
    // best effort
  }
  return connectedAddress;
}

export function disconnectWallet(): void {
  walletClient = null;
  connectedAddress = null;
}

export function getWalletClient(): AnyClient {
  if (!walletClient) throw new Error('Wallet not connected.');
  return walletClient;
}

async function read<T>(method: string, args: any[] = []): Promise<T> {
  const client = getReadClient();
  const res = await (client as any).readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
  return res as T;
}

export const api = {
  getSummary: () => read<Summary>('get_summary'),
  getCasesPage: (offset: number, limit: number) =>
    read<Page<ConditionCase>>('get_cases_page', [offset, limit]),
  getCase: (id: string) => read<ConditionCase>('get_case', [id]),
  getSnapshotsForCase: (caseId: string, offset: number, limit: number) =>
    read<Page<Snapshot>>('get_snapshots_for_case', [caseId, offset, limit]),
  getClaimsPage: (offset: number, limit: number) =>
    read<Page<Claim>>('get_claims_page', [offset, limit]),
  getClaimsForCase: (caseId: string, offset: number, limit: number) =>
    read<Page<Claim>>('get_claims_for_case', [caseId, offset, limit]),
  getClaim: (id: string) => read<Claim>('get_claim', [id]),
  getEvaluation: (claimId: string) => read<Evaluation>('get_evaluation', [claimId]),
  getSettlement: (id: string) => read<SettlementReceipt>('get_settlement', [id]),
  getSettlementForClaim: (claimId: string) =>
    read<SettlementReceipt>('get_settlement_for_claim', [claimId]),
};

export interface WriteProgress {
  hash?: string;
  statusName?: string;
  statusCode?: number;
}

// Submit a write and poll the transaction to a terminal status.
export async function writeAndWait(
  method: string,
  args: any[],
  onProgress?: (p: WriteProgress) => void,
): Promise<{ hash: string; receipt: any }> {
  const client = getWalletClient();
  const hash: string = await (client as any).writeContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
    value: 0n,
  });
  onProgress?.({ hash, statusName: 'PENDING', statusCode: 1 });

  const receipt = await (client as any).waitForTransactionReceipt({
    hash,
    status: 'ACCEPTED',
    retries: 100,
    interval: 5000,
  });
  onProgress?.({ hash, statusName: 'ACCEPTED', statusCode: 5 });
  return { hash, receipt };
}
