# MoveMark

Condition, captured before memory changes.

> A worked dispute, start to finish. Mira lends her studio for three nights. At
> handover she photographs nothing but writes one line into MoveMark: "kitchen,
> wood table, small scratch near the left edge." At return she finds a circular
> water stain on the same table and files an 80 credit deduction, calling both
> marks new. MoveMark reads the entry note, reads the exit note, reads the claim,
> and rules CLAIM_PARTIALLY_SUPPORTED: the stain is new and chargeable, the
> scratch was already on record and cannot be billed. That split, reached by
> validator consensus and bounded by code, is the whole product.

Everything below explains how that ruling is reached, what it can and cannot do,
and how to run it yourself.

---

## Try it in five minutes

You need Node 18+ and Python 3.11+.

```
git clone https://github.com/NAMI19622/move-mark
cd move-mark
genvm-lint check contracts/contract.py     # lint the contract
python -m pytest tests/direct/ -q          # run the 19 direct tests
cd frontend && npm install && npm run dev  # open the inspection studio
```

The dev server reads the live contract on Bradbury in read-only mode, so you see
the seeded Apartment Table Deposit Dispute immediately, before connecting any
wallet. Connect a wallet only when you want to file or rule on a claim yourself.

---

## Questions people ask first

**Is this an escrow that holds my deposit?**
No. MoveMark moves no money, ever. There is no escrow, no staking, no value
transfer. The contract recommends a deduction; the two parties settle off-chain.

**Then what does it actually decide?**
Whether a damage claim is supported by the before-and-after evidence. The
outcome is one of seven coarse rulings (see the table further down), plus a
recommended credit deduction that deterministic code caps.

**Why not just store photos and hash them?**
A hash proves a file did not change. It cannot tell whether a mark at return is
the same mark that was there at handover, whether a scuff is ordinary wear, or
whether a claim is too vague to act on. That is a reading of two natural-language
records against a claim, which is a judgment, not a checksum.

**Is it legal advice?**
No. It is not a substitute for a professional inspection or a court. It is a
semantic record and a recommendation. Severe or high-value disputes still need a
human.

---

## The seven rulings

| Ruling | When it fires |
| --- | --- |
| `CLAIM_SUPPORTED` | New damage at exit clearly backs the claim. |
| `CLAIM_PARTIALLY_SUPPORTED` | Part is new and chargeable; part is prior or unproven. |
| `PREEXISTING_ISSUE` | The claimed damage already appears in the entry snapshot. |
| `NORMAL_WEAR` | The change is consistent with ordinary use. |
| `INSUFFICIENT_EVIDENCE` | Notes are vague, low-certainty, or a snapshot is missing. |
| `CLAIM_UNSUPPORTED` | The evidence contradicts the claim. |
| `HUMAN_REVIEW_REQUIRED` | The evidence is genuinely contradictory or too complex. |

A risk-free way to read this table: only the first two ever recommend a nonzero
deduction, and even those are capped by the proportionality backstop.

---

## What the contract holds and how it changes

The Intelligent Contract is the entire backend. It stores five record types:
condition cases, entry/exit snapshots, claims, evaluations, and settlement
receipts. Six writes move that state, and only one of them calls the model.

```
create_condition_case      open a case                         deterministic
create_entry_snapshot      record a handover observation       deterministic, owner only
create_exit_snapshot       record a return observation         deterministic, owner only
submit_claim               file a dispute against a case       deterministic
evaluate_condition_claim   rule the claim through the gate      >>> the only AI write
create_settlement_receipt  seal the deposit split              deterministic, owner only
```

Reads are all free and paged at 20: `get_summary`, `get_cases_page`, `get_case`,
`get_snapshots_for_case`, `get_claims_page`, `get_claims_for_case`, `get_claim`,
`get_evaluation`, `get_settlement`, `get_settlement_for_claim`.

---

## Why this needs GenLayer, precisely

