'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store';
import { api, writeAndWait } from '../lib/genlayer';
import type { ConditionCase, Snapshot, Claim, Evaluation, SettlementReceipt } from '../lib/types';
import { credits, gateColor, gateLabel, isSupport, severityWeight, titleCase } from '../lib/format';

import SpaceMapCanvas, { ZoneData, EvidencePin, PinState } from '../components/SpaceMapCanvas';
import TransactionTheater, { TxPhase } from '../components/TransactionTheater';
import CaseTabStrip from '../components/CaseTabStrip';
import CaseFileHeader from '../components/CaseFileHeader';
import BeforeAfterLightbox from '../components/BeforeAfterLightbox';
import AdjudicationDock from '../components/AdjudicationDock';
import CaseForm from '../components/CaseForm';
import SnapshotForm from '../components/SnapshotForm';
import ClaimComposer, { ClaimDraft } from '../components/ClaimComposer';
import AboutDrawer from '../components/AboutDrawer';
import { Modal, Button, Toast } from '../components/ui';

export default function WorkbenchPage() {
  const store = useStore();
  const { cases, summary, wallet, reducedMotion, setReducedMotion, refresh } = store;

  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [settlement, setSettlement] = useState<SettlementReceipt | null>(null);

  const [txPhase, setTxPhase] = useState<TxPhase>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [txMessage, setTxMessage] = useState<string | undefined>();
  const [gateProgress, setGateProgress] = useState(-1);
  const [sealAnim, setSealAnim] = useState(false);

  const [showAbout, setShowAbout] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showClaimComposer, setShowClaimComposer] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showClaimTray, setShowClaimTray] = useState(false);
  const [snapshotPhase, setSnapshotPhase] = useState<'entry' | 'exit' | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: 'ok' | 'err' } | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const notify = useCallback((message: string, kind: 'ok' | 'err') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    if (!activeCase && cases.length > 0) setActiveCase(cases[0].id);
  }, [cases, activeCase]);

  const theCase: ConditionCase | undefined = useMemo(
    () => cases.find((c) => c.id === activeCase),
    [cases, activeCase],
  );

  const loadCaseData = useCallback(async (caseId: string) => {
    try {
      const snapPage = await api.getSnapshotsForCase(caseId, 0, 20);
      setSnapshots(snapPage.items);
    } catch {
      setSnapshots([]);
    }
    try {
      const claimPage = await api.getClaimsForCase(caseId, 0, 20);
      setClaims(claimPage.items);
    } catch {
      setClaims([]);
    }
  }, []);

  useEffect(() => {
    if (activeCase) loadCaseData(activeCase);
    setActiveClaim(null);
    setEvaluation(null);
    setSettlement(null);
    setShowLightbox(false);
  }, [activeCase, loadCaseData]);

  const entrySnaps = useMemo(() => snapshots.filter((s) => s.phase === 'entry'), [snapshots]);
  const exitSnaps = useMemo(() => snapshots.filter((s) => s.phase === 'exit'), [snapshots]);

  // Derive the floor-plan zones and their evidence pins from the snapshots.
  // Each snapshot becomes a pin inside its zone room; the pin state is the
  // entry/exit condition delta. Exit evidence wins when a zone is captured at
  // both phases. Zones named in an evaluated-but-flagged claim are contested.
  const disputedExitIds = useMemo(() => {
    const ids = new Set<string>();
    if (evaluation) evaluation.unsupportedIssueIds.forEach((id) => ids.add(id));
    return ids;
  }, [evaluation]);

  const floorZones: ZoneData[] = useMemo(() => {
    const entryKeys = new Set(
      entrySnaps.filter((s) => s.issueType !== 'none').map((s) => `${s.zone}|${s.item}|${s.issueType}`),
    );
    const byZone = new Map<string, EvidencePin[]>();
    const pushPin = (zoneName: string, pin: EvidencePin) => {
      const key = zoneName || 'space';
      if (!byZone.has(key)) byZone.set(key, []);
      byZone.get(key)!.push(pin);
    };

    const sourced = exitSnaps.length > 0 ? exitSnaps : entrySnaps;
    const fromExit = exitSnaps.length > 0;
    sourced.forEach((s) => {
      let state: PinState = 'clean';
      if (!fromExit) {
        state = 'clean';
      } else if (s.issueType === 'none') {
        state = 'clean';
      } else if (disputedExitIds.has(s.id)) {
        state = 'disputed';
      } else if (entryKeys.has(`${s.zone}|${s.item}|${s.issueType}`)) {
        state = 'preexisting';
      } else if (s.issueType === 'wear') {
        state = 'wear';
      } else {
        state = 'new';
      }
      pushPin(s.zone, {
        id: s.id,
        item: s.item || s.zone || 'item',
        state,
        severity: severityWeight(s.severity),
        issueLabel: titleCase(s.issueType === 'none' ? state : s.issueType),
      });
    });

    return Array.from(byZone.entries()).map(([zone, pins]) => ({ zone, pins }));
  }, [entrySnaps, exitSnaps, disputedExitIds]);

  const floorEmpty = floorZones.length === 0;

  const selectClaim = useCallback(async (c: Claim) => {
    setActiveClaim(c);
    setEvaluation(null);
    setSettlement(null);
    setSealAnim(false);
    setShowClaimTray(false);
    if (c.evaluated) {
      try {
        const ev = await api.getEvaluation(c.id);
        setEvaluation(ev);
      } catch {
        /* none */
      }
      try {
        const s = await api.getSettlementForClaim(c.id);
        setSettlement(s);
      } catch {
        /* none */
      }
    }
  }, []);

  const startGateAnimation = useCallback(() => {
    setGateProgress(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setGateProgress((p) => {
        if (p < 0) return p;
        const next = p + 0.02;
        return next >= 0.98 ? 0.05 : next;
      });
    }, 90);
  }, []);

  const stopGateAnimation = useCallback(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setGateProgress(-1);
  }, []);

  const onFileClaim = useCallback(
    async (draft: ClaimDraft) => {
      if (!theCase) return;
      if (!draft.id || !draft.explanation) {
        notify('A claim id and explanation are required.', 'err');
        return;
      }
      try {
        if (!wallet) await store.connect();
        setShowClaimComposer(false);
        setTxPhase('signing');
        setTxMessage('Filing the dispute claim on-chain.');
        await writeAndWait(
          'submit_claim',
          [
            draft.id,
            theCase.id,
            draft.claimType,
            draft.claimant,
            draft.respondent,
            draft.claimedAmount,
            draft.explanation,
            draft.requestedOutcome,
          ],
          (p) => {
            if (p.hash) setTxHash(p.hash);
            if (p.statusName === 'PENDING') {
              setTxPhase('pending');
              setTxMessage('Claim filed. Now opening the adjudication gate.');
            }
          },
        );
        await loadCaseData(theCase.id);
        notify('Claim filed. Passing it through the gate.', 'ok');

        setTxPhase('signing');
        setTxMessage('Signing the adjudication. Validators will deliberate.');
        startGateAnimation();
        const { hash } = await writeAndWait('evaluate_condition_claim', [draft.id], (p) => {
          if (p.hash) setTxHash(p.hash);
          if (p.statusName === 'PENDING') {
            setTxPhase('pending');
            setTxMessage('The gate is deliberating. An AI consensus round can take 1 to 5 minutes.');
          }
        });
        stopGateAnimation();
        setTxPhase('accepted');
        setTxMessage('Decision settled. Evaluation recorded on-chain.');
        setTxHash(hash);

        const c = await api.getClaim(draft.id);
        await selectClaim(c);
        setSealAnim(true);
        await loadCaseData(theCase.id);
        await refresh();
        const ev = await api.getEvaluation(draft.id);
        notify('Gate settled: ' + gateLabel(ev.gateResult), 'ok');
      } catch (e: any) {
        stopGateAnimation();
        setTxPhase('error');
        setTxMessage(e?.message || 'The gate did not settle.');
        notify(e?.message || 'Transaction failed.', 'err');
      }
    },
    [theCase, wallet, store, loadCaseData, notify, refresh, selectClaim, startGateAnimation, stopGateAnimation],
  );

  const evaluateExisting = useCallback(
    async (c: Claim) => {
      if (!theCase) return;
      try {
        if (!wallet) await store.connect();
        setTxPhase('signing');
        setTxMessage('Signing the adjudication.');
        startGateAnimation();
        const { hash } = await writeAndWait('evaluate_condition_claim', [c.id], (p) => {
          if (p.hash) setTxHash(p.hash);
          if (p.statusName === 'PENDING') {
            setTxPhase('pending');
            setTxMessage('The gate is deliberating. An AI consensus round can take 1 to 5 minutes.');
          }
        });
        stopGateAnimation();
        setTxPhase('accepted');
        setTxHash(hash);
        setTxMessage('Decision settled. Evaluation recorded on-chain.');
        const updated = await api.getClaim(c.id);
        await selectClaim(updated);
        setSealAnim(true);
        await loadCaseData(theCase.id);
        await refresh();
        const ev = await api.getEvaluation(c.id);
        notify('Gate settled: ' + gateLabel(ev.gateResult), 'ok');
      } catch (e: any) {
        stopGateAnimation();
        setTxPhase('error');
        setTxMessage(e?.message || 'The gate did not settle.');
        notify(e?.message || 'Transaction failed.', 'err');
      }
    },
    [theCase, wallet, store, loadCaseData, notify, refresh, selectClaim, startGateAnimation, stopGateAnimation],
  );

  const sealSettlement = useCallback(async () => {
    if (!activeClaim) return;
    try {
      if (!wallet) await store.connect();
      setTxPhase('signing');
      setTxMessage('Sealing the settlement receipt on-chain.');
      const { hash } = await writeAndWait('create_settlement_receipt', [activeClaim.id], (p) => {
        if (p.hash) setTxHash(p.hash);
        if (p.statusName === 'PENDING') setTxPhase('pending');
      });
      setTxPhase('accepted');
      setTxHash(hash);
      setTxMessage('Settlement sealed.');
      const s = await api.getSettlementForClaim(activeClaim.id);
      setSettlement(s);
      setSealAnim(true);
      await refresh();
      notify('Settlement receipt sealed.', 'ok');
    } catch (e: any) {
      setTxPhase('error');
      notify(e?.message || 'Settlement failed.', 'err');
    }
  }, [activeClaim, wallet, store, refresh, notify]);

  const busy = txPhase === 'pending' || txPhase === 'signing';
  const flagged = !!evaluation && !isSupport(evaluation.gateResult);
  const supportedSeverity = useMemo(() => {
    if (!evaluation) return 0;
    let m = 0;
    exitSnaps.forEach((s) => {
      if (evaluation.matchedExitIds.includes(s.id)) m = Math.max(m, severityWeight(s.severity));
    });
    return m;
  }, [evaluation, exitSnaps]);

  const evidenceCount = entrySnaps.length + exitSnaps.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <CaseFileHeader
        summary={summary}
        theCase={theCase}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        onAbout={() => setShowAbout(true)}
      />

      {/* TOP STRIP of case file tabs (replaces the old left rail). */}
      <CaseTabStrip activeCase={activeCase} onSelectCase={setActiveCase} onNewCase={() => setShowCaseForm(true)} />

      {/* The dominant surface: a large floor-plan inspection table. Overlays
          (evidence lightbox, adjudication dock, claim tray) open over it. No
          flanking asides, no split pane. */}
      <main style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <SpaceMapCanvas
          zones={floorZones}
          title={theCase?.title || 'MoveMark inspection floor'}
          reducedMotion={reducedMotion}
          gateProgress={gateProgress}
          gateColor={evaluation ? gateColor(evaluation.gateResult) : '#c79a4b'}
          flagged={flagged}
          empty={!theCase || floorEmpty}
        />

        {theCase ? (
          <>
            {/* Case dossier overlay, pinned to the top-left of the floor. */}
            <div
              style={{
                position: 'absolute',
                left: 18,
                top: 64,
                maxWidth: 260,
                padding: 14,
                borderRadius: 'var(--radius-l)',
                border: '1px solid var(--border)',
                background: 'rgba(15,12,9,0.74)',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            >
              <div className="stencil" style={{ fontSize: '0.56rem', color: 'var(--ink-3)' }}>
                On the table
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--ink)', lineHeight: 1.25, marginTop: 2 }}>
                {theCase.title}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-3)', marginTop: 6 }}>
                {titleCase(theCase.assetType)} | deposit {credits(theCase.depositAmount)}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: '0.62rem', color: 'var(--ink-4)' }}>
                <FloorStat label="Entry" value={theCase.entryCount} />
                <FloorStat label="Exit" value={theCase.exitCount} />
                <FloorStat label="Claims" value={theCase.claimCount} />
              </div>
            </div>

            {/* Seeded empty-state call to action when the case has no evidence. */}
            {floorEmpty && (
              <div
                className="rise"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '52%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: 380,
                  textAlign: 'center',
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-l)',
                  border: '1px solid var(--border-strong)',
                  background: 'rgba(15,12,9,0.86)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: 'var(--shadow-2)',
                }}
              >
                <div className="stencil" style={{ fontSize: '0.56rem', color: 'var(--brass-2)' }}>
                  Awaiting evidence intake
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem',
                    color: 'var(--ink)',
                    marginTop: 6,
                    lineHeight: 1.3,
                  }}
                >
                  This floor plan is laid out and ready.
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 8 }}>
                  The blueprint rooms above are seeded placeholders. Record an entry snapshot at handover and an exit
                  snapshot at return to pin real condition evidence into each zone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
                  <Button onClick={() => setSnapshotPhase('entry')} style={{ padding: '8px 16px', fontSize: '0.76rem' }}>
                    Add entry evidence
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setSnapshotPhase('exit')}
                    style={{ padding: '8px 16px', fontSize: '0.76rem' }}
                  >
                    Add exit evidence
                  </Button>
                </div>
              </div>
            )}

            {/* Floating tool cluster, top-right of the floor. */}
            <div
              style={{
                position: 'absolute',
                right: 18,
                top: 64,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'flex-end',
              }}
            >
              <Button
                onClick={() => setShowLightbox(true)}
                style={{ padding: '7px 14px', fontSize: '0.74rem' }}
              >
                Inspect evidence ({evidenceCount})
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowClaimComposer(true)}
                style={{ padding: '7px 14px', fontSize: '0.74rem' }}
              >
                File a dispute claim
              </Button>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="ghost"
                  onClick={() => setSnapshotPhase('entry')}
                  style={{ padding: '6px 11px', fontSize: '0.7rem' }}
                >
                  Add entry
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSnapshotPhase('exit')}
                  style={{ padding: '6px 11px', fontSize: '0.7rem' }}
                >
                  Add exit
                </Button>
              </div>
            </div>

            {/* Claims tray toggle, pinned bottom-left of the floor. */}
            <div style={{ position: 'absolute', left: 18, bottom: 18, width: 280, maxWidth: '46%' }}>
              <button
                onClick={() => setShowClaimTray((v) => !v)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 13px',
                  borderRadius: showClaimTray ? '12px 12px 0 0' : 'var(--radius-m)',
                  border: '1px solid var(--border)',
                  background: 'rgba(15,12,9,0.82)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span className="stencil" style={{ fontSize: '0.58rem', color: 'var(--ink-3)' }}>
                  Claims docket ({claims.length})
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-3)' }}>{showClaimTray ? 'hide' : 'show'}</span>
              </button>
              {showClaimTray && (
                <div
                  className="rise"
                  style={{
                    maxHeight: 240,
                    overflowY: 'auto',
                    padding: 10,
                    display: 'grid',
                    gap: 8,
                    borderRadius: '0 0 12px 12px',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    background: 'rgba(15,12,9,0.92)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {claims.length === 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
                      No claims filed against this case yet.
                    </div>
                  )}
                  {claims.map((c) => {
                    const active = c.id === activeClaim?.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => selectClaim(c)}
                        style={{
                          textAlign: 'left',
                          padding: 10,
                          borderRadius: 'var(--radius-m)',
                          border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                          background: active ? 'rgba(199,154,75,0.1)' : 'rgba(243,236,223,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--ink)' }}>
                            {titleCase(c.claimType)}
                          </span>
                          <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--brass-2)' }}>
                            {credits(c.claimedAmount)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.62rem',
                            color: c.evaluated ? 'var(--green)' : 'var(--ink-4)',
                            marginTop: 4,
                          }}
                        >
                          {c.evaluated ? 'evaluated' : 'awaiting gate'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              textAlign: 'center',
              padding: 40,
              pointerEvents: 'none',
            }}
          >
            <p style={{ color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 360 }}>
              No case on the inspection table. Pick a case file from the strip above, or open a new one to start a
              chain of custody.
            </p>
            <div style={{ pointerEvents: 'auto' }}>
              <Button onClick={() => setShowCaseForm(true)}>Open a condition case</Button>
            </div>
          </div>
        )}

        {/* Before/after evidence lightbox: bottom sheet over the floor plan. */}
        {showLightbox && theCase && (
          <BeforeAfterLightbox
            title={theCase.title}
            entry={entrySnaps}
            exit={exitSnaps}
            matchedEntryIds={evaluation?.matchedEntryIds}
            matchedExitIds={evaluation?.matchedExitIds}
            reducedMotion={reducedMotion}
            onClose={() => setShowLightbox(false)}
            onAddEntry={() => setSnapshotPhase('entry')}
            onAddExit={() => setSnapshotPhase('exit')}
          />
        )}

        {/* Adjudication dock: sheet that slides up over the floor plan. */}
        {activeClaim && (
          <AdjudicationDock
            claim={activeClaim}
            evaluation={evaluation}
            settlement={settlement}
            supportedSeverity={supportedSeverity}
            busy={busy}
            sealAnim={sealAnim}
            reducedMotion={reducedMotion}
            onEvaluate={evaluateExisting}
            onSeal={sealSettlement}
            onClose={() => setActiveClaim(null)}
          />
        )}
      </main>

      <TransactionTheater phase={txPhase} hash={txHash} message={txMessage} />

      {showAbout && <AboutDrawer onClose={() => setShowAbout(false)} />}
      {showCaseForm && <CaseForm onClose={() => setShowCaseForm(false)} onDone={notify} />}
      {showClaimComposer && theCase && (
        <Modal title="File a dispute claim" onClose={() => setShowClaimComposer(false)} wide>
          <ClaimComposer onSubmit={onFileClaim} busy={busy} />
        </Modal>
      )}
      {snapshotPhase && theCase && (
        <SnapshotForm
          caseId={theCase.id}
          phase={snapshotPhase}
          onClose={() => setSnapshotPhase(null)}
          onDone={notify}
        />
      )}
      {toast && <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />}
    </div>
  );
}

function FloorStat({ label, value }: { label: string; value?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
      <span className="mono" style={{ color: 'var(--ink-2)', fontSize: '0.8rem' }}>
        {value ?? 0}
      </span>
      <span style={{ fontSize: '0.54rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}
