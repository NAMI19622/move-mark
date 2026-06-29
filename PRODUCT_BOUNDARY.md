# Product Boundary

MoveMark is a semantic condition-verification protocol for rentals, shared
spaces, and shared equipment. Two parties record a condition snapshot at handover
(entry) and at return (exit). A dispute claim is filed against the case, and a
GenLayer gate adjudicates whether the evidence supports the claim. MoveMark only
classifies and recommends; it never moves a deposit.

## Intelligent Contract owns
- Authoritative storage: condition cases, entry and exit snapshots, claims, gate
  evaluations, settlement receipts, and the running tallies.
- State transition rules: case creation; entry and exit snapshot recording; claim
  submission; claim evaluation; settlement receipt sealing.
- Deterministic input guards: caller checks (only the case owner records
  snapshots and seals settlements), existence checks, length and enum bounds, and
  a missing-snapshot short-circuit before any AI call.
- Nondeterministic AI judgment: mapping the entry/exit evidence and the claim
  onto one coarse gate enum plus matched evidence ids, supported and unsupported
  issue ids, reason codes, a confidence, and a one-sentence reason.
- Validator comparison: an independent re-run that must agree on the gate enum
  exactly, agree on whether the claim is at least partially supported, and agree
  on the confidence within a bounded tolerance.
- Deterministic backstops after consensus: invented evidence is dropped; an exit
  issue that already appears at entry is forced to pre-existing or partial; a
  missing-item claim contradicted by the exit record is unsupported; vague or
  low-certainty support is downgraded to insufficient; a disproportionate claim
  amount is capped; a settlement that exceeds partial support is reduced.
- Paged read views over cases, snapshots, claims, evaluations, and settlements.

## Frontend owns
- The inspection-studio UI and the warm floor-plan visual system.
- Wallet connection for writes.
- Read-only previews of cases, snapshots, claims, evaluations, and settlements.
- Transaction submission and the consensus lifecycle theater.
- Slow paged polling and client-derived stats.
- Help, field manual, and safety panels.

## External sources own
- Nothing. MoveMark uses no external APIs. The only nondeterminism is GenLayer
  LLM consensus inside the contract.

## Safety scope
- No deposit, escrow, staking, or value transfer of any kind. The contract
  records a recommended deduction; settling funds happens off-chain between the
  parties. Users pay network fees only.
- No real photographs or biometric data. Snapshots are plain-text condition
  notes. Demo content is safe text only.
- Not legal advice. The adjudication is probabilistic; the deterministic
  backstops bound it but do not make it infallible.
