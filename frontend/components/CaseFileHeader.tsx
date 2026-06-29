'use client';

import React from 'react';
import type { ConditionCase, Summary } from '../lib/types';
import { titleCase } from '../lib/format';
import WalletButton from './WalletButton';

interface Props {
  summary: Summary | null;
  theCase: ConditionCase | undefined;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  onAbout: () => void;
}

// A folder-tab mark stamped into the manila tab of the intake bar.
function CustodyMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden>
      <defs>
        <linearGradient id="mm-custody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0b968" />
          <stop offset="100%" stopColor="#9a6f2e" />
        </linearGradient>
      </defs>
      <path
        d="M5 9 h8 l3 3 h13 v15 a2 2 0 0 1 -2 2 h-20 a2 2 0 0 1 -2 -2 z"
        fill="none"
        stroke="url(#mm-custody)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M11 22 l4 4 l8 -9" fill="none" stroke="url(#mm-custody)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// One link in the chain-of-custody readout. Lit when that stage has evidence.
function CustodyLink({ label, count, lit, last }: { label: string; count: number; lit: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <span
          className="mono"
          style={{
            minWidth: 26,
            textAlign: 'center',
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: '0.72rem',
            fontWeight: 700,
            color: lit ? 'var(--bg-0)' : 'var(--ink-4)',
            background: lit ? 'var(--brass-2)' : 'transparent',
            border: `1px solid ${lit ? 'var(--brass-2)' : 'var(--border)'}`,
            boxShadow: lit ? '0 0 10px rgba(199,154,75,0.45)' : 'none',
          }}
        >
          {count}
        </span>
        <span
          className="stencil"
          style={{ fontSize: '0.46rem', color: lit ? 'var(--ink-2)' : 'var(--ink-4)' }}
        >
          {label}
        </span>
      </div>
      {!last && (
        <span
          style={{
            width: 14,
            height: 2,
            borderRadius: 2,
            background: lit ? 'var(--brass)' : 'var(--border)',
          }}
        />
      )}
    </div>
  );
}

// A small stamped record tag for the global ledger counts.
function LedgerTag({ label, value }: { label: string; value?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.05,
        padding: '3px 9px',
        borderLeft: '1px solid var(--border)',
      }}
    >
      <span className="mono" style={{ color: 'var(--ink)', fontSize: '0.82rem', fontWeight: 600 }}>
        {value ?? '..'}
      </span>
      <span className="stencil" style={{ fontSize: '0.46rem', color: 'var(--ink-4)' }}>
        {label}
      </span>
    </div>
  );
}

