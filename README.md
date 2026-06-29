# MoveMark

An inspection field manual for condition disputes, enforced on GenLayer.

## Field note

Every shared space changes hands twice: once at handover, once at return. The
argument that follows is almost never about whether something is wrong. It is
about when it went wrong, who it belongs to, and what it is worth. A scratch that
was already there is not new damage. A faded finish is not a charge. A vague note
is not evidence.

MoveMark is a semantic condition-verification protocol for rentals, shared
spaces, and shared equipment. Two parties record a Condition Snapshot at entry
and another at exit. A Claim is filed against the case. A GenLayer Gate reads the
before and the after against the claim and settles one of seven outcomes under
validator consensus, then seals a Settlement Receipt with a recommended
deduction. MoveMark never moves a deposit; it adjudicates and recommends, and the
parties settle off-chain.

This document is the field manual for that instrument. The Protocols describe how
it works in the order an inspector would use it; the Evidence locker records
where it lives.

## Protocol 0: Why condition disputes are semantic

A static contract can verify a signature, hold an escrow, or check an allowlist.
It cannot read two condition notes and tell that the stain on the table at exit
was not the scratch on the table at entry. It cannot tell ordinary wear from
chargeable damage, a present item from a missing one, or a specific observation
from a hand-wave. That judgment is contextual: it depends on comparing two
natural-language records and the claim that connects them.

Because the on-chain outcome decides whether a deduction is recommended,
withheld, escalated, or refused, it cannot be the private verdict of one server.
It must be a subjective decision that many validators reproduce and agree on.
That is the GenLayer property MoveMark depends on: the Gate is an LLM consensus
question whose result is load-bearing, wrapped in deterministic code that bounds
what the model is allowed to conclude.

## Protocol 1: The record

The contract holds five kinds of state on-chain.

- **Condition Case.** The container for one handover: a title, an asset type, an
  owner label and a user label, a usage period, an inspection standard, a deposit
  amount in credits, and counts of entries, exits, and claims. Owned by the
  address that opens it.
- **Snapshot.** One observation in either the entry phase or the exit phase: a
  zone, an item, a condition note, an issue type, a severity, and a certainty.
- **Claim.** A dispute filed against a case: a claim type, a claimant and a
  respondent, a claimed amount, an explanation, and a requested outcome.
- **Evaluation.** The settled result of passing a claim through the Gate: a gate
  result, matched entry and exit evidence ids, supported and unsupported issue
  ids, reason codes, risk flags, a confidence in basis points, a recommended
  deduction, a one-sentence reason, the validator panel, and a proof hash.
- **Settlement Receipt.** The sealed record of how the deposit would split:
  deposit amount, settled deduction, amount returned to the user, an outcome
  label, and the proof hash.

## Protocol 2: Capturing the condition

Six write methods mutate state. Only the evaluation invokes the model; the rest
are deterministic.

- `create_condition_case` opens a case and appends it to the docket.
- `create_entry_snapshot` records an entry observation, increments the entry
  count, and seals the entry phase. Only the case owner may call it.
- `create_exit_snapshot` records an exit observation, increments the exit count,
  and seals the exit phase. Only the case owner may call it.
- `submit_claim` files a claim against a case and increments its claim count.
- `evaluate_condition_claim` runs the Gate over the entry and exit snapshots and
  the claim, then writes an Evaluation. This is the only method that calls the
  model.
- `create_settlement_receipt` reads the Evaluation and seals a Settlement
  Receipt with the deposit split. Only the case owner may call it, and only once
  per claim, after the claim is evaluated.

## Protocol 3: The adjudication gate

A claim is evaluated into exactly one coarse, consensus-critical outcome.

| Outcome | Meaning |
| --- | --- |
| `CLAIM_SUPPORTED` | New damage at exit clearly backs the claim. |
| `CLAIM_PARTIALLY_SUPPORTED` | Part of the claim is backed; part is prior or unproven. |
| `PREEXISTING_ISSUE` | The claimed damage already appears at entry. |
| `NORMAL_WEAR` | The change is consistent with ordinary use. |
| `INSUFFICIENT_EVIDENCE` | The notes are vague, low-certainty, or incomplete. |
| `CLAIM_UNSUPPORTED` | The evidence contradicts the claim. |
| `HUMAN_REVIEW_REQUIRED` | The evidence is genuinely contradictory or too complex. |

