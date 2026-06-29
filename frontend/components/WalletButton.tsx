'use client';

import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { shortAddr } from '../lib/format';
import { explorerAddress } from '../lib/config';

export default function WalletButton() {
  const { wallet, connect, disconnect } = useStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onConnect = async () => {
    setBusy(true);
    setErr(null);
    try {
      await connect();
    } catch (e: any) {
      setErr(e?.message || 'Connection failed.');
    } finally {
      setBusy(false);
    }
  };

  if (!wallet) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={onConnect}
          disabled={busy}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-strong)',
            background: 'linear-gradient(180deg, rgba(199,154,75,0.24), rgba(199,154,75,0.08))',
            color: 'var(--ink)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {busy ? 'Connecting...' : 'Connect wallet'}
        </button>
        {err && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              width: 230,
              fontSize: '0.7rem',
              color: 'var(--rust)',
              background: 'var(--surface-solid)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-m)',
              padding: 10,
              zIndex: 40,
            }}
          >
            {err}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border)',
          background: 'rgba(243,236,223,0.03)',
          fontSize: '0.8rem',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: 'var(--green)',
            boxShadow: '0 0 8px var(--green)',
          }}
        />
        <span className="mono">{shortAddr(wallet)}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '115%',
            right: 0,
            width: 250,
            background: 'var(--surface-solid)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-m)',
            padding: 12,
            zIndex: 40,
            boxShadow: 'var(--shadow-2)',
          }}
        >
          <div style={{ fontSize: '0.66rem', color: 'var(--ink-3)', marginBottom: 4 }}>
            Connected address
          </div>
          <div
            className="mono"
            style={{ fontSize: '0.72rem', wordBreak: 'break-all', marginBottom: 10 }}
          >
            {wallet}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={explorerAddress(wallet)} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem' }}>
              Explorer
            </a>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(wallet);
              }}
              style={{
                fontSize: '0.72rem',
                background: 'none',
                border: 'none',
                color: 'var(--evidence-2)',
                padding: 0,
              }}
            >
              Copy
            </button>
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              style={{
                marginLeft: 'auto',
                fontSize: '0.72rem',
                background: 'none',
                border: 'none',
                color: 'var(--rust)',
                padding: 0,
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
