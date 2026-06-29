# Frontend Design Contract

## screenArchitecture
split-pane-workspace. An inspection studio: left case docket, center inspection
bench, right adjudication inspector. Not a landing page, not a feed.

## aboveTheFold
On first load the user lands inside the studio, not a marketing page. The center
shows the living SpaceMapCanvas, a warm floor-plan with luminous zone markers for
the active case, read live from the contract in read-only mode. The left rail is
the case docket with per-case snapshot and claim counts. The right rail is the
adjudication inspector waiting for a claim. A bottom transaction theater is idle.

## primaryInteraction
Select a case, record entry and exit snapshots, file a dispute claim in the
center composer, and pass it through the adjudication gate. Recording, filing,
evaluating, and sealing are real on-chain writes; the gate stages the consensus
lifecycle as an inspection sweep crosses the condition map, the validator ledger
stamps in sequence, a brass compass dial swings to the confidence, and a wax
settlement seal stamps on the sealed receipt. This is not submit-text-then-feed:
the claim is judged against a persisted, owned chain of custody and produces a
seven-way contextual outcome.

## layoutMap
- Left rail: case docket, per-case snapshot and claim counts, summary tallies,
  wallet.
- Center: SpaceMapCanvas on top, then the EvidenceMatchRibbon linking entry to
  exit, then the claim composer, then the claim list; during evaluation the map
  becomes the inspection stage.
- Right rail: WearCompassDial, the ValidatorLedger (six condition validators),
  and the SettlementSeal medallion for the sealed receipt.
- Bottom: TransactionTheater staging PENDING to ACCEPTED with the tx hash.

## visualMetaphor
A field inspector's bench. A warm charcoal-and-walnut floor plan with brass and
evidence-blue markers: evidence blue for pre-existing conditions, rust for new
damage, sage for clean, brass for wear. A wax settlement seal is stamped on the
final decision.

## motionSystem
1. SpaceMapCanvas loop: a floor-plan grid with breathing zone markers,
   device-pixel-ratio aware, paused when the tab is hidden, disabled under
   prefers-reduced-motion.
2. Studio entry sequence: zone markers ease outward onto the plan along a
   golden-angle spiral on first mount.
3. Pointer-reactive map: markers flex and brighten toward the cursor.
4. Gate lifecycle animation: on evaluate, an inspection sweep line crosses the
   condition map while the TransactionTheater advances PENDING to ACCEPTED and
   the validator ledger stamps in sequence.
5. On-chain state update: a brass WearCompassDial needle swings to the settled
   confidence and a wax SettlementSeal stamps with a spring when the receipt
   seals; a flagged outcome tints the floor plan rust.

## effectStack
- Device-pixel-ratio aware canvas SpaceMapCanvas with a floor-plan marker field.
- SVG EvidenceMatchRibbon that links exit issues back to their entry origin.
- Brass WearCompassDial gauge with a needle and severity arc.
- Wax SettlementSeal medallion stamp animation on decision.
- ValidatorLedger progressive reveal tied to transaction status.

## componentShapeLanguage
Floor plans, evidence ribbons, brass gauges, and wax seals. Cases as docket
entries, snapshots as ribbon nodes, evaluations as gauge readings, settlements as
engraved medallions, validators as a stamped ledger column. No generic cards as
the primary surface.

## customVisualComponents
1. SpaceMapCanvas (canvas floor plan with luminous zone markers and an
   inspection sweep).
2. EvidenceMatchRibbon (SVG ribbon linking entry and exit snapshots, lighting
   pre-existing overlaps and matched evidence).
3. WearCompassDial (brass gauge whose needle reads confidence and whose arc reads
   supported severity).
4. SettlementSeal (wax medallion that stamps the gate result and proof hash).
5. ValidatorLedger (the six condition validators stamping in sequence).
6. TransactionTheater (consensus lifecycle theater bound to tx status).

## bannedFromThisBuild
- No generic centered marketing hero.
- No equal feature cards.
- No horizontal stats strip under a hero.
- No chip row under a hero.
- No submit-form-to-feed main skeleton.
- No three-column footer.
- No dark-navy plus purple crypto gradient identity.
- No glassmorphism as the identity.

## proofOfDifference
Versus persona-seal (a consent atelier built on concentric persona membranes and
wax consent seals), MoveMark is an inspection studio built on a warm floor-plan
condition map, an entry-to-exit evidence ribbon, and a brass inspector's compass.
The contract mechanic is a two-phase evidence comparison adjudicated into a
seven-way support gradient with a recommended deduction, distinct from a
persona-scoped six-way consent gate. The palette is charcoal and walnut with
brass-gold and evidence-blue, not ink-black with boundary violet and seal cyan.
