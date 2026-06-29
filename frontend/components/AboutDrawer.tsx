'use client';

import React from 'react';
import { Modal } from './ui';
import { GATE_VALUES } from '../lib/config';
import { gateLabel } from '../lib/format';

// A field manual panel explaining what MoveMark does and why it needs GenLayer.
export default function AboutDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="MoveMark field manual" onClose={onClose} wide>
      <div style={{ display: 'grid', gap: 16, fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--ink-2)' }}>
        <p>
          MoveMark is a condition-verification protocol for rentals and shared spaces. Two parties record a
          condition snapshot at handover and another at return. A dispute claim is filed, and a GenLayer gate
          decides whether the evidence supports the claim. No deposit is ever moved on-chain; MoveMark only
          adjudicates and recommends.
        </p>
        <div>
          <div className="stencil" style={{ fontSize: '0.6rem', color: 'var(--ink-3)', marginBottom: 8 }}>
            The seven outcomes
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            {GATE_VALUES.map((g) => (
              <div key={g} style={{ display: 'flex', gap: 8 }}>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--brass-2)' }}>
                  {gateLabel(g)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p>
          A static contract can verify a signature, but it cannot tell a fresh stain from a pre-existing scratch,
          ordinary wear from chargeable damage, or a vague note from real evidence. That judgment is semantic, so
          MoveMark runs it as a GenLayer consensus question: a leader proposes an outcome and validators
          independently re-derive it. Deterministic guards run before the AI call, and deterministic backstops bound
          the result after consensus.
        </p>
        <p style={{ fontSize: '0.74rem', color: 'var(--ink-4)' }}>
          MoveMark is not legal advice and moves no funds. The adjudication is probabilistic; the backstops bound it
          but do not make it infallible. An AI consensus round can take one to five minutes.
        </p>
      </div>
    </Modal>
  );
}
