'use client';

import React from 'react';

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,8,5,0.72)',
        backdropFilter: 'blur(4px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rise"
        style={{
          width: '100%',
          maxWidth: wide ? 760 : 540,
          maxHeight: '88vh',
          overflowY: 'auto',
          background: 'var(--surface-solid)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-l)',
          boxShadow: 'var(--shadow-2)',
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ fontSize: '1.05rem' }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--ink-2)',
              fontSize: '1.1rem',
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div
        style={{
          fontSize: '0.74rem',
          color: 'var(--ink-2)',
          marginBottom: 5,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: '0.68rem', color: 'var(--ink-4)', marginTop: 4 }}>{hint}</div>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 'var(--radius-m)',
  border: '1px solid var(--border)',
  background: 'rgba(20,17,13,0.55)',
  color: 'var(--ink)',
  fontSize: '0.85rem',
  outline: 'none',
};

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ ...inputStyle, resize: 'vertical', minHeight: 70, ...(props.style || {}) }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

export function Button({
  children,
  variant = 'primary',
  ...rest
}: { variant?: 'primary' | 'ghost' | 'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(180deg, rgba(199,154,75,0.36), rgba(199,154,75,0.12))',
      border: '1px solid var(--border-strong)',
      color: 'var(--ink)',
    },
    ghost: {
      background: 'transparent',
      border: '1px solid var(--border)',
      color: 'var(--ink-2)',
    },
    danger: {
      background: 'rgba(199,91,57,0.16)',
      border: '1px solid rgba(199,91,57,0.42)',
      color: 'var(--rust)',
    },
  };
  return (
    <button
      {...rest}
      style={{
        padding: '9px 16px',
        borderRadius: 'var(--radius-pill)',
        fontSize: '0.82rem',
        fontWeight: 600,
        opacity: rest.disabled ? 0.5 : 1,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        ...styles[variant],
        ...(rest.style || {}),
      }}
    >
      {children}
    </button>
  );
}

export function Toast({
  message,
  kind,
  onClose,
}: {
  message: string;
  kind: 'ok' | 'err';
  onClose: () => void;
}) {
  return (
    <div
      className="rise"
      style={{
        position: 'fixed',
        bottom: 70,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 80,
        padding: '11px 18px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-solid)',
        border: `1px solid ${kind === 'ok' ? 'rgba(123,196,127,0.5)' : 'rgba(199,91,57,0.5)'}`,
        color: kind === 'ok' ? 'var(--green)' : 'var(--rust)',
        fontSize: '0.82rem',
        boxShadow: 'var(--shadow-2)',
        maxWidth: '80vw',
      }}
      onClick={onClose}
    >
      {message}
    </div>
  );
}

export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        border: `1px solid ${color}`,
        color,
        fontSize: '0.66rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {label}
    </span>
  );
}
