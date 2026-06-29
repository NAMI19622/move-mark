'use client';

import React from 'react';
import { explorerTx } from '../lib/config';
import { shortAddr } from '../lib/format';

export type TxPhase = 'idle' | 'signing' | 'pending' | 'accepted' | 'error';

interface Props {
  phase: TxPhase;
  hash?: string;
  message?: string;
}

const PHASE_TEXT: Record<TxPhase, string> = {
  idle: 'Logbook idle. Record evidence or file a claim to open a consensus round.',
  signing: 'Awaiting wallet signature to enter the on-chain ledger.',
  pending: 'Submitted. Validators are re-inspecting the evidence; an AI round can take 1 to 5 minutes.',
  accepted: 'Accepted. The ruling is settled on-chain and entered in the chain of custody.',
  error: 'The entry did not settle.',
};

const PHASE_COLOR: Record<TxPhase, string> = {
  idle: 'var(--ink-4)',
  signing: 'var(--wear-amber)',
  pending: 'var(--evidence-blue)',
  accepted: 'var(--trust-green)',
  error: 'var(--dispute-red)',
};

export default function TransactionStrip({ phase, hash, message }: Props) {
  const color = PHASE_COLOR[phase];
  const busy = phase === 'pending' || phase === 'signing';
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '10px 18px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(6,7,8,0.74)',
        backdropFilter: 'blur(8px)',
        minHeight: 50,
      }}
    >
      <span style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            background: color,
            animation: busy ? 'mm-pulse 1.2s ease-in-out infinite' : 'none',
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </span>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color }}>
          {phase}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--ink-2)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {message || PHASE_TEXT[phase]}
        </div>
      </div>
      {busy && (
        <div
          style={{
            position: 'relative',
            width: 120,
            height: 3,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(245,239,230,0.08)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '45%',
              height: '100%',
              background: color,
              animation: 'mm-sweep 1.6s linear infinite',
            }}
          />
        </div>
      )}
      {hash && (
        <a className="mono" href={explorerTx(hash)} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', flexShrink: 0 }}>
          {shortAddr(hash)}
        </a>
      )}
    </div>
  );
}
