'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { ValidatorResult } from '../lib/types';
import { VALIDATOR_LABELS } from '../lib/config';

interface Props {
  validators: ValidatorResult[];
  active?: boolean;
}

// A chain-of-custody ledger. Each validator is a stamped line item that reveals
// in sequence when an evaluation settles. Passing checks read in sage; blocking
// or failing checks read in rust.
export default function ValidatorLedger({ validators, active }: Props) {
  if (validators.length === 0) {
    return (
      <div
        style={{
          fontSize: '0.74rem',
          color: 'var(--ink-4)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-m)',
          padding: 16,
          lineHeight: 1.5,
        }}
      >
        No evaluation on record yet. Pass a claim through the gate and the validator ledger will be stamped here.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {validators.map((v, i) => {
        const color = v.passed ? 'var(--green)' : v.blocks ? 'var(--rust)' : 'var(--amber)';
        return (
          <motion.div
            key={v.validator}
            initial={active ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: active ? i * 0.12 : 0, duration: 0.3 }}
            style={{
              display: 'flex',
              gap: 10,
              padding: '9px 11px',
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)',
              background: 'rgba(243,236,223,0.02)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: color,
                boxShadow: `0 0 8px ${color}`,
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                  {VALIDATOR_LABELS[v.validator] || v.validator}
                </span>
                <span className="stencil" style={{ fontSize: '0.56rem', color }}>
                  {v.passed ? 'pass' : v.blocks ? 'block' : 'flag'}
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-3)', lineHeight: 1.4, marginTop: 2 }}>
                {v.reason}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
