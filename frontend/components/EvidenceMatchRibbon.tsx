'use client';

import React, { useMemo } from 'react';
import type { Snapshot } from '../lib/types';

interface Props {
  entry: Snapshot[];
  exit: Snapshot[];
  matchedEntryIds?: string[];
  matchedExitIds?: string[];
  reducedMotion?: boolean;
}

// Builds a key so an exit issue can be linked to an entry issue when they share
// zone, item, and issue type. That link is the visual signature of a
// pre-existing condition.
function issueKey(s: Snapshot): string {
  return `${s.zone.trim().toLowerCase()}|${s.item.trim().toLowerCase()}|${s.issueType.trim().toLowerCase()}`;
}

const STATE_COLOR: Record<string, string> = {
  preexisting: '#5b9bd5',
  new: '#c75b39',
  clean: '#a7b58a',
};

// An SVG ribbon: entry snapshots line the left, exit snapshots line the right.
// Ribbons connect exit issues back to their entry origin when they pre-exist,
// and stand alone in rust when they are new. Matched-evidence ids glow.
export default function EvidenceMatchRibbon({
  entry,
  exit,
  matchedEntryIds = [],
  matchedExitIds = [],
  reducedMotion = false,
}: Props) {
  const height = Math.max(entry.length, exit.length, 1) * 46 + 30;
  const entryKeys = useMemo(() => {
    const m = new Map<string, Snapshot>();
    entry.forEach((s) => {
      if (s.issueType !== 'none') m.set(issueKey(s), s);
    });
    return m;
  }, [entry]);

  const leftX = 16;
  const rightX = 284;
  const rowH = 46;
  const top = 24;

  const entryY = (i: number) => top + i * rowH;
  const exitY = (i: number) => top + i * rowH;

  const links = useMemo(() => {
    const out: { fromY: number; toY: number; preexisting: boolean }[] = [];
    exit.forEach((ex, ei) => {
      if (ex.issueType === 'none') return;
      const match = entryKeys.get(issueKey(ex));
      if (match) {
        const fi = entry.findIndex((e) => e.id === match.id);
        out.push({ fromY: entryY(fi) + 14, toY: exitY(ei) + 14, preexisting: true });
      }
    });
    return out;
  }, [exit, entry, entryKeys]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={300} height={height} style={{ display: 'block', minWidth: 300 }}>
        <defs>
          <linearGradient id="ribbon-pre" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b9bd5" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#5b9bd5" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#5b9bd5" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <text x={leftX} y={14} fontSize="9" fill="#9a8a6e" letterSpacing="2" style={{ textTransform: 'uppercase' }}>
          Entry
        </text>
        <text x={rightX - 34} y={14} fontSize="9" fill="#9a8a6e" letterSpacing="2" style={{ textTransform: 'uppercase' }}>
          Exit
        </text>

        {/* preexisting links */}
        {links.map((l, i) => {
          const midX = (leftX + rightX) / 2;
          const path = `M ${leftX + 12} ${l.fromY} C ${midX} ${l.fromY}, ${midX} ${l.toY}, ${rightX - 12} ${l.toY}`;
          return (
            <path
              key={`link-${i}`}
              d={path}
              fill="none"
              stroke="url(#ribbon-pre)"
              strokeWidth={2.4}
              strokeDasharray={reducedMotion ? undefined : '5 5'}
            >
              {!reducedMotion && (
                <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.4s" repeatCount="indefinite" />
              )}
            </path>
          );
        })}

        {/* entry nodes */}
        {entry.map((s, i) => {
          const matched = matchedEntryIds.includes(s.id);
          const col = s.issueType === 'none' ? STATE_COLOR.clean : STATE_COLOR.preexisting;
          return (
            <g key={`e-${s.id}`}>
              <circle
                cx={leftX + 6}
                cy={entryY(i) + 14}
                r={matched ? 7 : 5}
                fill={col}
                opacity={matched ? 1 : 0.7}
                stroke={matched ? '#e0b968' : 'none'}
                strokeWidth={matched ? 2 : 0}
              />
              <text x={leftX + 20} y={entryY(i) + 11} fontSize="10" fill="#cdbfa6">
                {s.zone} / {s.item}
              </text>
              <text x={leftX + 20} y={entryY(i) + 24} fontSize="9" fill="#9a8a6e">
                {s.issueType} | {s.severity}
              </text>
            </g>
          );
        })}

        {/* exit nodes */}
        {exit.map((s, i) => {
          const matched = matchedExitIds.includes(s.id);
          const isPre = s.issueType !== 'none' && entryKeys.has(issueKey(s));
          const col = s.issueType === 'none' ? STATE_COLOR.clean : isPre ? STATE_COLOR.preexisting : STATE_COLOR.new;
          return (
            <g key={`x-${s.id}`}>
              <circle
                cx={rightX - 6}
                cy={exitY(i) + 14}
                r={matched ? 7 : 5}
                fill={col}
                opacity={matched ? 1 : 0.7}
                stroke={matched ? '#e0b968' : 'none'}
                strokeWidth={matched ? 2 : 0}
              />
              <text x={rightX - 18} y={exitY(i) + 11} fontSize="10" fill="#cdbfa6" textAnchor="end">
                {s.zone} / {s.item}
              </text>
              <text x={rightX - 18} y={exitY(i) + 24} fontSize="9" fill="#9a8a6e" textAnchor="end">
                {s.issueType} | {s.severity}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