**The consensus question.** Given the entry snapshot, the exit snapshot, and the
claim, which coarse outcome is correct, and which evidence ids support it? A
leader proposes the answer; every validator independently re-runs the same
comparison and must agree on the gate outcome exactly, agree on whether the claim
is at least partially supported, and agree on the confidence within a bounded
tolerance before the decision settles. The settled result decides the Evaluation
and, in turn, the Settlement Receipt.

## Protocol 4: Powers reserved to code

The model proposes; deterministic code disposes. Two layers surround every
evaluation and the model cannot override either.

**Guards, applied before the model runs.** The claim and case must exist; the
claim must not already be evaluated; inputs are length-capped and enum-bounded on
write; snapshots may be recorded only by the case owner. If either an entry or an
exit snapshot is missing, the Gate short-circuits to `INSUFFICIENT_EVIDENCE`
before any AI call, because there is nothing to compare.

**Backstops, applied after consensus.** These invariants are recomputed in code
on every node:

- Cited evidence ids that do not exist in the snapshots are dropped; support that
  rested only on invented evidence falls to `INSUFFICIENT_EVIDENCE`.
- An exit issue that already appears at entry (same zone, item, and issue type)
  is prior damage: if everything claimed is prior, the outcome becomes
  `PREEXISTING_ISSUE`; if some is new and some is prior, a full support is reduced
  to `CLAIM_PARTIALLY_SUPPORTED`.
- A missing-item claim contradicted by an exit record that lists the item present
  is forced to `CLAIM_UNSUPPORTED`.
- Support that rests entirely on vague, low-certainty, or zone-less notes is
  downgraded to `INSUFFICIENT_EVIDENCE`.
- A claimed amount disproportionate to the supported severity is flagged and the
  recommended deduction is capped.
- A deduction that would consume the whole deposit on only partial support is
  reduced; any non-support outcome recommends a zero deduction.

## Protocol 5: Validators of record

Each evaluation records a panel of validator results. They check substance, not
shape; a plausible-looking decision that contradicts the evidence is rejected.

- **Evidence Consistency.** Fails and drops any cited evidence id that is not in
  the snapshots.
- **Pre-existing Evidence.** Fails when the claimed damage overlaps an issue
  already recorded at entry, and withholds full support.
- **Contradiction.** Fails when a missing-item claim is contradicted by an exit
  record that shows the item present.
- **Evidence Sufficiency.** Fails when the supporting evidence is vague,
  low-certainty, or missing a zone, and downgrades to insufficient.
- **Claim Amount Proportionality.** Fails when the claimed amount is
  disproportionate to the supported severity, and caps the recommended deduction.
- **Settlement Consistency.** Fails when a full deduction would follow only
  partial support, and reduces it.

Two further checks frame the panel: the missing-snapshot guard that runs before
the model, and the human-review path that holds genuinely contradictory evidence
for a person. A panel that only confirmed the model returned the right shape would
be worthless here; these checks re-derive the before-and-after comparison in code
and refuse contradictions.

## Protocol 6: Reading the record

The frontend reads these view methods, all of them deterministic and free to
call: `get_summary`, `get_cases_page`, `get_case`, `get_snapshots_for_case`,
`get_claims_page`, `get_claims_for_case`, `get_claim`, `get_evaluation`,
`get_settlement`, and `get_settlement_for_claim`. Every collection view is paged
with a maximum page size of 20.

## Protocol 7: The instrument panel

The frontend is a static single-page application that talks to the contract
through `genlayer-js`. It reads live state in read-only mode and connects a
browser wallet only for writes.

**Shell.** A split-pane inspection studio, not a marketing page. The left rail is
the case docket. The center is the inspection bench. The right rail is the
adjudication inspector. A transaction theater runs along the bottom.

