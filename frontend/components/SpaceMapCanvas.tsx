'use client';

import React, { useEffect, useRef } from 'react';

export interface ZoneMarker {
  zone: string;
  // condition delta at this zone: 0 unchanged, 1 new issue, -1 preexisting
  state: 'clean' | 'new' | 'preexisting' | 'wear';
  severity: number; // 0..5
}

interface Props {
  zones: ZoneMarker[];
  title: string;
  reducedMotion?: boolean;
  // gateProgress: 0..1 of an inspection sweep traveling across the map during evaluation.
  gateProgress?: number;
  gateColor?: string;
  flagged?: boolean;
}

const STATE_COLOR: Record<string, string> = {
  clean: '#a7b58a',
  new: '#c75b39',
  preexisting: '#5b9bd5',
  wear: '#c79a4b',
};

// A device-pixel-ratio aware canvas. It renders the shared space as a warm
// floor-plan grid with luminous zone markers. Markers pulse by severity and
// flex toward the pointer. During an evaluation an inspection sweep line
// travels across the plan. The loop pauses when the tab is hidden and renders a
// single static frame under reduced motion.
export default function SpaceMapCanvas({
  zones,
  title,
  reducedMotion = false,
  gateProgress = -1,
  gateColor = '#c79a4b',
  flagged = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.5, active: false });
  const raf = useRef<number>(0);
  const t = useRef(0);
  const entry = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = (e.clientX - rect.left) / rect.width;
      pointer.current.y = (e.clientY - rect.top) / rect.height;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    const hexToRgb = (hex: string) => {
      const m = hex.replace('#', '');
      const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };

    entry.current = reducedMotion ? 1 : 0;

    const markerPositions = (count: number) => {
      // lay zone markers on a soft golden-angle spiral inside the plan
      const pts: { x: number; y: number }[] = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const r = Math.sqrt((i + 0.6) / Math.max(count, 1));
        const a = i * golden;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      return pts;
    };

    const draw = () => {
      t.current += reducedMotion ? 0 : 0.012;
      if (entry.current < 1) entry.current = Math.min(1, entry.current + 0.03);
      const ease = entry.current * entry.current * (3 - 2 * entry.current);

      const cx = w / 2;
      const cy = h / 2;
      const span = Math.min(w, h) * 0.4;
      ctx.clearRect(0, 0, w, h);

      const px = (pointer.current.x - 0.5) * 2;
      const py = (pointer.current.y - 0.5) * 2;
      const lean = pointer.current.active ? 1 : 0;

      // floor-plan grid
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = flagged ? 'rgba(199,91,57,0.14)' : 'rgba(199,154,75,0.12)';
      ctx.lineWidth = 1;
      const gridR = span * 1.25;
      const step = gridR / 5;
      for (let gx = -5; gx <= 5; gx++) {
        ctx.beginPath();
        ctx.moveTo(gx * step, -gridR);
        ctx.lineTo(gx * step, gridR);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-gridR, gx * step);
        ctx.lineTo(gridR, gx * step);
        ctx.stroke();
      }
      // plan boundary
      ctx.beginPath();
      ctx.rect(-span * 1.12, -span * 1.12, span * 2.24, span * 2.24);
      ctx.strokeStyle = 'rgba(199,154,75,0.32)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      const pts = markerPositions(Math.max(zones.length, 1));

      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i];
        const p = pts[i];
        const baseX = p.x * span * ease;
        const baseY = p.y * span * ease;
        const flexX = px * 7 * lean * (0.4 + (i % 3) * 0.2);
        const flexY = py * 7 * lean * (0.4 + (i % 3) * 0.2);
        const x = baseX + flexX;
        const y = baseY + flexY;

        const col = STATE_COLOR[z.state] || '#9a8a6e';
        const { r, g, b } = hexToRgb(col);
        const pulse = reducedMotion ? 0.8 : 0.55 + Math.sin(t.current * 2 + i) * 0.45;
        const rad = 5 + z.severity * 2.2;

        // halo
        const grad = ctx.createRadialGradient(x, y, 1, x, y, rad * 3);
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.4 + pulse * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, rad * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // marker core
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.92)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // ring for new-issue markers
        if (z.state === 'new') {
          ctx.beginPath();
          ctx.arc(x, y, rad + 4 + (reducedMotion ? 0 : (Math.sin(t.current * 3 + i) + 1) * 2), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
      ctx.restore();

      // inspection sweep during evaluation
      if (gateProgress >= 0) {
        const { r, g, b } = hexToRgb(gateColor);
        const sweepX = -span * 1.12 + gateProgress * span * 2.24;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.moveTo(sweepX, -span * 1.12);
        ctx.lineTo(sweepX, span * 1.12);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.restore();
      }

      if (!reducedMotion && document.visibilityState === 'visible') {
        raf.current = requestAnimationFrame(draw);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !reducedMotion) {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(raf.current);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    draw();
    if (reducedMotion) cancelAnimationFrame(raf.current);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [zones, reducedMotion, gateProgress, gateColor, flagged]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 14,
          pointerEvents: 'none',
        }}
      >
        <div className="stencil" style={{ fontSize: '0.6rem', color: 'var(--ink-3)' }}>
          Condition map
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.96rem',
            color: 'var(--ink)',
            maxWidth: 220,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}
