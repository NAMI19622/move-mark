'use client';

import React, { useState } from 'react';
import { Modal, Field, TextInput, TextArea, Select, Button } from './ui';
import { ASSET_TYPES } from '../lib/config';
import { writeAndWait } from '../lib/genlayer';
import { useStore } from '../lib/store';

interface Props {
  onClose: () => void;
  onDone: (message: string, kind: 'ok' | 'err') => void;
}

// Opens a new condition case: the container that holds entry and exit snapshots,
// claims, evaluations, and a settlement.
export default function CaseForm({ onClose, onDone }: Props) {
  const { wallet, connect, refresh } = useStore();
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [assetType, setAssetType] = useState('apartment');
  const [ownerLabel, setOwnerLabel] = useState('');
  const [userLabel, setUserLabel] = useState('');
  const [usagePeriod, setUsagePeriod] = useState('');
  const [deposit, setDeposit] = useState('1000');
  const [standard, setStandard] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!id.trim() || !title.trim()) {
      onDone('A case id and title are required.', 'err');
      return;
    }
    setBusy(true);
    try {
      if (!wallet) await connect();
      await writeAndWait('create_condition_case', [
        id.trim(),
        title.trim(),
        assetType,
        ownerLabel.trim(),
        userLabel.trim(),
        usagePeriod.trim(),
        Math.max(0, parseInt(deposit || '0', 10)),
        standard.trim(),
      ]);
      await refresh();
      onDone('Condition case opened.', 'ok');
      onClose();
    } catch (e: any) {
      onDone(e?.message || 'Case creation failed.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Open a condition case" onClose={onClose}>
      <Field label="Case id" hint="A unique identifier, e.g. case_apartment_table.">
        <TextInput value={id} onChange={(e) => setId(e.target.value)} placeholder="case_id" />
      </Field>
      <Field label="Title">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Apartment Table Deposit Dispute" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Asset type">
          <Select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
            {ASSET_TYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Deposit (credits)">
          <TextInput
            type="number"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            placeholder="1000"
          />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Owner label">
          <TextInput value={ownerLabel} onChange={(e) => setOwnerLabel(e.target.value)} placeholder="Landlord Property Co" />
        </Field>
        <Field label="User label">
          <TextInput value={userLabel} onChange={(e) => setUserLabel(e.target.value)} placeholder="Tenant Riley Quinn" />
        </Field>
      </div>
      <Field label="Usage period">
        <TextInput value={usagePeriod} onChange={(e) => setUsagePeriod(e.target.value)} placeholder="12 month lease" />
      </Field>
      <Field label="Inspection standard" hint="What counts as ordinary use for this asset.">
        <TextArea
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          placeholder="Normal residential wear expected; deductions only for new damage beyond ordinary use."
        />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Opening...' : 'Open case'}
        </Button>
      </div>
    </Modal>
  );
}
