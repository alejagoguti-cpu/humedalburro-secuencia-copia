import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import * as maplibregl from 'maplibre-gl';
import { Cpu, Droplets, Factory, House, Leaf, Network, Route, Store, Trees, Truck, Users, Waves, type LucideIcon } from 'lucide-react';
import { load3D, reduced, stageSize } from './App';
import {
  BEATS2, CAPS, COLORS, CORAB, EVID_COLOR, INTERD, LABELS2, LINE_COLORS, PLACES2, PRESS, SYSTEMS, type LngLat,
} from './conclusion-content';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
const N = BEATS2.length;
const cv = (c: string, ink = '#0a0a0a') => ({ '--c': c, '--ink': ink }) as React.CSSProperties;

// ------------------------------------------------------------------ disposición por secuencia
interface St { x: number; y: number; o: number; s: number; d: number }
const T = (x: number, y: number, o = 1, s = 1, d = 0): St => ({ x, y, o, s, d });
const PIN = (o = 1, s = 1, d = 0): St => ({ x: NaN, y: NaN, o, s, d });

const PIDX: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3 };

// ------------------------------------------------------------------ sin superposición de textos
// Orden de prioridad: los titulares y nodos se quedan donde el diseño los pone; leyendas y notas buscan el hueco libre más cercano.
const PRIO: string[] = [
  'w1', 'w2', 'sub1', 'hint', 'hFrag', 'hQ', 'hCap', 'hRec', 'subRec', 'hubR', 'subR', 'fin', 'finSub', 'cta',
  ...PRESS.map((p) => p.id), ...CAPS.map((c) => c.id), ...INTERD.map((c) => c.id), ...SYSTEMS.map((s) => s.id),
  ...Array.from({ length: 13 }, (_, i) => 'c' + i), 'leg3', 'legS', 'noteL', 'cap',
];
interface Box { x0: number; y0: number; x1: number; y1: number }
const clash = (a: Box, b: Box, pad: number) => a.x0 < b.x1 + pad && a.x1 + pad > b.x0 && a.y0 < b.y1 + pad && a.y1 + pad > b.y0;
function resolveLayout(L: Record<string, St>, els: Record<string, HTMLElement | null>, W: number, H: number): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {};
  // zonas reservadas: encabezado y barra de navegación
  const placed: Box[] = [{ x0: 0, y0: H - 62, x1: W, y1: H }];
  const offsets: [number, number][] = [];
  for (let dy = -260; dy <= 260; dy += 12) for (let dx = -200; dx <= 200; dx += 20) offsets.push([dx, dy]);
  offsets.sort((a, b) => Math.hypot(a[0], a[1] * 1.4) - Math.hypot(b[0], b[1] * 1.4));
  for (const id of PRIO) {
    const s = L[id], el = els[id];
    if (!s || !el || s.o < 0.3 || !Number.isFinite(s.x)) continue;
    const w = el.offsetWidth * s.s, h = el.offsetHeight * s.s;
    const cx = s.x * W, cy = s.y * H;
    let best = { x: cx, y: cy };
    for (const [dx, dy] of offsets) {
      const x = cx + dx, y = cy + dy;
      const bx: Box = { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 };
      if (bx.x0 < 8 || bx.x1 > W - 8 || bx.y0 < 8 || bx.y1 > H - 62) continue;
      if (placed.some((p) => clash(bx, p, 6))) continue;
      best = { x, y }; break;
    }
    out[id] = best;
    placed.push({ x0: best.x - w / 2, y0: best.y - h / 2, x1: best.x + w / 2, y1: best.y + h / 2 });
  }
  return out;
}
function layout(b: number, m: boolean): Record<string, St> {
  const L: Record<string, St> = {};
  const hide = (x = 0.5, y = 0.5) => T(x, y, 0, 0.96);
  const topY = m ? 0.06 : 0.075;
  // palabras del hallazgo
  if (b === 0) { L.w1 = T(0.5, 0.5, 1, 1); L.w2 = hide(0.5, 0.5); L.sub1 = hide(0.5, 0.64); }
  else if (b === 1) { L.w1 = T(m ? 0.5 : 0.28, m ? 0.3 : 0.44, 1, m ? 0.62 : 0.62); L.w2 = T(m ? 0.5 : 0.72, m ? 0.5 : 0.44, 1, m ? 0.62 : 0.62, 0.15); L.sub1 = T(0.5, m ? 0.72 : 0.64, 1, 1, 1.6); }
  else { const o = b <= 7 ? 1 : 0; L.w1 = T(m ? 0.27 : 0.3, topY, o, m ? 0.34 : 0.4); L.w2 = T(m ? 0.73 : 0.7, topY, o, m ? 0.34 : 0.4); L.sub1 = hide(0.5, 0.64); }
  L.hint = b === 0 ? T(0.5, m ? 0.64 : 0.62, 0.9, 1, 1.5) : hide(0.5, 0.62);
  // encabezados
  const hy = m ? 0.17 : 0.165;
  L.hFrag = b === 4 ? T(0.5, hy, 1, 1, 0.6) : hide(0.5, hy);
  L.hQ = b === 5 || b === 6 ? T(0.5, hy + 0.02, 1, 1, 0.4) : hide(0.5, hy + 0.02);
  L.hCap = b === 7 ? T(0.5, hy, 1, 1, 0.5) : hide(0.5, hy);
  L.hRec = b === 8 ? T(0.5, 0.2, 1, 1, 0.3) : b === 9 ? T(0.5, m ? 0.09 : 0.1, 1, 0.5) : hide(0.5, 0.2);
  L.subRec = b === 8 ? T(0.5, m ? 0.34 : 0.32, 1, 1, 0.9) : hide(0.5, 0.32);
  // pines anclados al mapa
  L.pinC = b >= 2 && b <= 6 ? PIN(1, 1, b === 2 ? 3.2 : 0.2) : PIN(0, 0.96);
  L.hubW = b === 9 ? PIN(1, 1, 0.8) : PIN(0, 0.96);
  // presiones
  const pp = m ? [[0.25, 0.34], [0.75, 0.34], [0.25, 0.6], [0.75, 0.6]] : [[0.14, 0.36], [0.86, 0.36], [0.14, 0.66], [0.86, 0.66]];
  const pd = [0.3, 5.9, 5.7, 2.0];
  PRESS.forEach((p) => {
    const i = PIDX[p.id];
    L[p.id] = b >= 3 && b <= 6 ? T(pp[i][0], pp[i][1], b === 5 ? 0.28 : 1, 1, b === 3 ? pd[i] : 0.2) : hide(pp[i][0], pp[i][1]);
  });
  // capacidades
  const qp = m ? [[0.25, 0.36], [0.5, 0.62], [0.75, 0.36]] : [[0.14, 0.5], [0.5, 0.72], [0.86, 0.5]];
  CAPS.forEach((c, i) => { L[c.id] = b === 7 ? T(qp[i][0], qp[i][1], 1, 1, 0.9 + i * 0.5) : hide(qp[i][0], qp[i][1]); });
  // interdependencias (humedales)
  const ip = m ? [[0.25, 0.34], [0.75, 0.34], [0.25, 0.64], [0.75, 0.64]] : [[0.14, 0.4], [0.86, 0.4], [0.14, 0.68], [0.86, 0.68]];
  INTERD.forEach((c, i) => { L[c.id] = b === 9 ? T(ip[i][0], ip[i][1], 1, 1, 1.0 + i * 0.35) : hide(ip[i][0], ip[i][1]); });
  // red propia integrada
  L.hubR = b === 10 ? T(0.5, m ? 0.44 : 0.4, 1, 1, 0.6) : hide(0.5, 0.4);
  L.subR = b === 10 ? T(0.5, m ? 0.37 : 0.29, 1, 1, 1.2) : hide(0.5, 0.29);
  const sp = m ? [[0.27, 0.26], [0.73, 0.26], [0.5, 0.78]] : [[0.2, 0.5], [0.8, 0.5], [0.5, 0.71]];
  SYSTEMS.forEach((s, i) => { L[s.id] = b === 10 ? T(sp[i][0], sp[i][1], 1, 1, 0.3 + i * 0.35) : hide(sp[i][0], sp[i][1]); });
  const cpos: [number, number][] = [
    [0.12, 0.33], [0.29, 0.33], [0.12, 0.63], [0.29, 0.63],
    [0.71, 0.33], [0.88, 0.33], [0.71, 0.63], [0.88, 0.63],
    [0.3, 0.6], [0.7, 0.6], [0.3, 0.81], [0.5, 0.86], [0.7, 0.81],
  ];
  cpos.forEach(([x, y], i) => { L['c' + i] = b === 10 && !m ? T(x, y, 1, 1, 1.6 + i * 0.1) : hide(x, y); });
  // final
  L.fin = b === 11 ? T(0.5, m ? 0.2 : 0.2, 1, 1, 0.8) : hide(0.5, 0.2);
  L.finSub = b === 11 ? T(0.5, m ? 0.29 : 0.29, 1, 1, 1.4) : hide(0.5, 0.29);
  L.cta = b === 11 ? T(0.5, m ? 0.37 : 0.37, 1, 1, 2) : hide(0.5, 0.37);
  // leyendas y pie
  L.leg3 = b >= 3 && b <= 6 ? T(m ? 0.5 : 0.135, m ? 0.88 : 0.8, 1, 1, b === 3 ? 6.4 : 0.3) : hide(0.135, 0.8);
  L.legS = b === 7 ? T(m ? 0.5 : 0.135, m ? 0.88 : 0.8, 1, 1, 2.4) : hide(0.135, 0.8);
  L.noteL = b === 2 ? T(m ? 0.5 : 0.135, m ? 0.88 : 0.8, 1, 1, 3.4) : hide(0.135, 0.8);
  L.cap = [2, 3, 4, 6, 7, 9].indexOf(b) >= 0 || b === 3 ? T(0.5, m ? 0.83 : 0.875, 1, 1, b === 2 ? 3.6 : 0.8) : hide(0.5, 0.875);
  return L;
}

