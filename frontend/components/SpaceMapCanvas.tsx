'use client';

import React, { useEffect, useMemo, useRef } from 'react';

export type PinState = 'clean' | 'new' | 'preexisting' | 'wear' | 'disputed';

export interface EvidencePin {
  id: string;
  item: string;
  state: PinState;
  severity: number; // 0..5
  issueLabel: string;
}

// A zone is a room on the floor plan; its pins are the inspected items inside it.
export interface ZoneData {
  zone: string;
  pins: EvidencePin[];
}

// Kept for backward compatibility with earlier call sites.
export interface ZoneMarker {
  zone: string;
  state: PinState;
  severity: number;
}

interface Props {
  zones: ZoneData[];
  title: string;
  reducedMotion?: boolean;
  // gateProgress: 0..1 of an inspection sweep traveling across the plan during evaluation.
  gateProgress?: number;
  gateColor?: string;
  flagged?: boolean;
  // When true, no real evidence exists: draw a seeded blueprint of ghost rooms.
  empty?: boolean;
}

export const STATE_COLOR: Record<PinState, string> = {
  clean: '#7bc47f',
  wear: '#e0a13c',
  preexisting: '#5b9bd5',
  new: '#c75b39',
  disputed: '#d27a6a',
};

export const STATE_LABEL: Record<PinState, string> = {
  clean: 'Clean',
  wear: 'Wear',
  preexisting: 'Pre-existing',
  new: 'New',
  disputed: 'Disputed',
};

// Placeholder rooms used to seed the empty-state blueprint so the floor plan
// never reads as a vast empty grid.
const GHOST_ROOMS = ['Entryway', 'Living', 'Kitchen', 'Bath', 'Bedroom', 'Exterior'];

// Plan rectangle, in fractional container coordinates (0..1).
const PLAN = { left: 0.07, top: 0.17, right: 0.93, bottom: 0.9 };

interface RoomLayout {
  zone: string;
  fx: number;
  fy: number;
  fw: number;
  fh: number;
}
interface PinLayout extends EvidencePin {
  zone: string;
  fx: number;
  fy: number;
}
interface Layout {
  rooms: RoomLayout[];
  pins: PinLayout[];
}

// Pure layout: pack zones into a grid of rooms inside the plan rectangle and
// scatter each zone's pins in a tidy cluster inside its room. Deterministic so
// the canvas drawing and the HTML label overlay land on identical coordinates.
function computeLayout(zones: ZoneData[]): Layout {
  const n = Math.max(zones.length, 1);
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const planW = PLAN.right - PLAN.left;
  const planH = PLAN.bottom - PLAN.top;
  const gap = 0.022;
  const cellW = planW / cols;
  const cellH = planH / rows;

  const rooms: RoomLayout[] = [];
  const pins: PinLayout[] = [];

  zones.forEach((z, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const fx = PLAN.left + col * cellW + gap / 2;
    const fy = PLAN.top + row * cellH + gap / 2;
    const fw = cellW - gap;
    const fh = cellH - gap;
    rooms.push({ zone: z.zone, fx, fy, fw, fh });

    const count = Math.max(z.pins.length, 1);
    const pc = Math.ceil(Math.sqrt(count));
    const pr = Math.ceil(count / pc);
    // inner padding so pins do not touch the room walls
    const padX = fw * 0.2;
    const padY = fh * 0.34;
    const innerW = fw - padX * 2;
    const innerH = fh - padY * 2;
    z.pins.forEach((pin, j) => {
      const pcol = j % pc;
      const prow = Math.floor(j / pc);
      const ux = pc === 1 ? 0.5 : pcol / (pc - 1);
      const uy = pr === 1 ? 0.5 : prow / (pr - 1);
      pins.push({
        ...pin,
        zone: z.zone,
        fx: fx + padX + ux * innerW,
        fy: fy + padY + uy * innerH,
      });
    });
  });

  return { rooms, pins };
}