The ruling on a claim decides whether a deduction is recommended, withheld, or
escalated. If a single server made that call, the party running the server would
quietly own every dispute. GenLayer removes that: a leader proposes the ruling,
and independent validators each re-run the same comparison of entry snapshot,
exit snapshot, and claim. They must agree on the ruling exactly, agree on whether
the claim is at least partially supported, and agree on the confidence within a
bounded tolerance before anything settles. The agreed result is what gets
written. That is the property an ordinary chain cannot give: a load-bearing,
reproduced, agreed-upon reading of natural language.

---

## What code refuses to let the model do

The model is a strong reader, not the judge of record. Deterministic guards run
before it and deterministic backstops run after consensus, recomputed identically
on every node.

Before the model: the claim and case must exist; a claim cannot be evaluated
twice; inputs are length-capped and enum-bounded; only the case owner records
snapshots. If either an entry or exit snapshot is missing, the gate
short-circuits to `INSUFFICIENT_EVIDENCE` without spending an AI round, because
there is nothing to compare.

After consensus, these invariants override the model:

- Cited evidence that does not exist in the snapshots is dropped; support that
  rested only on invented evidence falls to `INSUFFICIENT_EVIDENCE`.
- An exit issue already present at entry (same zone, item, type) is prior damage;
  if everything claimed is prior the ruling becomes `PREEXISTING_ISSUE`, and a
  mix of new and prior reduces full support to partial.
- A missing-item claim contradicted by an exit record showing the item present
  is forced to `CLAIM_UNSUPPORTED`.
- Support resting on vague, low-certainty, or zone-less notes is downgraded.
- A deduction disproportionate to the supported severity is capped; any
  non-support ruling recommends zero.

Each evaluation records a panel of validators (evidence consistency, pre-existing
evidence, contradiction, sufficiency, proportionality, settlement consistency)
so the ruling can be audited.

---

## The studio you are looking at

The frontend is a static single-page app. It is a forensic inspection studio,
not a dashboard: a manila case-file intake header with a custody chain, a strip
of case tabs, and a full-bleed floor-plan canvas where each zone is a room and
each inspected item is a luminous pin colored by its entry/exit delta (clean,
wear, pre-existing, new, disputed). Evidence opens as a before/after lightbox
bottom sheet with a match ribbon binding exit issues to their entry origin; a
claim is ruled in an adjudication dock that slides up over the plan, carrying a
brass wear-compass dial, the validator ledger, and a wax settlement seal. Charcoal
and walnut surfaces, brass gold and evidence blue signals, Fraunces and Inter
Tight type. All motion respects reduced-motion and pauses when the tab is hidden.

---

## On-chain coordinates

- Network: Bradbury testnet (`testnet-bradbury`)
- Contract: `0x2f27B3b57879Ec3Bd5D9CACE30ea8Aa6d85907d7`
- Explorer: https://explorer-bradbury.genlayer.com/address/0x2f27B3b57879Ec3Bd5D9CACE30ea8Aa6d85907d7
- Live studio: https://move-mark.pages.dev/
- Source: https://github.com/NAMI19622/move-mark

To deploy your own, `scripts/deploy.py` reads `GENLAYER_PRIVATE_KEY` from the
workspace `.env`, deploys, waits for ACCEPTED, writes `deployment.json`, and
seeds the worked example above. `scripts/seed.py` reseeds against an existing
deployment. Point a frontend at any deployment with `NEXT_PUBLIC_CONTRACT_ADDRESS`
and `NEXT_PUBLIC_GENLAYER_NETWORK`.

---

## Limits worth stating plainly

Not legal advice, not an inspection, not a court. No funds move on-chain. Snapshots
are plain-text notes, not photographs or biometric data, and the demo content is
safe text. The ruling is probabilistic; the backstops bound it but do not make it
infallible. An AI consensus round on Bradbury can take one to five minutes, and
the studio stages that wait as the gate lifecycle; that is expected, not an error.
