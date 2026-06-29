'use client';

import React, { useState } from 'react';
import { Field, TextInput, TextArea, Select, Button } from './ui';
import { CLAIM_TYPES, REQUESTED_OUTCOMES } from '../lib/config';

export interface ClaimDraft {
  id: string;
  claimType: string;
  claimant: string;
  respondent: string;
  claimedAmount: number;
  explanation: string;
  requestedOutcome: string;
}

interface Props {
  onSubmit: (draft: ClaimDraft) => void;
  busy?: boolean;
}

// Inline composer for filing a dispute claim against a case.
export default function ClaimComposer({ onSubmit, busy }: Props) {
  const [id, setId] = useState('');
  const [claimType, setClaimType] = useState('new_damage');
  const [claimant, setClaimant] = useState('');
  const [respondent, setRespondent] = useState('');
  const [amount, setAmount] = useState('0');
  const [explanation, setExplanation] = useState('');
  const [outcome, setOutcome] = useState('repair_cost');

  const submit = () => {
    onSubmit({
      id: id.trim(),
      claimType,
      claimant: claimant.trim(),
      respondent: respondent.trim(),
      claimedAmount: Math.max(0, parseInt(amount || '0', 10)),
      explanation: explanation.trim(),
      requestedOutcome: outcome,
    });
  };

  return (
    <div>
      <Field label="Claim id" hint="A unique identifier, e.g. claim_table_stain.">
        <TextInput value={id} onChange={(e) => setId(e.target.value)} placeholder="claim_id" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Claim type">
          <Select value={claimType} onChange={(e) => setClaimType(e.target.value)}>
            {CLAIM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Requested outcome">
          <Select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {REQUESTED_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Claimant">
          <TextInput value={claimant} onChange={(e) => setClaimant(e.target.value)} placeholder="Owner" />
        </Field>
        <Field label="Respondent">
          <TextInput value={respondent} onChange={(e) => setRespondent(e.target.value)} placeholder="User" />
        </Field>
        <Field label="Claimed amount">
          <TextInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="400" />
        </Field>
      </div>
      <Field label="Explanation" hint="Treated as data by the gate, never as instructions.">
        <TextArea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Water stain on the dining table top appeared during the tenancy; requesting a deduction to refinish."
        />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Working...' : 'File claim and open the gate'}
        </Button>
      </div>
    </div>
  );
}
