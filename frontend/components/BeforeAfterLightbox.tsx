'use client';

import React from 'react';
import type { Snapshot } from '../lib/types';
import EvidenceMatchRibbon from './EvidenceMatchRibbon';
import { titleCase } from '../lib/format';

interface Props {
  title: string;
  entry: Snapshot[];
  exit: Snapshot[];
  matchedEntryIds?: string[];
  matchedExitIds?: string[];
  reducedMotion?: boolean;
  onClose: () => void;
  onAddEntry: () => void;
  onAddExit: () => void;
}

const SEV_COLOR: Record<string, string> = {
  none: 'var(--sage)',
  cosmetic: 'var(--sage)',
  minor: 'var(--amber)',
  moderate: 'var(--amber)',
  major: 'var(--rust)',
  severe: 'var(--rust)',
};

function EvidenceColumn({
  label,
  snaps,
  matched,
  facing,
  onAdd,
}: {
  label: string;
  snaps: Snapshot[];
  matched: string[];
  facing: 'left' | 'right';
  onAdd: () => void;
}) {
  return (
    <div
      className={facing === 'left' ? 'panel-left' : 'panel-right'}
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 16,
        borderRadius: 'var(--radius-l)',
        border: '1px solid var(--border)',
        background: 'rgba(20,17,13,0.5)',
        textAlign: facing === 'left' ? 'left' : 'right',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: facing === 'left' ? 'row' : 'row-reverse',
        }}
      >
        <span className="stencil" style={{ fontSize: '0.62rem', color: 'var(--brass-2)' }}>
          {label}
        </span>
        <button
          onClick={onAdd}
          style={{
            fontSize: '0.66rem',
            color: 'var(--ink-3)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            padding: '4px 10px',
          }}
        >
          Add {label.toLowerCase()}
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8, overflowY: 'auto', maxHeight: 220, alignContent: 'start' }}>
        {snaps.length === 0 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
            No {label.toLowerCase()} evidence captured yet.
          </div>
        )}
        {snaps.map((s) => {
          const isMatched = matched.includes(s.id);
          return (
            <div
              key={s.id}
              style={{
                padding: '8px 11px',
                borderRadius: 'var(--radius-m)',
                border: `1px solid ${isMatched ? 'var(--border-strong)' : 'var(--border)'}`,
                background: isMatched ? 'rgba(199,154,75,0.1)' : 'rgba(243,236,223,0.02)',
              }}
            >
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--ink)' }}>
                {s.zone || 'space'} / {s.item}
              </div>
              {s.conditionNote && (
                <div style={{ fontSize: '0.68rem', color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.4 }}>
                  {s.conditionNote}
                </div>
              )}
              <div
                style={{
                  marginTop: 6,
                  display: 'flex',
                  gap: 8,
                  flexDirection: facing === 'left' ? 'row' : 'row-reverse',
                  fontSize: '0.6rem',
                }}
              >
                <span style={{ color: SEV_COLOR[s.severity] || 'var(--ink-3)' }}>{titleCase(s.issueType)}</span>
                <span style={{ color: 'var(--ink-4)' }}>{s.severity}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The before/after lightbox: an expanding bottom sheet that opens over the
// floor plan when a zone or claim is inspected. Entry evidence faces in from
// one side, exit evidence faces in from the other, and the EvidenceMatchRibbon
// runs between them to bind pre-existing conditions to their origin. This
// replaces the old fixed right aside.
export default function BeforeAfterLightbox({
  title,
  entry,
  exit,
  matchedEntryIds = [],
  matchedExitIds = [],
  reducedMotion = false,
  onClose,
  onAddEntry,
  onAddExit,
}: Props) {
  return (
    <div
      role="dialog"
      aria-label="Entry and exit evidence lightbox"
      className={reducedMotion ? undefined : 'lightbox-in'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: '74%',
        zIndex: 24,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15,12,9,0.94)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--border-strong)',
        borderRadius: '18px 18px 0 0',
        boxShadow: 'var(--shadow-2)',
        padding: '14px 18px 18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="stencil" style={{ fontSize: '0.58rem', color: 'var(--ink-3)' }}>
            Before / after lightbox
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.96rem', color: 'var(--ink)' }}>{title}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close lightbox"
          style={{
            width: 30,
            height: 30,
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--ink-2)',
            fontSize: '1.05rem',
            lineHeight: 1,
          }}
        >
          x
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 14,
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        <EvidenceColumn
          label="Entry"
          snaps={entry}
          matched={matchedEntryIds}
          facing="left"
          onAdd={onAddEntry}
        />

        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 0',
          }}
        >
          <div className="stencil" style={{ fontSize: '0.54rem', color: 'var(--ink-4)', marginBottom: 6 }}>
            Match ribbon
          </div>
          <EvidenceMatchRibbon
            entry={entry}
            exit={exit}
            matchedEntryIds={matchedEntryIds}
            matchedExitIds={matchedExitIds}
            reducedMotion={reducedMotion}
          />
        </div>

        <EvidenceColumn
          label="Exit"
          snaps={exit}
          matched={matchedExitIds}
          facing="right"
          onAdd={onAddExit}
        />
      </div>
    </div>
  );
}
