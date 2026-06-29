export interface Summary {
  cases: number;
  snapshots: number;
  claims: number;
  settlements: number;
  supported: number;
  unsupported: number;
  humanReview: number;
  gateValues: string[];
  claimTypes: string[];
  contractOwner: string;
}

export interface ConditionCase {
  id: string;
  owner: string;
  title: string;
  assetType: string;
  ownerLabel: string;
  userLabel: string;
  usagePeriod: string;
  inspectionStandard: string;
  depositAmount: number;
  entryCount: number;
  exitCount: number;
  claimCount: number;
  entrySealed: boolean;
  exitSealed: boolean;
  seq: number;
}

export interface Snapshot {
  id: string;
  caseId: string;
  phase: string;
  author: string;
  zone: string;
  item: string;
  conditionNote: string;
  severity: string;
  issueType: string;
  certainty: string;
  seq: number;
}

export interface Claim {
  id: string;
  caseId: string;
  claimType: string;
  claimant: string;
  respondent: string;
  claimedAmount: number;
  explanation: string;
  requestedOutcome: string;
  evaluated: boolean;
  seq: number;
}

export interface ValidatorResult {
  validator: string;
  passed: boolean;
  reason: string;
  blocks: boolean;
}

export interface Evaluation {
  id: string;
  claimId: string;
  caseId: string;
  gateResult: string;
  rawGate: string;
  matchedEntryIds: string[];
  matchedExitIds: string[];
  supportedIssueIds: string[];
  unsupportedIssueIds: string[];
  reasonCodes: string[];
  riskFlags: string[];
  confidenceBps: number;
  recommendedDeduction: number;
  reason: string;
  validatorSummary: ValidatorResult[];
  proofHash: string;
  seq: number;
}

export interface SettlementReceipt {
  id: string;
  claimId: string;
  caseId: string;
  gateResult: string;
  depositAmount: number;
  settledDeduction: number;
  returnedToUser: number;
  outcomeLabel: string;
  reason: string;
  proofHash: string;
  seq: number;
}

export interface Page<T> {
  total: number;
  offset: number;
  limit: number;
  items: T[];
}
