'use client';

import React from 'react';
import type { Claim } from '../lib/types';
import { credits, titleCase } from '../lib/format';

interface Props {
  claims: Claim[];
  activeId: string | null;
  onSelect: (c: Claim) => void;
}

// The list of claims filed against the active case.
export default function ClaimList({ claims, activeId, onSelect }: Props) {
  if (claims.length === 0) {
    return (
      <div style={{ fontSize: '0.74rem', color: 'var(--ink-4)', lineHeight: 1.5 }}>
        No claims filed against this case yet.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {claims.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              textAlign: 'left',
              padding: 11,
              borderRadius: 'var(--radius-m)',
              border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
              background: active ? 'rgba(199,154,75,0.1)' : 'rgba(243,236,223,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)' }}>
                {titleCase(c.claimType)}
              </span>
              <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--brass-2)' }}>
                {credits(c.claimedAmount)}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--ink-3)',
                marginTop: 4,
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.explanation}
            </div>
            <div style={{ marginTop: 6, fontSize: '0.62rem', color: c.evaluated ? 'var(--green)' : 'var(--ink-4)' }}>
              {c.evaluated ? 'evaluated' : 'awaiting gate'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
