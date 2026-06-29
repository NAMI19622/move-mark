'use client';

import React from 'react';
import { useStore } from '../lib/store';
import { credits } from '../lib/format';
import { Button } from './ui';

interface Props {
  activeCase: string | null;
  onSelectCase: (id: string) => void;
  onNewCase: () => void;
}

// The left rail: the docket of condition cases. Each case shows its asset type,
// deposit, and how many snapshots and claims it holds.
export default function CaseRail({ activeCase, onSelectCase, onNewCase }: Props) {
  const { cases, summary } = useStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="stencil" style={{ fontSize: '0.62rem', color: 'var(--ink-3)' }}>
          Case docket
        </span>
        <Button onClick={onNewCase} style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
          New case
        </Button>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gap: 8, alignContent: 'start' }}>
        {cases.length === 0 && (
          <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
            No cases on the docket yet. Open a condition case to begin a chain of custody.
          </div>
        )}
        {cases.map((c) => {
          const active = c.id === activeCase;
          return (
            <button
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              style={{
                textAlign: 'left',
                padding: 12,
                borderRadius: 'var(--radius-m)',
                border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
                background: active
                  ? 'linear-gradient(180deg, rgba(199,154,75,0.16), rgba(199,154,75,0.05))'
                  : 'rgba(243,236,223,0.02)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>
                {c.title}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--ink-3)', marginTop: 4 }}>
                {c.assetType} | deposit {credits(c.depositAmount)}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: '0.62rem', color: 'var(--ink-4)' }}>
                <span>{c.entryCount} entry</span>
                <span>{c.exitCount} exit</span>
                <span>{c.claimCount} claims</span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: '0.66rem',
          color: 'var(--ink-3)',
        }}
      >
        <RailStat label="Supported" value={summary?.supported} />
        <RailStat label="Unsupported" value={summary?.unsupported} />
        <RailStat label="Settlements" value={summary?.settlements} />
        <RailStat label="Human review" value={summary?.humanReview} />
      </div>
    </div>
  );
}

function RailStat({ label, value }: { label: string; value?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
      <span className="mono" style={{ color: 'var(--ink)', fontSize: '0.9rem' }}>
        {value ?? '..'}
      </span>
      <span style={{ fontSize: '0.56rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}
