'use client';

import React from 'react';
import { gateLabel } from '../lib/format';

interface Props {
  gate: string;
  outcomeLabel: string;
  proofHash: string;
  color: string;
  animate?: boolean;
}

// A wax-and-brass settlement seal medallion. It stamps the settled gate result
// and the on-chain proof hash, framed like an inspector's certified stamp.
export default function SettlementSeal({ gate, outcomeLabel, proofHash, color, animate }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        animation: animate ? 'mm-stamp 0.6s var(--ease) both' : 'none',
        transform: 'rotate(-5deg)',
      }}
    >
      <svg width={138} height={138} viewBox="0 0 138 138" aria-hidden>
        <defs>
          <radialGradient id="seal-wax" cx="42%" cy="38%" r="68%">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="70%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0.28" />
          </radialGradient>
        </defs>
        {/* scalloped wax edge */}
        <g>
          {Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI * 2;
            const x = 69 + Math.cos(a) * 62;
            const y = 69 + Math.sin(a) * 62;
            return <circle key={i} cx={x} cy={y} r={6} fill="url(#seal-wax)" />;
          })}
        </g>
        <circle cx={69} cy={69} r={58} fill="url(#seal-wax)" />
        <circle cx={69} cy={69} r={50} fill="none" stroke="rgba(20,17,13,0.45)" strokeWidth={1.5} strokeDasharray="2 4" />
        <circle cx={69} cy={69} r={44} fill="rgba(20,17,13,0.32)" />
        {/* engraved mark */}
        <path
          d="M 50 70 L 63 83 L 90 54"
          fill="none"
          stroke="var(--ink)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.92}
        />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color, fontWeight: 700 }}>
          {gateLabel(gate)}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--ink-3)', marginTop: 2 }}>{outcomeLabel}</div>
        <div className="mono" style={{ fontSize: '0.62rem', color: 'var(--ink-4)', marginTop: 6 }}>
          {proofHash}
        </div>
      </div>
    </div>
  );
}
