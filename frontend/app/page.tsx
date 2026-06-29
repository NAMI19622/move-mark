'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../lib/store';
import { api, writeAndWait } from '../lib/genlayer';
import type { ConditionCase, Snapshot, Claim, Evaluation, SettlementReceipt } from '../lib/types';
import { bps, credits, gateColor, gateLabel, isSupport, severityWeight, titleCase, downloadJson } from '../lib/format';

import SpaceMapCanvas, { ZoneMarker } from '../components/SpaceMapCanvas';
import EvidenceMatchRibbon from '../components/EvidenceMatchRibbon';
import WearCompassDial from '../components/WearCompassDial';
import SettlementSeal from '../components/SettlementSeal';
import ValidatorLedger from '../components/ValidatorLedger';
import TransactionTheater, { TxPhase } from '../components/TransactionTheater';
import CaseRail from '../components/CaseRail';
import CaseForm from '../components/CaseForm';
import SnapshotForm from '../components/SnapshotForm';
import ClaimComposer, { ClaimDraft } from '../components/ClaimComposer';
import ClaimList from '../components/ClaimList';
import AboutDrawer from '../components/AboutDrawer';
import WalletButton from '../components/WalletButton';
import { Button, Toast } from '../components/ui';

export default function StudioPage() {
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
  }, [activeCase, loadCaseData]);

  const entrySnaps = useMemo(() => snapshots.filter((s) => s.phase === 'entry'), [snapshots]);
  const exitSnaps = useMemo(() => snapshots.filter((s) => s.phase === 'exit'), [snapshots]);

  // Derive zone markers for the canvas from the entry/exit comparison.
  const zoneMarkers: ZoneMarker[] = useMemo(() => {
    const entryKeys = new Set(
      entrySnaps.filter((s) => s.issueType !== 'none').map((s) => `${s.zone}|${s.item}|${s.issueType}`),
    );
    const markers: ZoneMarker[] = [];
    exitSnaps.forEach((s) => {
      const key = `${s.zone}|${s.item}|${s.issueType}`;
      let state: ZoneMarker['state'] = 'clean';
      if (s.issueType === 'none') state = 'clean';
      else if (entryKeys.has(key)) state = 'preexisting';
      else if (s.issueType === 'wear') state = 'wear';
      else state = 'new';
      markers.push({ zone: s.zone || s.item, state, severity: severityWeight(s.severity) });
    });
    if (markers.length === 0) {
      entrySnaps.forEach((s) =>
        markers.push({ zone: s.zone || s.item, state: 'clean', severity: severityWeight(s.severity) }),
      );
    }
    return markers;
  }, [entrySnaps, exitSnaps]);

  const selectClaim = useCallback(async (c: Claim) => {
    setActiveClaim(c);
    setEvaluation(null);
    setSettlement(null);
    setSealAnim(false);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarkLogo />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', lineHeight: 1 }}>
              MoveMark
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--ink-3)' }}>Condition verification for shared spaces</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginLeft: 22, fontSize: '0.72rem', color: 'var(--ink-3)' }}>
          <Stat label="Cases" value={summary?.cases} />
          <Stat label="Snapshots" value={summary?.snapshots} />
          <Stat label="Claims" value={summary?.claims} />
          <Stat label="Sealed" value={summary?.settlements} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            title="Toggle reduced motion"
            style={{
              fontSize: '0.7rem',
              color: 'var(--ink-3)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 11px',
            }}
          >
            {reducedMotion ? 'Motion off' : 'Motion on'}
          </button>
          <button
            onClick={() => setShowAbout(true)}
            style={{
              fontSize: '0.72rem',
              color: 'var(--ink-2)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 13px',
            }}
          >
            Field manual
          </button>
          <WalletButton />
        </div>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '270px 1fr 350px', minHeight: 0 }}>
        {/* left rail */}
        <aside style={{ borderRight: '1px solid var(--border)', padding: 16, overflow: 'hidden' }}>
          <CaseRail activeCase={activeCase} onSelectCase={setActiveCase} onNewCase={() => setShowCaseForm(true)} />
        </aside>

        {/* center inspection bench */}
        <main style={{ overflowY: 'auto', padding: '18px 24px', display: 'grid', gap: 18, alignContent: 'start' }}>
          <section
            style={{
              height: 320,
              borderRadius: 'var(--radius-l)',
              border: '1px solid var(--border)',
              background: 'radial-gradient(600px 400px at 50% 50%, rgba(199,154,75,0.06), transparent 70%)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <SpaceMapCanvas
              zones={zoneMarkers}
              title={theCase?.title || 'MoveMark'}
              reducedMotion={reducedMotion}
              gateProgress={gateProgress}
              gateColor={evaluation ? gateColor(evaluation.gateResult) : '#c79a4b'}
              flagged={flagged}
            />
          </section>

          {theCase ? (
            <>
              <section style={panelStyle}>
                <SectionTitle
                  title="Entry and exit snapshots"
                  right={
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button
                        variant="ghost"
                        onClick={() => setSnapshotPhase('entry')}
                        style={{ padding: '5px 11px', fontSize: '0.7rem' }}
                      >
                        Add entry
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setSnapshotPhase('exit')}
                        style={{ padding: '5px 11px', fontSize: '0.7rem' }}
                      >
                        Add exit
                      </Button>
                    </div>
                  }
                />
                {entrySnaps.length === 0 && exitSnaps.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
                    No snapshots recorded. Capture the condition at handover and at return to build the evidence
                    ribbon.
                  </div>
                ) : (
                  <EvidenceMatchRibbon
                    entry={entrySnaps}
                    exit={exitSnaps}
                    matchedEntryIds={evaluation?.matchedEntryIds}
                    matchedExitIds={evaluation?.matchedExitIds}
                    reducedMotion={reducedMotion}
                  />
                )}
              </section>

              <section style={panelStyle}>
                <SectionTitle title="File a dispute claim" />
                <ClaimComposer onSubmit={onFileClaim} busy={busy} />
              </section>

              <section style={panelStyle}>
                <SectionTitle title="Claims against this case" />
                <ClaimList claims={claims} activeId={activeClaim?.id || null} onSelect={selectClaim} />
              </section>
            </>
          ) : (
            <EmptyBench onNewCase={() => setShowCaseForm(true)} />
          )}
        </main>

        {/* right adjudication inspector */}
        <aside style={{ borderLeft: '1px solid var(--border)', padding: 16, overflowY: 'auto' }}>
          <SectionTitle title="Adjudication gate" />
          {activeClaim ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 'var(--radius-m)',
                  border: '1px solid var(--border)',
                  background: 'rgba(243,236,223,0.02)',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                  {titleCase(activeClaim.claimType)}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--ink-3)', lineHeight: 1.4 }}>
                  {activeClaim.explanation}
                </div>
                {!activeClaim.evaluated && (
                  <Button onClick={() => evaluateExisting(activeClaim)} disabled={busy} style={{ marginTop: 12, width: '100%' }}>
                    {busy ? 'Evaluating...' : 'Pass through the gate'}
                  </Button>
                )}
              </div>

              {evaluation && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <WearCompassDial
                      confidenceBps={evaluation.confidenceBps}
                      severity={supportedSeverity}
                      gateColor={gateColor(evaluation.gateResult)}
                      label={gateLabel(evaluation.gateResult)}
                      reducedMotion={reducedMotion}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--ink-2)',
                      lineHeight: 1.5,
                      padding: 12,
                      borderRadius: 'var(--radius-m)',
                      border: '1px solid var(--border)',
                      background: 'rgba(243,236,223,0.02)',
                    }}
                  >
                    {evaluation.reason}
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.7rem', color: 'var(--ink-3)' }}>
                      <span>Confidence {bps(evaluation.confidenceBps)}</span>
                      <span>Recommended deduction {credits(evaluation.recommendedDeduction)}</span>
                    </div>
                    {evaluation.riskFlags.length > 0 && (
                      <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--rust)' }}>
                        Risk: {evaluation.riskFlags.join(', ')}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="stencil" style={{ fontSize: '0.6rem', color: 'var(--ink-3)', marginBottom: 8 }}>
                      Validator ledger
                    </div>
                    <ValidatorLedger validators={evaluation.validatorSummary} active={sealAnim} />
                  </div>

                  {!settlement && (
                    <Button onClick={sealSettlement} disabled={busy} style={{ width: '100%' }}>
                      Seal settlement receipt
                    </Button>
                  )}

                  <AnimatePresence>
                    {settlement && (
                      <motion.div
                        key={settlement.id}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 12,
                          padding: 14,
                          borderRadius: 'var(--radius-m)',
                          border: '1px solid var(--border)',
                          background: 'rgba(243,236,223,0.02)',
                        }}
                      >
                        <SettlementSeal
                          gate={settlement.gateResult}
                          outcomeLabel={settlement.outcomeLabel}
                          proofHash={settlement.proofHash}
                          color={gateColor(settlement.gateResult)}
                          animate={sealAnim && !reducedMotion}
                        />
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.7rem', color: 'var(--ink-3)' }}>
                          <span>Deposit {credits(settlement.depositAmount)}</span>
                          <span>Deduction {credits(settlement.settledDeduction)}</span>
                          <span>Returned {credits(settlement.returnedToUser)}</span>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => downloadJson(`${settlement.id}.json`, settlement)}
                          style={{ width: '100%' }}
                        >
                          Export receipt JSON
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          ) : (
            <ValidatorLedger validators={[]} />
          )}
        </aside>
      </div>

      <TransactionTheater phase={txPhase} hash={txHash} message={txMessage} />

      {showAbout && <AboutDrawer onClose={() => setShowAbout(false)} />}
      {showCaseForm && <CaseForm onClose={() => setShowCaseForm(false)} onDone={notify} />}
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

