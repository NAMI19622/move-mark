'use client';

import React from 'react';

interface Props {
  // confidence in basis points (0..10000)
  confidenceBps: number;
  // severity 0..5 of the supported issue
  severity: number;
  gateColor: string;
  label: string;
  reducedMotion?: boolean;
}

// A brass compass dial. The needle swings to the adjudication confidence; the
// outer arc fills by supported severity. It reads like an inspector's gauge,
// not a generic progress bar.
export default function WearCompassDial({
  confidenceBps,
  severity,
  gateColor,
  label,
  reducedMotion = false,
}: Props) {
  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const r = 64;
  const conf = Math.max(0, Math.min(confidenceBps / 10000, 1));
  // needle sweeps from -120deg to +120deg
  const angle = -120 + conf * 240;
  const rad = (angle * Math.PI) / 180;
  const nx = cx + Math.sin(rad) * (r - 14);
  const ny = cy - Math.cos(rad) * (r - 14);

  // severity arc
  const sevFrac = Math.max(0, Math.min(severity / 5, 1));
  const arcStart = -120;
  const arcEnd = -120 + sevFrac * 240;
  const polar = (deg: number, radius: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + Math.sin(a) * radius, y: cy - Math.cos(a) * radius };
  };
  const a0 = polar(arcStart, r);
  const a1 = polar(arcEnd, r);
  const large = arcEnd - arcStart > 180 ? 1 : 0;

  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const deg = -120 + (i / 10) * 240;
    const o = polar(deg, r + 6);
    const inner = polar(deg, r + (i % 5 === 0 ? -2 : 1));
    ticks.push(
      <line
        key={i}
        x1={inner.x}
        y1={inner.y}
        x2={o.x}
        y2={o.y}
        stroke={i % 5 === 0 ? 'var(--brass-2)' : 'var(--ink-4)'}
        strokeWidth={i % 5 === 0 ? 1.6 : 1}
      />,
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r + 12} fill="rgba(31,26,19,0.7)" stroke="var(--border)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(199,154,75,0.18)" strokeWidth={6} />
        {sevFrac > 0 && (
          <path
            d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${large} 1 ${a1.x} ${a1.y}`}
            fill="none"
            stroke={gateColor}
            strokeWidth={6}
            strokeLinecap="round"
            style={{ transition: reducedMotion ? 'none' : 'all 0.6s var(--ease)' }}
          />
        )}
        {ticks}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={gateColor}
          strokeWidth={2.6}
          strokeLinecap="round"
          style={{ transition: reducedMotion ? 'none' : 'all 0.7s var(--ease)' }}
        />
        <circle cx={cx} cy={cy} r={5} fill="var(--brass-2)" />
        <text x={cx} y={cy + 34} textAnchor="middle" fontSize="18" fill="var(--ink)" className="mono">
          {(conf * 100).toFixed(0)}%
        </text>
        <text x={cx} y={cy + 48} textAnchor="middle" fontSize="8" fill="var(--ink-3)" letterSpacing="1.5">
          CONFIDENCE
        </text>
      </svg>
      <div className="stencil" style={{ fontSize: '0.6rem', color: 'var(--ink-3)', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