// ------------------------------------------------------------------ conexiones
type Style = 'solid' | 'dotted' | 'dashed';
interface Conn {
  id: string; a: string; b: string; color: string; w: number; style: Style; bulge?: number; vertical?: boolean;
  show: (b: number) => boolean; op: (b: number) => number; delay: (b: number) => number;
}
const FX: [number, number][] = [[0.1, 0.34], [0.1, 0.62], [0.3, 0.8], [0.7, 0.8], [0.9, 0.62], [0.9, 0.34]];
const CONNS: Conn[] = [
  ...[0, 1, 2, 3, 4].map((i): Conn => ({ id: 'f' + i, a: 'rt:w1', b: 'lf:w2', color: '#e6e6e6', w: 1.1, style: 'solid', bulge: [-28, -14, 0, 14, 28][i], show: (b) => b >= 1 && b <= 7, op: (b) => (b >= 2 ? 0.5 : 0.9), delay: () => 0.4 + i * 0.12 })),
  ...FX.map((_, i): Conn => ({ id: 'fl' + i, a: 'fx:' + i, b: 'place:corab', color: '#f0f0f0', w: 1.2, style: 'dashed', show: (b) => b === 2 || b === 3, op: (b) => (b === 2 ? 0.8 : 0.25), delay: () => 4.0 + i * 0.25 })),
  { id: 'cv', a: 'place:corab', b: 'el:p1', color: LINE_COLORS.vial, w: 2.2, style: 'solid', show: (b) => b >= 3 && b <= 7, op: (b) => [0, 0, 0, 1, 0.8, 0.2, 0.9, 0.12][b] ?? 0, delay: (b) => (b === 3 ? 0.6 : 0) },
  { id: 'ch', a: 'place:corab', b: 'el:p4', color: LINE_COLORS.hidrico, w: 2.2, style: 'solid', bulge: 34, show: (b) => b >= 3 && b <= 7, op: (b) => [0, 0, 0, 1, 0.8, 0.2, 0.9, 0.12][b] ?? 0, delay: (b) => (b === 3 ? 2.4 : 0) },
  { id: 'ce', a: 'place:corab', b: 'el:p4', color: LINE_COLORS.ecologico, w: 2.2, style: 'solid', bulge: -34, show: (b) => b >= 3 && b <= 7, op: (b) => [0, 0, 0, 1, 0.8, 0.2, 0.9, 0.12][b] ?? 0, delay: (b) => (b === 3 ? 4.2 : 0) },
  { id: 'cb', a: 'place:corab', b: 'el:p3', color: LINE_COLORS.socio, w: 2, style: 'dotted', show: (b) => b >= 3 && b <= 7, op: (b) => [0, 0, 0, 1, 0.8, 0.2, 0.9, 0.12][b] ?? 0, delay: (b) => (b === 3 ? 6.0 : 0) },
  { id: 'cp', a: 'place:corab', b: 'el:p2', color: '#d0d0d0', w: 2, style: 'dotted', show: (b) => b >= 3 && b <= 7, op: (b) => [0, 0, 0, 0.8, 0.7, 0.2, 0.8, 0.12][b] ?? 0, delay: (b) => (b === 3 ? 6.2 : 0) },
  { id: 'r1', a: 'el:p1', b: 'el:p2', color: '#ffffff', w: 2.2, style: 'solid', bulge: -44, show: (b) => b === 6, op: () => 1, delay: () => 0.3 },
  { id: 'r2', a: 'el:p2', b: 'el:p4', color: '#ffffff', w: 2.2, style: 'solid', bulge: -44, show: (b) => b === 6, op: () => 1, delay: () => 0.6 },
  { id: 'r3', a: 'el:p4', b: 'el:p3', color: '#ffffff', w: 2.2, style: 'solid', bulge: -44, show: (b) => b === 6, op: () => 1, delay: () => 0.9 },
  { id: 'r4', a: 'el:p3', b: 'el:p1', color: '#ffffff', w: 2.2, style: 'solid', bulge: -44, show: (b) => b === 6, op: () => 1, delay: () => 1.2 },
  // capacidades: existentes (continua), potenciales (guiones) y propuestas (puntos)
  { id: 'qa1', a: 'el:q1', b: 'place:act1', color: '#6fb1a7', w: 1.6, style: 'solid', show: (b) => b === 7, op: () => 1, delay: () => 1.4 },
  { id: 'qa2', a: 'el:q1', b: 'place:act2', color: '#6fb1a7', w: 1.6, style: 'solid', show: (b) => b === 7, op: () => 1, delay: () => 1.6 },
  { id: 'qa3', a: 'el:q2', b: 'place:avcali', color: '#6fb1a7', w: 1.6, style: 'solid', show: (b) => b === 7, op: () => 1, delay: () => 1.9 },
  { id: 'qa4', a: 'el:q2', b: 'place:suds', color: COLORS.coral, w: 1.8, style: 'dotted', show: (b) => b === 7, op: () => 1, delay: () => 2.1 },
  { id: 'qa5', a: 'el:q3', b: 'place:burro', color: '#6fb1a7', w: 1.6, style: 'solid', show: (b) => b === 7, op: () => 1, delay: () => 2.3 },
  { id: 'qc1', a: 'el:q1', b: 'el:q2', color: COLORS.mustard, w: 1.8, style: 'dashed', bulge: 30, show: (b) => b === 7, op: () => 1, delay: () => 2.8 },
  { id: 'qc2', a: 'el:q2', b: 'el:q3', color: COLORS.coral, w: 1.8, style: 'dotted', bulge: 30, show: (b) => b === 7, op: () => 1, delay: () => 3.1 },
  { id: 'qc3', a: 'el:q1', b: 'el:q3', color: COLORS.mustard, w: 1.8, style: 'dashed', bulge: -50, show: (b) => b === 7, op: () => 1, delay: () => 3.4 },
  // interdependencias alrededor de los humedales
  { id: 'ia1', a: 'el:hubW', b: 'el:i1', color: LINE_COLORS.hidrico, w: 2.2, style: 'solid', show: (b) => b === 9, op: () => 1, delay: () => 1.2 },
  { id: 'ia2', a: 'el:hubW', b: 'el:i2', color: LINE_COLORS.socio, w: 2, style: 'dotted', show: (b) => b === 9, op: () => 1, delay: () => 1.55 },
  { id: 'ia3', a: 'el:hubW', b: 'el:i3', color: LINE_COLORS.vial, w: 2.2, style: 'solid', show: (b) => b === 9, op: () => 1, delay: () => 1.9 },
  { id: 'ia4', a: 'el:hubW', b: 'el:i4', color: COLORS.coral, w: 2, style: 'dotted', show: (b) => b === 9, op: () => 1, delay: () => 2.25 },
  // red propia integrada
  ...SYSTEMS.map((s, i): Conn => ({ id: 'hs' + i, a: 'el:hubR', b: 'el:' + s.id, color: '#e6e6e6', w: 1.4, style: 'solid', show: (b) => b === 10, op: () => 0.9, delay: () => 0.8 + i * 0.3 })),
  { id: 'tri1', a: 'el:s1', b: 'el:s2', color: '#ffffff', w: 1.6, style: 'solid', bulge: -40, show: (b) => b === 10, op: () => 0.9, delay: () => 1.9 },
  { id: 'tri2', a: 'el:s2', b: 'el:s3', color: '#ffffff', w: 1.6, style: 'solid', bulge: -40, show: (b) => b === 10, op: () => 0.9, delay: () => 2.2 },
  { id: 'tri3', a: 'el:s3', b: 'el:s1', color: '#ffffff', w: 1.6, style: 'solid', bulge: -40, show: (b) => b === 10, op: () => 0.9, delay: () => 2.5 },
  ...SYSTEMS.flatMap((s, si) => s.comps.map((_, ci): Conn => {
    const idx = SYSTEMS.slice(0, si).reduce((n, x) => n + x.comps.length, 0) + ci;
    return { id: 'cc' + idx, a: 'el:s' + (si + 1), b: 'el:c' + idx, color: s.color, w: 1, style: 'solid', show: (b) => b === 10, op: () => 0.7, delay: () => 2.6 + idx * 0.08 };
  })),
];

