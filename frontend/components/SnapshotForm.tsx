'use client';

import React, { useState } from 'react';
import { Modal, Field, TextInput, TextArea, Select, Button } from './ui';
import { ISSUE_TYPES, SEVERITIES, CERTAINTIES } from '../lib/config';
import { writeAndWait } from '../lib/genlayer';
import { useStore } from '../lib/store';

interface Props {
  caseId: string;
  phase: 'entry' | 'exit';
  onClose: () => void;
  onDone: (message: string, kind: 'ok' | 'err') => void;
}

// Records a single condition snapshot for either the entry or exit phase.
export default function SnapshotForm({ caseId, phase, onClose, onDone }: Props) {
  const { wallet, connect, refresh } = useStore();
  const [id, setId] = useState('');
  const [zone, setZone] = useState('');
  const [item, setItem] = useState('');
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState('none');
  const [issueType, setIssueType] = useState('none');
  const [certainty, setCertainty] = useState('high');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!id.trim() || !item.trim()) {
      onDone('A snapshot id and item are required.', 'err');
      return;
    }
    setBusy(true);
    try {
      if (!wallet) await connect();
      const method = phase === 'entry' ? 'create_entry_snapshot' : 'create_exit_snapshot';
      await writeAndWait(method, [id.trim(), caseId, zone.trim(), item.trim(), note.trim(), severity, issueType, certainty]);
      await refresh();
      onDone(`${phase === 'entry' ? 'Entry' : 'Exit'} snapshot recorded.`, 'ok');
      onClose();
    } catch (e: any) {
      onDone(e?.message || 'Snapshot failed.', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Record ${phase} snapshot`} onClose={onClose}>
      <Field label="Snapshot id" hint="A unique identifier, e.g. entry_kitchen_table.">
        <TextInput value={id} onChange={(e) => setId(e.target.value)} placeholder={`${phase}_zone_item`} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Zone">
          <TextInput value={zone} onChange={(e) => setZone(e.target.value)} placeholder="kitchen" />
        </Field>
        <Field label="Item">
          <TextInput value={item} onChange={(e) => setItem(e.target.value)} placeholder="wood dining table" />
        </Field>
      </div>
      <Field label="Condition note" hint="Plain description of what the evidence shows.">
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Surface scratch along the left edge." />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Issue type">
          <Select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
            {ISSUE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Severity">
          <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Certainty">
          <Select value={certainty} onChange={(e) => setCertainty(e.target.value)}>
            {CERTAINTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Recording...' : 'Record snapshot'}
        </Button>
      </div>
    </Modal>
  );
}