const panelStyle: React.CSSProperties = {
  borderRadius: 'var(--radius-l)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  padding: 18,
};

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
      <span className="mono" style={{ color: 'var(--ink)', fontSize: '0.9rem' }}>
        {value ?? '..'}
      </span>
      <span style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <span className="stencil" style={{ fontSize: '0.62rem', color: 'var(--ink-3)' }}>
        {title}
      </span>
      {right}
    </div>
  );
}

function EmptyBench({ onNewCase }: { onNewCase: () => void }) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-l)',
        border: '1px dashed var(--border)',
        padding: 40,
        textAlign: 'center',
        color: 'var(--ink-3)',
      }}
    >
      <p style={{ marginBottom: 14, lineHeight: 1.6 }}>
        No case selected. Open a condition case on the left to begin recording snapshots and filing claims.
      </p>
      <Button onClick={onNewCase}>Open a condition case</Button>
    </div>
  );
}

function MarkLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <defs>
        <radialGradient id="mm-mark" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#e0b968" />
          <stop offset="60%" stopColor="#c79a4b" />
          <stop offset="100%" stopColor="#5b9bd5" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="26" height="26" rx="5" fill="none" stroke="url(#mm-mark)" strokeWidth="1.6" />
      <path d="M 10 22 L 16 12 L 20 19 L 24 13" fill="none" stroke="url(#mm-mark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="13" r="2.4" fill="url(#mm-mark)" />
    </svg>
  );
}
