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

// The case selector reimagined as a horizontal strip of file tabs across the
// top of the inspection floor, like the manila folders along the edge of an
// evidence cabinet. Selecting a tab pulls that condition case onto the floor
// plan below. This deliberately replaces the old left rail docket.
export default function CaseTabStrip({ activeCase, onSelectCase, onNewCase }: Props) {
  const { cases } = useStore();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 8,
        padding: '10px 18px',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        flexShrink: 0,
        background: 'linear-gradient(180deg, rgba(58,44,29,0.32), transparent)',
      }}
    >
      <span
        className="stencil"
        style={{
          fontSize: '0.56rem',
          color: 'var(--ink-4)',
          alignSelf: 'center',
          flexShrink: 0,
          paddingRight: 4,
        }}
      >
        Case files
      </span>

      {cases.length === 0 && (
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-4)', alignSelf: 'center' }}>
          No cases on file yet. Open one to lay it on the inspection floor.
        </span>
      )}

      {cases.map((c) => {
        const active = c.id === activeCase;
        return (
          <button
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            className={active ? 'tab-mark' : undefined}
            style={{
              flexShrink: 0,
              textAlign: 'left',
              padding: '8px 14px',
              minWidth: 150,
              borderRadius: '12px 12px 0 0',
              borderTop: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
              borderLeft: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
              borderRight: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}`,
              borderBottom: active ? '1px solid transparent' : '1px solid var(--border)',
              background: active
                ? 'linear-gradient(180deg, rgba(199,154,75,0.22), rgba(199,154,75,0.04))'
                : 'rgba(243,236,223,0.02)',
              position: 'relative',
              top: active ? 1 : 0,
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 200,
              }}
            >
              {c.title}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--ink-4)', marginTop: 3, display: 'flex', gap: 8 }}>
              <span>{c.assetType}</span>
              <span className="mono">{credits(c.depositAmount)}</span>
            </div>
          </button>
        );
      })}

      <Button
        onClick={onNewCase}
        variant="ghost"
        style={{ alignSelf: 'center', flexShrink: 0, padding: '6px 13px', fontSize: '0.72rem', marginLeft: 4 }}
      >
        New case
      </Button>
    </div>
  );
}