type Pt = { x: number; y: number };
const Sh = (a: Pt, b: Pt) => { const mx = (a.x + b.x) / 2; return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`; };
const Qb = (a: Pt, b: Pt, bulge: number) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 - (dy / len) * bulge, cy = (a.y + b.y) / 2 + (dx / len) * bulge;
  return `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
};

// ------------------------------------------------------------------ mapa
const WET: LngLat = [
  (PLACES2.burro.ll[0] + PLACES2.techo.ll[0] + PLACES2.lavaca.ll[0]) / 3,
  (PLACES2.burro.ll[1] + PLACES2.techo.ll[1] + PLACES2.lavaca.ll[1]) / 3,
];
const MID: LngLat = [(CORAB[0] + PLACES2.burro.ll[0]) / 2, (CORAB[1] + PLACES2.burro.ll[1]) / 2];
interface Cam { c: LngLat; z: number; pitch: number; bearing: number }
function cam(b: number, m: boolean): Cam {
  const dz = m ? -0.8 : 0;
  if (b <= 1) return { c: MID, z: 12.4 + dz, pitch: 0, bearing: 0 };
  if (b === 2) return { c: CORAB, z: 15.1 + dz, pitch: 52, bearing: -18 };
  if (b === 3) return { c: MID, z: 13.9 + dz, pitch: 52, bearing: -18 };
  if (b === 4 || b === 5) return { c: MID, z: 12.8 + dz, pitch: 46, bearing: -18 };
  if (b === 6) return { c: MID, z: 13.0 + dz, pitch: 46, bearing: -18 };
  if (b === 7) return { c: MID, z: 13.2 + dz, pitch: 48, bearing: -18 };
  if (b === 8 || b === 9) return { c: WET, z: 13.4 + dz, pitch: 50, bearing: -18 };
  if (b === 10) return { c: MID, z: 12.9 + dz, pitch: 42, bearing: -14 };
  return { c: MID, z: 12.2 + dz, pitch: 38, bearing: -10 };
}
type HL = { corab: number; vias: number; canales: number; hum: number; parq: number; barr: number; bld: number };
const HLT: HL[] = [
  { corab: 0, vias: 0, canales: 0, hum: 0, parq: 0, barr: 0, bld: 1 },
  { corab: 0, vias: 0, canales: 0, hum: 0, parq: 0, barr: 0, bld: 1 },
  { corab: 1, vias: 0, canales: 0, hum: 0, parq: 0, barr: 0, bld: 1 },
  { corab: 1, vias: 1, canales: 1, hum: 1, parq: 1, barr: 1, bld: 0.8 },
  { corab: 0.6, vias: 1, canales: 1, hum: 1, parq: 1, barr: 1, bld: 0.5 },
  { corab: 0.35, vias: 0.35, canales: 0.35, hum: 0.35, parq: 0.35, barr: 0.35, bld: 0.6 },
  { corab: 0.6, vias: 0.9, canales: 0.9, hum: 0.9, parq: 0.8, barr: 0.8, bld: 0.6 },
  { corab: 0, vias: 0.2, canales: 0.2, hum: 0.5, parq: 0, barr: 0, bld: 0.7 },
  { corab: 0, vias: 0, canales: 0.5, hum: 1, parq: 0.3, barr: 0, bld: 0.6 },
  { corab: 0, vias: 0.9, canales: 1, hum: 1, parq: 0.5, barr: 1, bld: 0.5 },
  { corab: 0, vias: 0.3, canales: 0.3, hum: 0.4, parq: 0.2, barr: 0.3, bld: 0.35 },
  { corab: 0.5, vias: 0.6, canales: 0.7, hum: 0.9, parq: 0.4, barr: 0.5, bld: 0.8 },
];
const HLDELAY3: Partial<Record<keyof HL, number>> = { vias: 0.6, canales: 2.4, hum: 4.2, barr: 6.0, parq: 6.2 };

