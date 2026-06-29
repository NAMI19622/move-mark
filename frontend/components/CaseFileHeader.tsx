'use client';

import React from 'react';
import type { ConditionCase, Summary } from '../lib/types';
import WalletButton from './WalletButton';

interface Props {
  summary: Summary | null;
  theCase: ConditionCase | undefined;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  onAbout: () => void;
}

// A folder-tab custody mark stamped at the head of the spine.
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

// A tiny stacked evidence chip for the custody-chain and global ledger counts.
function SpineChip({ label, value, lit }: { label: string; value?: number; lit?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        lineHeight: 1.05,
        padding: '3px 0',
        width: 40,
        borderRadius: 5,
        border: `1px solid ${lit ? 'var(--brass-2)' : 'var(--border)'}`,
        background: lit ? 'rgba(199,154,75,0.14)' : 'rgba(20,17,13,0.4)',
        boxShadow: lit ? '0 0 8px rgba(199,154,75,0.35)' : 'none',
      }}
    >
      <span
        className="mono"
        style={{ fontSize: '0.74rem', fontWeight: 700, color: lit ? 'var(--brass-2)' : 'var(--ink-3)' }}
      >
        {value ?? '..'}
      </span>
      <span className="stencil" style={{ fontSize: '0.4rem', color: 'var(--ink-4)' }}>
        {label}
      </span>
    </div>
  );
}

// A squared evidence-room locker control sitting in the spine.
function SpineButton({
  onClick,
  title,
  top,
  bottom,
  active,
}: {
  onClick: () => void;
  title: string;
  top: string;
  bottom: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        width: 44,
        height: 44,
        borderRadius: 6,
        border: `1px solid ${active ? 'var(--brass-2)' : 'var(--border)'}`,
        background: active ? 'rgba(199,154,75,0.12)' : 'rgba(20,17,13,0.4)',
      }}
    >
      <span className="stencil" style={{ fontSize: '0.4rem', color: 'var(--ink-4)' }}>
        {top}
      </span>
      <span
        style={{ fontSize: '0.62rem', fontWeight: 700, color: active ? 'var(--brass-2)' : 'var(--ink-2)' }}
      >
        {bottom}
      </span>
    </button>
  );
}

// The MoveMark custody spine: a thin vertical gutter running top-to-bottom down
// the left edge of the viewport. Stacked vertically from the top: the custody
// mark, the case number stamped as a rotated spine label, the custody status,
// the custody-chain and global-ledger chips, and the evidence-room controls
// (motion, field manual, wallet) as squared locker buttons. There is no
// full-width horizontal bar; the chrome lives entirely off the top.
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
    <aside
      style={{
        position: 'relative',
        flexShrink: 0,
        width: 70,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0 14px',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRight: '2px solid var(--brass)',
        background:
          'repeating-linear-gradient(180deg, rgba(58,44,29,0.5) 0 14px, rgba(43,33,21,0.5) 14px 28px), var(--bg-1)',
      }}
    >
      {/* Custody mark at the head of the spine. */}
      <div
        title="MoveMark chain of custody desk"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          paddingBottom: 8,
          borderBottom: '1px solid var(--border)',
          width: '100%',
        }}
      >
        <CustodyMark />
        <span
          className="stencil"
          style={{ fontSize: '0.4rem', color: 'var(--brass-2)', writingMode: 'vertical-rl', display: 'none' }}
        >
          MoveMark
        </span>
      </div>

      {/* Case number stamped as a vertical spine label. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '8px 4px',
          border: '1.5px dashed var(--border-strong)',
          borderRadius: 6,
          background: 'rgba(20,17,13,0.5)',
        }}
      >
        <span className="stencil" style={{ fontSize: '0.4rem', color: 'var(--ink-4)' }}>
          Case
        </span>
        <span
          className="mono"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            fontSize: '0.84rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'var(--brass-2)',
          }}
        >
          {caseNo}
        </span>
        <span
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            fontSize: '0.46rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: custodyColor,
          }}
        >
          {custody}
        </span>
      </div>

      {/* Custody-chain readout for the active file as stacked chips. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <span className="stencil" style={{ fontSize: '0.4rem', color: 'var(--ink-4)' }}>
          Chain
        </span>
        <SpineChip label="In" value={theCase?.entryCount ?? 0} lit={(theCase?.entryCount ?? 0) > 0} />
        <SpineChip label="Out" value={theCase?.exitCount ?? 0} lit={(theCase?.exitCount ?? 0) > 0} />
        <SpineChip label="Disp" value={theCase?.claimCount ?? 0} lit={(theCase?.claimCount ?? 0) > 0} />
      </div>

      {/* Global evidence ledger as tiny stacked chips. */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
        <span className="stencil" style={{ fontSize: '0.4rem', color: 'var(--ink-4)' }}>
          Ledger
        </span>
        <SpineChip label="Case" value={summary?.cases} />
        <SpineChip label="Snap" value={summary?.snapshots} />
        <SpineChip label="Clm" value={summary?.claims} />
        <SpineChip label="Seal" value={summary?.settlements} />
      </div>

      {/* Evidence-room controls, anchored to the foot of the spine. */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          paddingTop: 10,
        }}
      >
        <SpineButton
          onClick={() => setReducedMotion(!reducedMotion)}
          title="Toggle reduced motion"
          top="Motion"
          bottom={reducedMotion ? 'HELD' : 'LIVE'}
          active={!reducedMotion}
        />
        <SpineButton onClick={onAbout} title="Open the field manual" top="Manual" bottom="FIELD" />
        <WalletButton />
      </div>
    </aside>
  );
}
