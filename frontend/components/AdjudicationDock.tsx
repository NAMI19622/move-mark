'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Claim, Evaluation, SettlementReceipt } from '../lib/types';
import { bps, credits, gateColor, gateLabel, titleCase, downloadJson } from '../lib/format';
import WearCompassDial from './WearCompassDial';
import ValidatorLedger from './ValidatorLedger';
import SettlementSeal from './SettlementSeal';
import { Button } from './ui';

interface Props {
  claim: Claim;
  evaluation: Evaluation | null;
  settlement: SettlementReceipt | null;
  supportedSeverity: number;
  busy: boolean;
  sealAnim: boolean;
  reducedMotion?: boolean;
  onEvaluate: (c: Claim) => void;
  onSeal: () => void;
  onClose: () => void;
}

// The adjudication dock: a sheet that slides UP from the bottom over the floor
// plan when a claim is being ruled on. It carries the gate result, the wear
// compass dial, the validator ledger, and the settlement seal. This replaces
// the old fixed right aside borderLeft inspector.
export default function AdjudicationDock({
  claim,
  evaluation,
  settlement,
  supportedSeverity,
  busy,
  sealAnim,
  reducedMotion = false,
  onEvaluate,
  onSeal,
  onClose,
}: Props) {
  return (
    <div
      role="region"
      aria-label="Adjudication dock"
      className={reducedMotion ? undefined : 'dock-up'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '80%',
        zIndex: 26,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(12,10,7,0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '2px solid var(--border-strong)',
        borderRadius: '20px 20px 0 0',
        boxShadow: 'var(--shadow-2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="stencil" style={{ fontSize: '0.58rem', color: 'var(--ink-3)' }}>
            Adjudication gate
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.95rem',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {titleCase(claim.claimType)} | {credits(claim.claimedAmount)}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close dock"
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--ink-2)',
            fontSize: '1.05rem',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          x
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 18,
          padding: 20,
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
          <div
            style={{
              padding: 13,
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)',
              background: 'rgba(243,236,223,0.02)',
            }}
          >
            <div style={{ fontSize: '0.74rem', color: 'var(--ink-3)', lineHeight: 1.5 }}>{claim.explanation}</div>
            {!claim.evaluated && (
              <Button onClick={() => onEvaluate(claim)} disabled={busy} style={{ marginTop: 12, width: '100%' }}>
                {busy ? 'Evaluating...' : 'Pass through the gate'}
              </Button>
            )}
          </div>

          {evaluation && (
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--ink-2)',
                lineHeight: 1.5,
                padding: 13,
                borderRadius: 'var(--radius-m)',
                border: '1px solid var(--border)',
                background: 'rgba(243,236,223,0.02)',
              }}
            >
              {evaluation.reason}
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  fontSize: '0.7rem',
                  color: 'var(--ink-3)',
                }}
              >
                <span>Confidence {bps(evaluation.confidenceBps)}</span>
                <span>Recommended deduction {credits(evaluation.recommendedDeduction)}</span>
              </div>
              {evaluation.riskFlags.length > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--rust)' }}>
                  Risk: {evaluation.riskFlags.join(', ')}
                </div>
              )}
            </div>
          )}

          {evaluation && (
            <div>
              <div className="stencil" style={{ fontSize: '0.6rem', color: 'var(--ink-3)', marginBottom: 8 }}>
                Validator ledger
              </div>
              <ValidatorLedger validators={evaluation.validatorSummary} active={sealAnim} />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 14, alignContent: 'start', justifyItems: 'center' }}>
          {evaluation ? (
            <WearCompassDial
              confidenceBps={evaluation.confidenceBps}
              severity={supportedSeverity}
              gateColor={gateColor(evaluation.gateResult)}
              label={gateLabel(evaluation.gateResult)}
              reducedMotion={reducedMotion}
            />
          ) : (
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--ink-4)',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: 18,
                lineHeight: 1.5,
                textAlign: 'center',
                width: '100%',
              }}
            >
              Pass this claim through the gate to read the wear compass and validator ledger.
            </div>
          )}

          {evaluation && !settlement && (
            <Button onClick={onSeal} disabled={busy} style={{ width: '100%' }}>
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
                  width: '100%',
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
        </div>
      </div>
    </div>
  );
}