// A device-pixel-ratio aware canvas rendering the case as a forensic floor
// plan: faint blueprint gridlines, walled rooms for each zone, and luminous
// evidence pins sized by severity. A slow scan band sweeps the plan at idle and
// a colored adjudication sweep travels across during an evaluation. The loop
// pauses when the tab is hidden and renders a single static frame under reduced
// motion. Crisp text labels are drawn as an HTML overlay on top.
export default function SpaceMapCanvas({
  zones,
  title,
  reducedMotion = false,
  gateProgress = -1,
  gateColor = '#c79a4b',
  flagged = false,
  empty = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.5, active: false });
  const raf = useRef<number>(0);
  const t = useRef(0);
  const entry = useRef(0);
  const live = useRef({ gateProgress, gateColor, flagged });

  // Keep frequently-changing visual inputs in a ref so the animation loop does
  // not need to tear down and restart on every gate-progress tick.
  live.current = { gateProgress, gateColor, flagged };

  const ghostZones: ZoneData[] = useMemo(
    () => GHOST_ROOMS.map((zone) => ({ zone, pins: [] })),
    [],
  );

  const layout = useMemo(
    () => computeLayout(empty ? ghostZones : zones),
    [empty, ghostZones, zones],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

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

    const draw = () => {
      const { gateProgress: gp, gateColor: gc, flagged: fl } = live.current;
      const { rooms, pins } = layoutRef.current;
      t.current += reducedMotion ? 0 : 0.012;
      if (entry.current < 1) entry.current = Math.min(1, entry.current + 0.03);
      const ease = entry.current * entry.current * (3 - 2 * entry.current);

      ctx.clearRect(0, 0, w, h);

      const planX = PLAN.left * w;
      const planY = PLAN.top * h;
      const planW = (PLAN.right - PLAN.left) * w;
      const planH = (PLAN.bottom - PLAN.top) * h;

      const px = (pointer.current.x - 0.5) * 2;
      const py = (pointer.current.y - 0.5) * 2;
      const lean = pointer.current.active ? 1 : 0;

      // Blueprint gridlines across the plan.
      ctx.save();
      ctx.beginPath();
      ctx.rect(planX, planY, planW, planH);
      ctx.clip();
      ctx.strokeStyle = fl ? 'rgba(199,91,57,0.08)' : 'rgba(199,154,75,0.08)';
      ctx.lineWidth = 1;
      const gridStep = Math.max(28, Math.min(planW, planH) / 14);
      for (let gx = planX; gx <= planX + planW; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, planY);
        ctx.lineTo(gx, planY + planH);
        ctx.stroke();
      }
      for (let gy = planY; gy <= planY + planH; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(planX, gy);
        ctx.lineTo(planX + planW, gy);
        ctx.stroke();
      }

      // Idle scan band travelling down the plan.
      if (!reducedMotion) {
        const band = (t.current * 0.12) % 1.6 - 0.3;
        const by = planY + band * planH;
        const bg = ctx.createLinearGradient(0, by - 30, 0, by + 30);
        const tint = fl ? '199,91,57' : '199,154,75';
        bg.addColorStop(0, `rgba(${tint},0)`);
        bg.addColorStop(0.5, `rgba(${tint},0.08)`);
        bg.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = bg;
        ctx.fillRect(planX, by - 30, planW, 60);
      }
      ctx.restore();

      // Plan boundary (the inspection table edge).
      ctx.beginPath();
      ctx.rect(planX, planY, planW, planH);
      ctx.strokeStyle = 'rgba(199,154,75,0.34)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Room walls for each zone.
      rooms.forEach((room) => {
        const rx = room.fx * w;
        const ry = room.fy * h;
        const rw = room.fw * w;
        const rh = room.fh * h;
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        if (empty) {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(199,154,75,0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = 'rgba(199,154,75,0.03)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(199,154,75,0.2)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          // a doorway notch on the top wall for floor-plan feel
          ctx.beginPath();
          ctx.moveTo(rx + rw * 0.42, ry);
          ctx.lineTo(rx + rw * 0.58, ry);
          ctx.strokeStyle = 'rgba(20,17,13,0.9)';
          ctx.lineWidth = 2.4;
          ctx.stroke();
        }
      });

      // Evidence pins.
      pins.forEach((pin, i) => {
        const cxp = pin.fx * w;
        const cyp = pin.fy * h;
        const flexX = px * 5 * lean * (0.4 + (i % 3) * 0.2);
        const flexY = py * 5 * lean * (0.4 + (i % 3) * 0.2);
        const x = cxp + flexX * ease;
        const y = cyp + flexY * ease;

        const col = STATE_COLOR[pin.state] || '#9a8a6e';
        const { r, g, b } = hexToRgb(col);
        const pulse = reducedMotion ? 0.8 : 0.55 + Math.sin(t.current * 2 + i) * 0.45;
        const rad = (4 + pin.severity * 2.1) * (0.5 + ease * 0.5);

        // halo
        const grad = ctx.createRadialGradient(x, y, 1, x, y, rad * 3);
        grad.addColorStop(0, `rgba(${r},${g},${b},${0.36 + pulse * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, rad * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.94)`;
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // contested / new issues get an expanding ring
        if (pin.state === 'new' || pin.state === 'disputed') {
          const grow = reducedMotion ? 4 : 4 + (Math.sin(t.current * 3 + i) + 1) * 2.4;
          ctx.beginPath();
          ctx.arc(x, y, rad + grow, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
          ctx.lineWidth = pin.state === 'disputed' ? 1.6 : 1.2;
          if (pin.state === 'disputed') ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Adjudication sweep during evaluation.
      if (gp >= 0) {
        const { r, g, b } = hexToRgb(gc);
        const sweepX = planX + gp * planW;
        ctx.beginPath();
        ctx.moveTo(sweepX, planY);
        ctx.lineTo(sweepX, planY + planH);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;
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
  }, [layout, reducedMotion, empty]);

  const labelPins = layout.pins.slice(0, 30);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Plan title, top-left. */}
      <div style={{ position: 'absolute', left: 16, top: 14, pointerEvents: 'none' }}>
        <div className="stencil" style={{ fontSize: '0.6rem', color: 'var(--ink-3)' }}>
          Inspection floor plan
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.96rem',
            color: 'var(--ink)',
            maxWidth: 260,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>

      {/* Crisp room labels. */}
      {layout.rooms.map((room) => (
        <div
          key={`room-${room.zone}`}
          className="stencil"
          style={{
            position: 'absolute',
            left: `${(room.fx + room.fw / 2) * 100}%`,
            top: `${room.fy * 100}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: '0.54rem',
            color: empty ? 'var(--ink-4)' : 'var(--ink-3)',
            background: 'var(--bg-0)',
            padding: '1px 7px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            whiteSpace: 'nowrap',
            maxWidth: `${room.fw * 100}%`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            pointerEvents: 'none',
          }}
        >
          {room.zone || 'space'}
        </div>
      ))}

      {/* Evidence pin labels: item + issue badge. */}
      {!empty &&
        labelPins.map((pin) => (
          <div
            key={`label-${pin.id}`}
            style={{
              position: 'absolute',
              left: `${pin.fx * 100}%`,
              top: `${pin.fy * 100}%`,
              transform: 'translate(-50%, 10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              pointerEvents: 'none',
              maxWidth: 120,
            }}
          >
            <span
              style={{
                fontSize: '0.58rem',
                color: 'var(--ink-2)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 120,
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {pin.item}
            </span>
            {pin.state !== 'clean' && (
              <span
                style={{
                  fontSize: '0.5rem',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: STATE_COLOR[pin.state],
                  border: `1px solid ${STATE_COLOR[pin.state]}`,
                  borderRadius: 'var(--radius-pill)',
                  padding: '0 5px',
                  background: 'rgba(15,12,9,0.7)',
                  whiteSpace: 'nowrap',
                }}
              >
                {pin.issueLabel}
              </span>
            )}
          </div>
        ))}

      {/* Legend, bottom-right. */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          padding: '9px 12px',
          borderRadius: 'var(--radius-m)',
          border: '1px solid var(--border)',
          background: 'rgba(15,12,9,0.74)',
          backdropFilter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      >
        <span className="stencil" style={{ fontSize: '0.52rem', color: 'var(--ink-4)' }}>
          Condition key
        </span>
        {(Object.keys(STATE_COLOR) as PinState[]).map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                background: STATE_COLOR[s],
                boxShadow: `0 0 7px ${STATE_COLOR[s]}`,
              }}
            />
            <span style={{ fontSize: '0.62rem', color: 'var(--ink-2)' }}>{STATE_LABEL[s]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