// The MoveMark intake bar: a manila folder-tab header for a forensic
// chain-of-custody desk. The left edge is a raised folder tab carrying the
// wordmark; the body is a walnut intake strip stamped with the active case
// number, a custody-chain readout, the global evidence ledger, and the
// evidence-room control toggles. Deliberately unlike the generic sibling
// logo + counter + pill-cluster header.
export default function CaseFileHeader({ summary, theCase, reducedMotion, setReducedMotion, onAbout }: Props) {
  const caseNo = theCase ? `MM-${String(theCase.seq).padStart(4, '0')}` : 'MM-----';
  const custody = theCase
    ? theCase.exitSealed
      ? 'SEALED'
      : theCase.entrySealed
      ? 'RETURN PENDING'
      : 'OPEN INTAKE'
    : 'NO FILE LOADED';
  const custodyColor = !theCase
    ? 'var(--ink-4)'
    : theCase.exitSealed
    ? 'var(--green)'
    : theCase.entrySealed
    ? 'var(--amber)'
    : 'var(--evidence)';

  return (
    <header style={{ position: 'relative', flexShrink: 0 }}>
      {/* Folder tab carrying the wordmark. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', paddingLeft: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '7px 22px 6px 14px',
            background: 'linear-gradient(180deg, rgba(75,57,37,0.95), rgba(58,44,29,0.85))',
            border: '1px solid var(--border-strong)',
            borderBottom: 'none',
            borderRadius: '10px 16px 0 0',
            clipPath: 'polygon(0 0, 86% 0, 100% 100%, 0 100%)',
            paddingRight: 30,
          }}
        >
          <CustodyMark />
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '1.08rem',
                lineHeight: 1,
                letterSpacing: '0.01em',
                color: 'var(--ink)',
              }}
            >
              MoveMark
            </div>
            <div className="stencil" style={{ fontSize: '0.5rem', color: 'var(--brass-2)', marginTop: 2 }}>
              Chain of custody desk
            </div>
          </div>
        </div>
      </div>

      {/* Intake bar body. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '9px 20px 9px 16px',
          borderTop: '2px solid var(--brass)',
          borderBottom: '1px solid var(--border-strong)',
          background:
            'repeating-linear-gradient(135deg, rgba(58,44,29,0.5) 0 14px, rgba(43,33,21,0.5) 14px 28px), var(--bg-1)',
        }}
      >
        {/* Case number stamp. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            padding: '5px 12px',
            border: '1.5px dashed var(--border-strong)',
            borderRadius: 6,
            background: 'rgba(20,17,13,0.5)',
            flexShrink: 0,
          }}
        >
          <span className="stencil" style={{ fontSize: '0.46rem', color: 'var(--ink-4)' }}>
            Case no.
          </span>
          <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--brass-2)', letterSpacing: '0.04em' }}>
            {caseNo}
          </span>
          <span
            style={{
              fontSize: '0.5rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: custodyColor,
            }}
          >
            {custody}
          </span>
        </div>

        {/* Chain-of-custody readout for the active file. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="stencil" style={{ fontSize: '0.46rem', color: 'var(--ink-4)', writingMode: 'horizontal-tb' }}>
            Custody chain
          </span>
          <CustodyLink label="Intake" count={theCase?.entryCount ?? 0} lit={(theCase?.entryCount ?? 0) > 0} />
          <CustodyLink label="Return" count={theCase?.exitCount ?? 0} lit={(theCase?.exitCount ?? 0) > 0} />
          <CustodyLink label="Dispute" count={theCase?.claimCount ?? 0} lit={(theCase?.claimCount ?? 0) > 0} last />
        </div>

        {theCase && (
          <span style={{ fontSize: '0.62rem', color: 'var(--ink-3)', flexShrink: 0 }}>
            {titleCase(theCase.assetType)}
          </span>
        )}

        {/* Global evidence ledger. */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span className="stencil" style={{ fontSize: '0.46rem', color: 'var(--ink-4)', paddingRight: 4 }}>
            On file
          </span>
          <LedgerTag label="Cases" value={summary?.cases} />
          <LedgerTag label="Snaps" value={summary?.snapshots} />
          <LedgerTag label="Claims" value={summary?.claims} />
          <LedgerTag label="Sealed" value={summary?.settlements} />
        </div>

        {/* Evidence-room control toggles (squared lockers, not a pill row). */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexShrink: 0 }}>
          <button
            onClick={() => setReducedMotion(!reducedMotion)}
            title="Toggle reduced motion"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '5px 11px',
              background: reducedMotion ? 'transparent' : 'rgba(199,154,75,0.12)',
              border: '1px solid var(--border)',
              borderRight: 'none',
              borderRadius: '5px 0 0 5px',
            }}
          >
            <span className="stencil" style={{ fontSize: '0.44rem', color: 'var(--ink-4)' }}>
              Motion
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: reducedMotion ? 'var(--ink-4)' : 'var(--brass-2)' }}>
              {reducedMotion ? 'HELD' : 'LIVE'}
            </span>
          </button>
          <button
            onClick={onAbout}
            title="Open the field manual"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '5px 11px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '0 5px 5px 0',
            }}
          >
            <span className="stencil" style={{ fontSize: '0.44rem', color: 'var(--ink-4)' }}>
              Manual
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--ink-2)' }}>FIELD</span>
          </button>
        </div>

        <WalletButton />
      </div>
    </header>
  );
}