const SYS_ICONS: LucideIcon[] = [Users, Cpu, Leaf];
const PRESS_ICONS: LucideIcon[] = [Truck, Trees, House, Droplets];
const CAP_ICONS: LucideIcon[] = [Users, Route, Waves];
const INT_ICONS: LucideIcon[] = [Droplets, House, Truck, Store];

const CAPTIONS: Record<number, { k: string; t: string }> = {
  2: { k: 'Corabastos', t: 'Corabastos concentra actividades fundamentales para el abastecimiento de Bogotá.' },
  3: { k: 'Propagación', t: 'Las presiones no permanecen dentro de la central.' },
  4: { k: 'Lectura territorial', t: 'Las interrupciones y contrastes entre sistemas son conceptuales: no representan límites medidos.' },
  6: { k: 'Interdependencia', t: 'Una intervención aislada puede dejar intactas las relaciones que reproducen las presiones.' },
  7: { k: 'Capacidades', t: 'La recuperación depende de fortalecer las relaciones entre los sistemas sociales, tecnológicos y ecológicos.' },
  9: { k: 'Más allá del borde', t: 'La intervención debe considerar las interdependencias del sistema. Los perímetros de protección se mantienen.' },
};

interface Api { map: maplibregl.Map; markers: Record<string, HTMLElement>; hl: HL; three: { ready: boolean; on: boolean; k: { v: number } }; ready: boolean }