**Visual system.** A charcoal-and-walnut bench with brass-gold and evidence-blue
signals: evidence blue for pre-existing conditions, rust for new damage, sage for
clean, brass for wear. Type is Fraunces for display, Inter Tight for body, and
JetBrains Mono for hashes and amounts.

**Custom visual components.** A device-pixel-ratio aware `SpaceMapCanvas` floor
plan with luminous zone markers; an `EvidenceMatchRibbon` that links exit issues
back to their entry origin; a brass `WearCompassDial` whose needle reads
confidence and whose arc reads supported severity; a wax `SettlementSeal` that
stamps the gate result and proof hash; a `ValidatorLedger` that stamps the six
checks in sequence; and a `TransactionTheater` bound to transaction status.

**Motion.** Five named animations: the SpaceMapCanvas loop, device-pixel-ratio
aware and paused when the tab is hidden; the studio entry sequence where zone
markers ease onto the plan; a pointer-reactive map where markers flex toward the
cursor; the gate lifecycle where an inspection sweep crosses the map while the
transaction theater advances and the validator ledger stamps in sequence; and the
on-chain update where the compass needle swings and the wax seal stamps. All
motion respects prefers-reduced-motion and pauses when the tab is hidden.

## Protocol 8: Field setup

The following steps assume Node 18 or later and Python 3.11 or later.

1. Lint the contract. From `move-mark/`, run `genvm-lint check contracts/contract.py`.
2. Run the contract tests. From `move-mark/`, run `python -m pytest tests/direct/ -q`.
3. Install frontend dependencies. From `move-mark/frontend/`, run `npm install`.
4. Configure the frontend. Copy `.env.example` to `.env.local` and set
   `NEXT_PUBLIC_CONTRACT_ADDRESS` to the deployed address.
5. Run the frontend. Run `npm run dev` and open the printed local URL.
6. Build the static site. Run `npm run build`; the export is emitted to `out/`.

## Protocol 9: Conformance log

- **Guards and backstops.** Direct tests under `tests/direct/` cover case and
  snapshot creation, ownership, pagination, and the eight adjudication scenarios:
  pre-existing damage, new damage supported, normal wear, a vague claim,
  contradictory evidence on a missing item, invented evidence failing the
  consistency check, a disproportionate settlement amount, and a supported claim
  sealed into a settlement. Run them with `python -m pytest tests/direct/ -q`.
- **Build and hygiene.** The frontend type-checks with `npx tsc --noEmit` and
  builds to a static export with `npx next build`. No emoji and no em dash appear
  anywhere in the source.

## Protocol 10: Deployment notes

Deploying and reseeding use the standalone scripts in `scripts/`, which read a
deployer key from the workspace `.env` (`GENLAYER_PRIVATE_KEY`). Run
`python scripts/deploy.py` to deploy and seed, or `python scripts/deploy.py
--no-seed` to deploy only; `python scripts/seed.py` reseeds the demo against an
existing `deployment.json`. Both seed the mandatory demo: the Apartment Table
Deposit Dispute, with a kitchen wood-table edge-scratch entry snapshot, a
center water-stain exit snapshot, and a 400-credit deposit-deduction claim. To
point the frontend at a deployment, set `NEXT_PUBLIC_CONTRACT_ADDRESS` and
`NEXT_PUBLIC_GENLAYER_NETWORK` in the frontend environment.

## Evidence locker

- Network: Bradbury testnet (`testnet-bradbury`).
- Contract address: pending deployment.
- Live frontend URL: pending deployment.
- Explorer: https://explorer-bradbury.genlayer.com

## Safety and legal notice

MoveMark is not legal advice and is not a substitute for a professional
inspection or a court. It moves no funds: there is no deposit transfer, no
escrow, no staking, and no value transfer of any kind on-chain. The contract
records a recommended deduction only; settling the deposit happens off-chain
between the parties. Snapshots are plain-text condition notes, not photographs or
biometric data, and the demo content is safe text. The adjudication is
probabilistic; the deterministic backstops bound the outcome but do not make it
infallible. An AI consensus round on Bradbury can take one to five minutes, and
the interface stages that wait as the gate lifecycle; it is expected, not an
error.