export default function Conclusion() {
  const [beat, setBeat] = useState(0);
  const [selP, setSelP] = useState<string | null>(null);
  const [m, setM] = useState(() => window.innerWidth < 768);
  const [mapReady, setMapReady] = useState(false);
  const beatRef = useRef(0);
  const prevRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapElRef = useRef<HTMLDivElement>(null);
  const els = useRef<Record<string, HTMLElement | null>>({});
  const reg = (id: string) => (n: HTMLElement | null) => { els.current[id] = n; };
  const api = useRef<Api | null>(null);
  const timers = useRef<number[]>([]);
  const cs = useRef<Record<string, { p: number; op: number }>>({});
  const paths = useRef<Record<string, { base: SVGPathElement | null; flow: SVGPathElement | null }>>({});
  const mRef = useRef(m); mRef.current = m;
  const selRef = useRef<string | null>(null); selRef.current = selP;

  const go = useCallback((i: number) => {
    const t = Math.max(0, Math.min(N - 1, i));
    gsap.to(window, { scrollTo: { y: t * window.innerHeight, autoKill: false }, duration: reduced() ? 0 : 0.9, ease: 'power2.inOut' });
  }, []);

  // ---------- posiciones de los elementos
  const applyLayout = (b: number, instant = false, soft = false) => {
    const { W, H } = stageSize(), rm = reduced() || instant;
    const L = layout(b, mRef.current);
    const adj = resolveLayout(L, els.current, W, H);
    Object.entries(L).forEach(([id, s]) => {
      const el = els.current[id]; if (!el) return;
      const a = adj[id];
      const pos = Number.isFinite(s.x) ? { x: a ? a.x : s.x * W, y: a ? a.y : s.y * H } : {};
      gsap.to(el, { ...pos, opacity: s.o, scale: s.s, duration: rm ? 0 : soft ? 0.5 : 1.1, delay: rm || soft ? 0 : s.d, ease: 'power3.inOut', overwrite: true, pointerEvents: s.o > 0.5 ? 'auto' : 'none' });
    });
  };

  useLayoutEffect(() => {
    const { W, H } = stageSize();
    Object.entries(layout(0, mRef.current)).forEach(([id, s]) => {
      const el = els.current[id]; if (!el) return;
      gsap.set(el, { xPercent: -50, yPercent: -50, x: Number.isFinite(s.x) ? s.x * W : 0, y: Number.isFinite(s.y) ? s.y * H : 0, opacity: 0, scale: s.s });
    });
    CONNS.forEach((c) => { cs.current[c.id] = { p: 0, op: 0 }; });
    if (reduced()) gsap.set(els.current.w1!, { opacity: 1 });
    else gsap.fromTo(els.current.w1!, { opacity: 0, y: '+=14' }, { opacity: 1, y: '-=14', duration: 1.8, ease: 'power2.out', delay: 0.2 });
  }, []);

  // ---------- reencuadre automático
  useEffect(() => {
    let t = 0;
    const refit = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => { setM(window.innerWidth < 768); api.current?.map.resize(); applyLayout(beatRef.current, true); ScrollTrigger.refresh(); }, 60);
    };
    window.addEventListener('resize', refit);
    window.visualViewport?.addEventListener('resize', refit);
    const ro = new ResizeObserver(refit);
    if (stageRef.current) ro.observe(stageRef.current);
    const late = window.setTimeout(refit, 600);
    return () => { window.clearTimeout(t); window.clearTimeout(late); ro.disconnect(); window.removeEventListener('resize', refit); window.visualViewport?.removeEventListener('resize', refit); };
  }, []);

  // ---------- scroll ↔ secuencia
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: spacerRef.current, start: 'top top', end: 'bottom bottom',
      snap: { snapTo: 1 / (N - 1), duration: { min: 0.15, max: 0.5 }, ease: 'power1.inOut' },
      onUpdate: (self) => {
        const i = Math.round(self.progress * (N - 1));
        if (i !== beatRef.current) { prevRef.current = beatRef.current; beatRef.current = i; setBeat(i); }
      },
    });
    const key = (e: KeyboardEvent) => {
      if ((e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) && (e.key === 'Enter' || e.key === ' ')) return;
      const b = beatRef.current;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(b + 1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(b - 1); }
    };
    window.addEventListener('keydown', key);
    return () => { st.kill(); window.removeEventListener('keydown', key); };
  }, [go]);

  // ---------- mapa: 3D real de Kennedy + capas de análisis
  const paintHL = () => {
    const a = api.current; if (!a || !a.ready) return;
    const mp = a.map, h = a.hl, k = a.three.k.v;
    const set = (id: string, prop: string, v: number) => { if (mp.getLayer(id)) mp.setPaintProperty(id, prop as 'fill-opacity', v); };
    set('corab-fill', 'fill-opacity', 0.22 * h.corab); set('corab-line', 'line-opacity', h.corab);
    set('vias-major', 'line-opacity', 0.95 * h.vias);
    set('canales-line', 'line-opacity', h.canales); set('canales-fill', 'fill-opacity', 0.45 * h.canales);
    set('hum-line', 'line-opacity', h.hum); set('hum-fill', 'fill-opacity', 0.4 * h.hum);
    set('parques-hl', 'fill-opacity', 0.32 * h.parq);
    set('barrios-dot', 'circle-opacity', 0.95 * h.barr); set('barrios-dot', 'circle-stroke-opacity', h.barr);
    set('bld3d', 'fill-extrusion-opacity', 0.96 * Math.min(1, k * 3) * h.bld);
    set('arboles3d', 'fill-extrusion-opacity', 0.95 * Math.min(1, k * 3) * Math.min(1, h.bld + 0.15));
  };
  const lastPaint = useRef(0);
  const apply3D = (force = false) => {
    const a = api.current; if (!a || !a.ready) return;
    const k = a.three.k.v, now = performance.now();
    if (!force && k > 0.002 && k < 0.998 && now - lastPaint.current < 70) return;
    lastPaint.current = now;
    const mp = a.map, f = Math.min(1, k * 1.6);
    mp.setPaintProperty('bld3d', 'fill-extrusion-height', ['*', ['get', 'h'], Math.max(0.001, k)]);
    mp.setPaintProperty('arboles3d', 'fill-extrusion-height', ['*', ['get', 'h'], Math.max(0.001, k)]);
    mp.setPaintProperty('arboles3d', 'fill-extrusion-base', ['*', ['get', 'b'], Math.max(0.001, k)]);
    mp.setPaintProperty('parques-fill', 'fill-opacity', 0.85 * f); mp.setPaintProperty('agua-fill', 'fill-opacity', 0.9 * f); mp.setPaintProperty('vias-line', 'line-opacity', 0.75 * f);
    paintHL();
  };
  const to3D = (on: boolean) => {
    const a = api.current; if (!a) return; a.three.on = on; if (!a.ready) return;
    gsap.to(a.three.k, { v: on ? 1 : 0, duration: reduced() ? 0 : 2.4, ease: 'power2.inOut', overwrite: true, onUpdate: () => apply3D(), onComplete: () => apply3D(true) });
  };

  useEffect(() => {
    let dead = false; let map: maplibregl.Map | null = null;
    maplibregl.setWorkerUrl(new URL('./maplibre-gl-worker.mjs', document.baseURI).href);
    (async () => {
      if (!mapElRef.current) return;
      map = new maplibregl.Map({
        container: mapElRef.current, interactive: false, attributionControl: false, fadeDuration: 0,
        center: MID, zoom: 12.4,
        style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': COLORS.bg } }] },
      });
      const markers: Record<string, HTMLElement> = {};
      const addMk = (id: string, ll: LngLat, label: string, color: string) => {
        const outer = document.createElement('div'), inner = document.createElement('div');
        inner.className = 'mk pulse'; inner.style.setProperty('--c', color);
        inner.innerHTML = '<i></i><span>' + label + '</span>'; outer.appendChild(inner);
        new maplibregl.Marker({ element: outer, anchor: 'left' }).setLngLat(ll).addTo(map!);
        markers[id] = inner;
      };
      const SHORT: Record<string, string> = { act1: 'Colectivos', act2: 'JAC', avcali: 'Av. Cali', suds: 'SuDS' };
      Object.entries(PLACES2).forEach(([id, p]) => addMk(id, p.ll, SHORT[id] ?? p.name, id === 'corab' ? COLORS.coral : id.startsWith('act') || id === 'avcali' || id === 'suds' ? COLORS.mustard : '#6fd07a'));
      api.current = { map, markers, hl: { ...HLT[0] }, three: { ready: false, on: false, k: { v: 0 } }, ready: false };
      (window as unknown as { __map: maplibregl.Map }).__map = map;
      map.on('load', async () => {
        if (dead || !map) return;
        const ok = await load3D(map, () => dead).catch(() => false);
        if (!ok || dead) return;
        const [cor, bar] = await Promise.all([fetch('./data/corabastos.json').then((r) => r.json()), fetch('./data/barrios.json').then((r) => r.json())]);
        map.addSource('corab', { type: 'geojson', data: cor });
        map.addSource('barrios', { type: 'geojson', data: bar });
        const L = (x: maplibregl.LayerSpecification) => map!.addLayer(x);
        L({ id: 'parques-hl', type: 'fill', source: 'parques', paint: { 'fill-color': '#8fd46f', 'fill-opacity': 0 } });
        L({ id: 'canales-fill', type: 'fill', source: 'agua', filter: ['==', ['get', 't'], 'Canal'], paint: { 'fill-color': '#4aa0e8', 'fill-opacity': 0 } });
        L({ id: 'canales-line', type: 'line', source: 'agua', filter: ['==', ['get', 't'], 'Canal'], paint: { 'line-color': LINE_COLORS.hidrico, 'line-width': 2.4, 'line-opacity': 0 } });
        L({ id: 'hum-fill', type: 'fill', source: 'agua', filter: ['==', ['get', 't'], 'Humedal'], paint: { 'fill-color': '#4fc46a', 'fill-opacity': 0 } });
        L({ id: 'hum-line', type: 'line', source: 'agua', filter: ['==', ['get', 't'], 'Humedal'], paint: { 'line-color': LINE_COLORS.ecologico, 'line-width': 2.6, 'line-opacity': 0 } });
        L({ id: 'vias-major', type: 'line', source: 'vias', filter: ['==', ['get', 'k'], 'major'], paint: { 'line-color': '#ffffff', 'line-width': 2.2, 'line-opacity': 0 } });
        L({ id: 'corab-fill', type: 'fill', source: 'corab', paint: { 'fill-color': COLORS.coral, 'fill-opacity': 0 } });
        L({ id: 'corab-line', type: 'line', source: 'corab', paint: { 'line-color': COLORS.coral, 'line-width': 3, 'line-opacity': 0 } });
        L({ id: 'barrios-dot', type: 'circle', source: 'barrios', paint: { 'circle-radius': 3.4, 'circle-color': COLORS.mustard, 'circle-opacity': 0, 'circle-stroke-color': '#000', 'circle-stroke-width': 1, 'circle-stroke-opacity': 0, 'circle-pitch-alignment': 'map' } });
        if (dead || !api.current) return;
        api.current.ready = true; api.current.three.ready = true;
        apply3D(true);
        setMapReady(true);
      });
    })();
    return () => { dead = true; map?.remove(); api.current = null; };
  }, []);

  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, reduced() ? 0 : ms)); };
  const showMk = (ids: string[]) => { const a = api.current; if (!a) return; Object.entries(a.markers).forEach(([id, el]) => el.classList.toggle('on', ids.includes(id))); };

  // cámara, capas y marcadores por secuencia
  useEffect(() => {
    const a = api.current; if (!a || !mapReady) return;
    const b = beat, prev = prevRef.current;
    clearTimers();
    const { H } = stageSize();
    const C = cam(b, mRef.current);
    const fly = (ms: number) => a.map.easeTo({ center: C.c, zoom: C.z, pitch: C.pitch, bearing: C.bearing, padding: { top: Math.round(H * (b === 11 ? 0.36 : 0.15)), bottom: Math.round(H * 0.1), left: 0, right: 0 }, duration: reduced() ? 0 : ms, essential: true });
    gsap.to(mapWrapRef.current, { opacity: b < 2 ? 0 : b === 10 ? 0.55 : b === 8 ? 0.8 : 1, scale: b < 2 ? 0.94 : 1, duration: reduced() ? 0 : 1.4, ease: 'power2.inOut', delay: b === 2 && prev < 2 ? 0.4 : 0 });
    if (b < 2) { to3D(false); fly(0); }
    else {
      if (b === 2 && prev < 2) { a.map.jumpTo({ center: MID, zoom: 12.8, pitch: 0, bearing: 0 }); later(() => fly(3400), 900); later(() => to3D(true), 600); }
      else { fly(b === 3 ? 2600 : 2200); to3D(true); }
    }
    // marcadores
    const mk = b === 2 || b === 3 || b === 4 || b === 5 || b === 6 ? ['corab'] : b === 7 ? ['act1', 'act2', 'avcali', 'suds', 'burro'] : b === 8 || b === 9 ? ['burro', 'techo', 'lavaca'] : b === 11 ? ['corab'] : [];
    later(() => showMk(mk), b === 2 ? 3000 : 600);
    // capas de análisis (con escalonado propio en la propagación)
    const target = HLT[b];
    (Object.keys(target) as (keyof HL)[]).forEach((k) => {
      const dl = b === 3 && HLDELAY3[k] !== undefined ? HLDELAY3[k]! : b === 2 && k === 'corab' ? 2.2 : 0;
      gsap.to(a.hl, { [k]: target[k], duration: reduced() ? 0 : 1.2, delay: reduced() ? 0 : dl, ease: 'power2.inOut', overwrite: 'auto', onUpdate: () => paintHL() });
    });
    return clearTimers;
  }, [beat, mapReady]);

  // ---------- elementos y conexiones
  useEffect(() => {
    applyLayout(beat);
    CONNS.forEach((c) => {
      const s = cs.current[c.id]; if (!s) return;
      const on = c.show(beat), rm = reduced();
      gsap.to(s, { p: on ? 1 : 0, duration: rm ? 0 : on ? 1.1 : 0.5, delay: rm ? 0 : on ? c.delay(beat) : 0, ease: 'power2.inOut', overwrite: 'auto' });
      gsap.to(s, { op: c.op(beat), duration: rm ? 0 : 0.8, overwrite: false });
    });
    if (beat < 3 || beat > 6) setSelP(null);
  }, [beat]);

  useEffect(() => { applyLayout(beatRef.current, false, true); }, [selP]);

  // ---------- trazado: anclado a elementos y a coordenadas reales
  useEffect(() => {
    const stage = stageRef.current!;
    const anchor = (id: string): Pt | null => {
      const root = els.current[id]; if (!root) return null;
      const r = root.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const place = (ll: LngLat): Pt | null => {
      const a = api.current, el = mapElRef.current; if (!a || !el || !a.ready) return null;
      const r = el.getBoundingClientRect(), k = r.width / (el.clientWidth || 1), p = a.map.project(ll);
      return { x: r.left + p.x * k, y: r.top + p.y * k };
    };
    const pt = (ref: string): Pt | null => {
      if (ref.startsWith('el:')) return anchor(ref.slice(3));
      if (ref.startsWith('rt:') || ref.startsWith('lf:')) { const root = els.current[ref.slice(3)]; if (!root) return null; const r = root.getBoundingClientRect(); return { x: ref.startsWith('rt:') ? r.right + 10 : r.left - 10, y: r.top + r.height / 2 }; }
      if (ref.startsWith('place:')) return place(PLACES2[ref.slice(6)].ll);
      if (ref.startsWith('fx:')) { const f = FX[+ref.slice(3)]; const s = stage.getBoundingClientRect(); return { x: s.left + f[0] * s.width, y: s.top + f[1] * s.height }; }
      return null;
    };
    // etiquetas del mapa: cada una busca un hueco que no pise a otra etiqueta ni a ninguna tarjeta o nota
    const declutterMarkers = () => {
      const a = api.current; if (!a) return;
      const occ: DOMRect[] = [];
      PRIO.concat(['pinC', 'hubW']).forEach((id) => {
        const el = els.current[id]; if (!el) return;
        if (parseFloat(el.style.opacity || '0') < 0.3) return;
        occ.push(el.getBoundingClientRect());
      });
      const hit = (r: DOMRect, o: DOMRect, pad: number) => r.left < o.right + pad && r.right + pad > o.left && r.top < o.bottom + pad && r.bottom + pad > o.top;
      const cands: [number, number][] = [[0, 0], [0, -22], [0, 22], [0, -44], [0, 44], [30, -30], [30, 30], [-6, -66], [-6, 66]];
      Object.values(a.markers).forEach((mk) => {
        const sp = mk.querySelector('span') as (HTMLElement & { _o?: [number, number] }) | null;
        if (!sp || !mk.classList.contains('on')) return;
        const off = sp._o ?? [0, 0];
        const r = sp.getBoundingClientRect();
        const nat = { l: r.left - off[0], t: r.top - off[1], w: r.width, h: r.height };
        let pick = cands[0];
        for (const c of cands) {
          const box = new DOMRect(nat.l + c[0], nat.t + c[1], nat.w, nat.h);
          if (box.left < 6 || box.right > window.innerWidth - 6 || box.top < 8 || box.bottom > window.innerHeight - 64) continue;
          if (occ.some((o) => hit(box, o, 4))) continue;
          pick = c; break;
        }
        occ.push(new DOMRect(nat.l + pick[0], nat.t + pick[1], nat.w, nat.h));
        if (pick[0] !== off[0] || pick[1] !== off[1]) { sp._o = [pick[0], pick[1]]; sp.style.transform = 'translate(' + pick[0] + 'px,' + pick[1] + 'px)'; sp.style.transition = 'transform .4s'; }
      });
    };
    const tick = () => {
      declutterMarkers();
      const sr = stage.getBoundingClientRect();
      // pines anclados al mapa
      const pinC = els.current.pinC, hubW = els.current.hubW;
      const pc = place(CORAB); if (pinC && pc) gsap.set(pinC, { x: pc.x - sr.left, y: pc.y - sr.top - (mRef.current ? 70 : 92) });
      const pw = place(WET); if (hubW && pw) gsap.set(hubW, { x: pw.x - sr.left, y: pw.y - sr.top - 52 });
      for (const c of CONNS) {
        const st = cs.current[c.id], p = paths.current[c.id];
        if (!st || !p || !p.base || !p.flow) continue;
        if (st.p < 0.002) { p.base.style.opacity = '0'; p.flow.style.opacity = '0'; continue; }
        const a = pt(c.a), b = pt(c.b);
        if (!a || !b || !Number.isFinite(a.x + a.y + b.x + b.y)) { p.base.style.opacity = '0'; p.flow.style.opacity = '0'; continue; }
        a.x -= sr.left; a.y -= sr.top; b.x -= sr.left; b.y -= sr.top;
        const d = c.bulge !== undefined ? Qb(a, b, c.bulge) : Sh(a, b);
        const sel = selRef.current && ((selRef.current === 'p1' && c.id === 'cv') || (selRef.current === 'p4' && (c.id === 'ch' || c.id === 'ce')) || (selRef.current === 'p3' && c.id === 'cb') || (selRef.current === 'p2' && c.id === 'cp'));
        p.base.setAttribute('d', d); p.flow.setAttribute('d', d);
        const solid = c.style === 'solid';
        p.base.style.strokeDashoffset = String(1 - st.p);
        p.base.style.opacity = String(solid ? st.op : st.op * 0.18);
        p.base.style.strokeWidth = String(sel ? c.w * 2 : c.w);
        p.flow.style.strokeDasharray = c.style === 'solid' ? '1.5 13' : c.style === 'dotted' ? '0.1 8' : '7 7';
        p.flow.style.strokeWidth = String((c.style === 'dotted' ? c.w * 2.4 : c.w * 1.9) * (sel ? 1.6 : 1));
        p.flow.style.opacity = st.p > 0.98 || !solid ? String(Math.min(1, st.op + 0.1) * (st.p > 0.98 ? 1 : st.p)) : '0';
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const cap = CAPTIONS[beat];
  const selCard = PRESS.find((p) => p.id === selP);
  const mapTop = 0;

  const EvBadge = ({ ev }: { ev: string }) => (
    <span className="kicker" style={{ color: EVID_COLOR[ev as keyof typeof EVID_COLOR], display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <i style={{ width: 7, height: 7, borderRadius: '50%', background: EVID_COLOR[ev as keyof typeof EVID_COLOR], display: 'inline-block' }} />{ev}
    </span>
  );
  const wordSize = m ? 'clamp(26px,8vw,52px)' : 'clamp(34px,5.2vw,92px)';

  return (
    <>
      <div ref={spacerRef} style={{ height: `${N * 100}vh` }} aria-hidden />
      <div id="stage" ref={stageRef}>
        <div ref={mapWrapRef} className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: mapTop, opacity: 0 }}>
          <div ref={mapElRef} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
          <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: '30vh', background: 'linear-gradient(#000 20%, rgba(0,0,0,0))' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: '16vh', background: 'linear-gradient(rgba(0,0,0,0), #000)' }} />
        </div>

        <svg id="links" aria-hidden>
          {CONNS.map((c) => (
            <g key={c.id}>
              <path ref={(n) => { paths.current[c.id] = { ...(paths.current[c.id] ?? { flow: null }), base: n }; }} pathLength={1} stroke={c.color} strokeDasharray="1" strokeDashoffset="1" strokeWidth={c.w} opacity={0} />
              <path ref={(n) => { paths.current[c.id] = { ...(paths.current[c.id] ?? { base: null }), flow: n }; }} className="flow" stroke={c.color} strokeWidth={c.w * 1.9} opacity={0} />
            </g>
          ))}
        </svg>

        {/* 1. el hallazgo */}
        <div ref={reg('w1')} className="abs" style={{ pointerEvents: 'none' }}>
          <button className="title-btn" style={{ pointerEvents: beat === 0 ? 'auto' : 'none' }} onClick={() => beat === 0 && go(1)} aria-label="Continuar">
            <h1 className="title-main text-center" style={{ fontSize: wordSize, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>Concentración</h1>
          </button>
        </div>
        <div ref={reg('w2')} className="abs" style={{ pointerEvents: 'none' }}>
          <h2 className="title-main text-center" style={{ fontSize: wordSize, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>Fragmentación{beat < 2 ? <br /> : ' '}territorial</h2>
        </div>
        <div ref={reg('hint')} className="abs kicker text-center" style={{ pointerEvents: 'none' }}>Haz clic en la palabra para continuar</div>
        <div ref={reg('sub1')} className="abs text-center" style={{ width: m ? '84vw' : '46vw', pointerEvents: 'none' }}>
          <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(14px,1.3vw,20px)', color: '#cfcfcf' }}>Las dinámicas concentradas en Corabastos generan presiones que se extienden más allá de sus límites.</p>
        </div>

        {/* 2. Corabastos como nodo de concentración (anclado al mapa) */}
        <div ref={reg('pinC')} className="abs node solid" style={{ ...cv(COLORS.coral, '#ffffff'), width: m ? '56vw' : 'min(22vw,300px)', padding: '10px 14px 10px 16px' }}>
          <div className="tile"><Factory /></div>
          <div className="txt"><p className="id">NODO DE CONCENTRACIÓN</p><p className="lb" style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>Concentración comercial y logística</p></div>
        </div>

        {/* encabezados */}
        <div ref={reg('hFrag')} className="abs chip" style={{ whiteSpace: m ? 'normal' : 'nowrap', textAlign: 'center', maxWidth: '88vw' }}>Fragmentación territorial</div>
        <div ref={reg('hQ')} className="abs text-center" style={{ width: m ? '88vw' : '62vw', pointerEvents: 'none' }}>
          <h3 className="title-main" style={{ fontSize: m ? 'clamp(18px,5.4vw,28px)' : 'clamp(22px,2.7vw,44px)', letterSpacing: '0.06em', lineHeight: 1.15 }}>¿Por qué no podemos intervenir cada problema por separado?</h3>
        </div>
        <div ref={reg('hCap')} className="abs chip" style={{ whiteSpace: m ? 'normal' : 'nowrap', textAlign: 'center', maxWidth: '88vw' }}>Capacidad de respuesta territorial</div>
        <div ref={reg('hRec')} className="abs text-center" style={{ pointerEvents: 'none' }}>
          <h2 className="title-main" style={{ fontSize: m ? 'clamp(26px,8vw,48px)' : 'clamp(32px,4.6vw,80px)', letterSpacing: '0.1em' }}>Recuperar no es aislar</h2>
        </div>
        <div ref={reg('subRec')} className="abs text-center" style={{ width: m ? '86vw' : '46vw', pointerEvents: 'none', background: 'rgba(0,0,0,0.78)', border: '1px solid #383838', borderRadius: 14, padding: '14px 20px' }}>
          <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(14px,1.25vw,19px)', color: '#d4d4d4', lineHeight: 1.5 }}>Proteger los humedales no consiste únicamente en delimitar sus bordes, sino también en comprender y gestionar las dinámicas que afectan su funcionamiento.</p>
        </div>

        {/* 3. propagación de presiones */}
        {PRESS.map((p, i) => {
          const Ic = PRESS_ICONS[i];
          return (
            <div key={p.id} ref={reg(p.id)} className="abs node" onClick={() => setSelP((s) => (s === p.id ? null : p.id))} style={{ ...cv(p.color), width: m ? '45vw' : 'min(20vw,290px)', cursor: 'pointer', outline: selP === p.id ? '2px solid #fff' : 'none' }}>
              <div className="wm"><Ic /></div>
              <div className="tile"><Ic /></div>
              <div className="txt">
                <EvBadge ev={p.ev} />
                <p className="lb">{p.title}</p>
              </div>
            </div>
          );
        })}
        <div ref={reg('hubW')} className="abs chip" style={{ whiteSpace: 'nowrap' }}>Humedales</div>

        {/* 5. capacidades */}
        {CAPS.map((c, i) => {
          const Ic = CAP_ICONS[i];
          return (
            <div key={c.id} ref={reg(c.id)} className="abs node" style={{ ...cv(c.color), width: m ? '44vw' : 'min(21vw,300px)' }}>
              <div className="wm"><Ic /></div>
              <div className="tile"><Ic /></div>
              <div className="txt"><p className="id">CAPACIDAD</p><p className="lb">{c.title}</p></div>
            </div>
          );
        })}
        {INTERD.map((c, i) => {
          const Ic = INT_ICONS[i];
          return (
            <div key={c.id} ref={reg(c.id)} className="abs node" style={{ ...cv(c.color), width: m ? '44vw' : 'min(20vw,280px)' }}>
              <div className="wm"><Ic /></div>
              <div className="tile"><Ic /></div>
              <div className="txt"><p className="id">RELACIÓN</p><p className="lb">{c.title}</p></div>
            </div>
          );
        })}

        {/* 7. red propia integrada (conectografía) */}
        <div ref={reg('hubR')} className="abs chip" style={{ fontSize: 'clamp(12px,1.2vw,17px)', padding: '10px 22px', borderColor: '#ebe5d9', whiteSpace: 'nowrap' }}>Nuestra red propia</div>
        <div ref={reg('subR')} className="abs text-center" style={{ width: m ? '78vw' : '30vw', pointerEvents: 'none' }}>
          <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(12px,1vw,15px)', color: '#cfcfcf' }}>Una herramienta para comprender las interdependencias entre personas, infraestructura y ecosistemas.</p>
        </div>
        {SYSTEMS.map((s, i) => {
          const Ic = SYS_ICONS[i];
          return (
            <div key={s.id} ref={reg(s.id)} className="abs node solid big" style={{ ...cv(s.color, i === 0 ? '#ffffff' : '#0a0a0a'), width: m ? '44vw' : 'min(24vw,340px)' }}>
              <div className="wm"><Ic /></div>
              <div className="tile"><Ic /></div>
              <div className="txt"><p className="id">SISTEMA</p><p className="lb">{s.title}</p>{!m && <p className="id" style={{ lineHeight: 1.35 }}>{s.desc}</p>}</div>
            </div>
          );
        })}
        {SYSTEMS.flatMap((s) => s.comps.map((c) => ({ c, color: s.color }))).map((x, i) => (
          <div key={'c' + i} ref={reg('c' + i)} className="abs chip" style={{ borderColor: x.color, color: x.color, fontSize: 'clamp(9.5px,0.8vw,12px)', padding: '5px 12px', whiteSpace: 'nowrap' }}>{x.c}</div>
        ))}

        {/* 8. conclusión */}
        <div ref={reg('fin')} className="abs text-center" style={{ pointerEvents: 'none', width: '92vw' }}>
          <h2 className="title-main" style={{ fontSize: m ? 'clamp(26px,8.4vw,52px)' : 'clamp(32px,5vw,88px)', letterSpacing: '0.1em' }}>Kennedy como sistema vivo</h2>
        </div>
        <div ref={reg('finSub')} className="abs text-center" style={{ width: m ? '84vw' : '40vw', pointerEvents: 'none' }}>
          <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(14px,1.3vw,20px)', color: '#d4d4d4' }}>Comprender sus relaciones para orientar su transformación.</p>
        </div>
        <div ref={reg('cta')} className="abs text-center" style={{ pointerEvents: 'none' }}>
          <a className="btn-ghost pri" href="../pot-kennedy-mapa.html" style={{ pointerEvents: beat === 11 ? 'auto' : 'none' }}>Explorar red completa →</a>
        </div>

        {/* leyendas y pie de texto */}
        <div ref={reg('leg3')} className="abs" style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.85)', border: '1px solid #383838', borderRadius: 12, padding: '10px 14px', width: m ? '86vw' : 'min(23vw,290px)' }}>
          <p className="kicker" style={{ marginBottom: 6 }}>Tipos de relación</p>
          {[['Red vial', LINE_COLORS.vial, '1'], ['Sistema hídrico', LINE_COLORS.hidrico, '1'], ['Conexión ecológica', LINE_COLORS.ecologico, '1'], ['Relación socioeconómica', LINE_COLORS.socio, '0']].map(([t, c, s]) => (
            <div key={t} className="flex items-center gap-2" style={{ fontSize: 11.5, color: '#d0d0d0', lineHeight: 1.7 }}>
              <svg width="30" height="8"><line x1="0" y1="4" x2="30" y2="4" stroke={c} strokeWidth="2.2" strokeDasharray={s === '1' ? undefined : '1 5'} strokeLinecap="round" /></svg>{t}
            </div>
          ))}
          <div className="flex gap-3" style={{ marginTop: 6 }}>{(['DOCUMENTADA', 'INFERIDA', 'HIPOTÉTICA'] as const).map((e) => <EvBadge key={e} ev={e} />)}</div>
        </div>
        <div ref={reg('legS')} className="abs" style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.85)', border: '1px solid #383838', borderRadius: 12, padding: '10px 14px', width: m ? '86vw' : 'min(23vw,290px)' }}>
          <p className="kicker" style={{ marginBottom: 6 }}>Estado de la capacidad</p>
          {[['Existente (registrada en el proyecto)', '#6fb1a7', undefined], ['Potencial (coordinación posible)', COLORS.mustard, '7 6'], ['Propuesta (estrategia)', COLORS.coral, '1 5']].map(([t, c, d]) => (
            <div key={t} className="flex items-center gap-2" style={{ fontSize: 11.5, color: '#d0d0d0', lineHeight: 1.7 }}>
              <svg width="30" height="8"><line x1="0" y1="4" x2="30" y2="4" stroke={c} strokeWidth="2.2" strokeDasharray={d} strokeLinecap="round" /></svg>{t}
            </div>
          ))}
        </div>
        <div ref={reg('noteL')} className="abs" style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.85)', border: '1px solid #383838', borderRadius: 12, padding: '10px 14px', width: m ? '86vw' : 'min(23vw,290px)' }}>
          <p className="kicker" style={{ marginBottom: 4 }}>Líneas conceptuales</p>
          <p style={{ fontSize: 11.5, color: '#d0d0d0', lineHeight: 1.45 }}>Representan flujos de abastecimiento y transporte hacia la central. No son rutas reales ni volúmenes medidos.</p>
        </div>
        <div ref={reg('cap')} className="abs text-center" style={{ width: m ? '88vw' : '38vw', pointerEvents: 'none', background: 'rgba(0,0,0,0.88)', border: '1px solid #383838', borderRadius: 14, padding: '12px 18px' }}>
          {selCard && beat >= 3 && beat <= 6 ? (
            <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(13px,1.1vw,17px)' }}>
              <span className="kicker block" style={{ color: selCard.color }}>{selCard.title} · {selCard.ev}</span>{selCard.note}
            </p>
          ) : cap ? (
            <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(13px,1.1vw,17px)' }}>
              <span className="kicker block" style={{ color: COLORS.coral }}>{cap.k}</span>{cap.t}
            </p>
          ) : <p className="kicker">&nbsp;</p>}
        </div>

        {/* navegación */}
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-4 pt-3" style={{ pointerEvents: 'none' }}>
          <button className="btn-ghost" style={{ pointerEvents: 'auto', visibility: beat === 0 ? 'hidden' : 'visible' }} onClick={() => go(beat - 1)}>← Atrás</button>
          <div className="flex flex-col items-center gap-1" aria-label={'Secuencia ' + (beat + 1) + ' de ' + N}>
            <div className="flex items-end gap-[5px]">
              {BEATS2.map((_, i) => <span key={i} style={{ width: 1.5, height: i === beat ? 14 : 6, background: i <= beat ? '#e6e6e6' : '#383838', transition: 'height .4s' }} />)}
            </div>
            <span className="kicker hidden md:block" style={{ fontSize: 9.5 }}>{LABELS2[beat]}</span>
          </div>
          <button className="btn-ghost" style={{ pointerEvents: 'auto', visibility: beat === N - 1 ? 'hidden' : 'visible' }} onClick={() => go(beat + 1)}>Continuar →</button>
        </div>
      </div>
    </>
  );
}
