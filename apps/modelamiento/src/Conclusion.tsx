import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import * as maplibregl from 'maplibre-gl';
import { Cpu, Droplets, Factory, House, Leaf, Network, Route, Store, Trees, Truck, Users, Waves, type LucideIcon } from 'lucide-react';
import { load3D, reduced, stageSize } from './App';
import RedPremium from './RedPremium';
import Diagram, { type DSpec } from './Diagram';
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
function layout(b: number, m: boolean): Record<string, St> {
  const L: Record<string, St> = {};
  const hide = (x = 0.5, y = 0.5) => T(x, y, 0, 0.96);
  const topY = m ? 0.06 : 0.075;
  // palabras del hallazgo
  if (b === 0) { L.w1 = T(0.5, 0.5, 1, 1); L.w2 = hide(0.5, 0.5); L.sub1 = hide(0.5, 0.64); }
  else if (b === 1) { L.w1 = T(m ? 0.5 : 0.28, m ? 0.3 : 0.44, 1, m ? 0.62 : 0.62); L.w2 = T(m ? 0.5 : 0.72, m ? 0.5 : 0.44, 1, m ? 0.62 : 0.62, 0.15); L.sub1 = T(0.5, m ? 0.72 : 0.64, 1, 1, 1.6); }
  else { const o = b <= 9 ? 1 : 0; L.w1 = T(m ? 0.27 : 0.098, m ? 0.05 : 0.05, o, m ? 0.3 : 0.28); L.w2 = T(m ? 0.73 : 0.35, m ? 0.05 : 0.05, o, m ? 0.3 : 0.28); L.sub1 = hide(0.5, 0.64); }
  L.hint = b === 0 ? T(0.5, m ? 0.64 : 0.62, 0.9, 1, 1.5) : hide(0.5, 0.62);
  // encabezados
  const hy = m ? 0.15 : 0.125;
  L.hFrag = b === 4 ? T(0.5, hy, 1, 1, 0.6) : hide(0.5, hy);
  L.hQ = b === 5 || b === 6 ? T(0.5, hy, 1, 1, 0.4) : hide(0.5, hy);
  L.hCap = b === 7 ? T(0.5, hy, 1, 1, 0.5) : hide(0.5, hy);
  L.hRec = b === 8 ? T(0.5, 0.2, 1, 1, 0.3) : b === 9 ? T(0.5, m ? 0.09 : 0.1, 1, 0.5) : hide(0.5, 0.2);
  L.subRec = b === 8 ? T(0.5, m ? 0.34 : 0.32, 1, 1, 0.9) : hide(0.5, 0.32);
  // pines anclados al mapa
  L.pinC = b === 2 ? PIN(1, 1, 3.2) : PIN(0, 0.96);
  L.hubW = b === 9 ? PIN(1, 1, 0.8) : PIN(0, 0.96);
  // presiones
  const pp = m ? [[0.25, 0.34], [0.75, 0.34], [0.25, 0.6], [0.75, 0.6]] : [[0.14, 0.3], [0.86, 0.3], [0.14, 0.52], [0.86, 0.52]];
  const pd = [0.3, 5.9, 5.7, 2.0];
  PRESS.forEach((p) => {
    const i = PIDX[p.id];
    L[p.id] = b >= 3 && b <= 6 ? T(pp[i][0], pp[i][1], 1, 1, b === 3 ? pd[i] : 0.2) : hide(pp[i][0], pp[i][1]);
  });
  // capacidades
  const qp = m ? [[0.25, 0.36], [0.5, 0.62], [0.75, 0.36]] : [[0.14, 0.34], [0.5, 0.62], [0.86, 0.34]];
  CAPS.forEach((c, i) => { L[c.id] = b === 7 ? T(qp[i][0], qp[i][1], 1, 1, 0.9 + i * 0.5) : hide(qp[i][0], qp[i][1]); });
  // interdependencias (humedales)
  const ip = m ? [[0.25, 0.34], [0.75, 0.34], [0.25, 0.64], [0.75, 0.64]] : [[0.14, 0.32], [0.86, 0.32], [0.14, 0.52], [0.86, 0.52]];
  INTERD.forEach((c, i) => { L[c.id] = b === 9 ? T(ip[i][0], ip[i][1], 1, 1, 1.0 + i * 0.35) : hide(ip[i][0], ip[i][1]); });
  // red propia integrada
  L.hubR = b === 10 ? T(0.5, m ? 0.44 : 0.4, 1, 1, 0.6) : hide(0.5, 0.4);
  L.subR = b === 10 ? T(0.5, m ? 0.37 : 0.29, 1, 1, 1.2) : hide(0.5, 0.29);
  const sp = m ? [[0.27, 0.26], [0.73, 0.26], [0.5, 0.78]] : [[0.2, 0.5], [0.8, 0.5], [0.5, 0.71]];
  SYSTEMS.forEach((s, i) => { L[s.id] = b === 10 ? T(sp[i][0], sp[i][1], 1, 1, 0.3 + i * 0.35) : hide(sp[i][0], sp[i][1]); });
  const cpos: [number, number][] = [
    [0.12, 0.33], [0.29, 0.33], [0.12, 0.63], [0.29, 0.63],
    [0.71, 0.33], [0.88, 0.33], [0.71, 0.63], [0.88, 0.63],
    [0.24, 0.74], [0.76, 0.74], [0.33, 0.86], [0.5, 0.86], [0.68, 0.86],
  ];
  cpos.forEach(([x, y], i) => { L['c' + i] = b === 10 && !m ? T(x, y, 1, 1, 1.6 + i * 0.1) : hide(x, y); });
  // final
  L.fin = b === 11 ? T(0.5, m ? 0.08 : 0.09, 1, 1, 0.3) : hide(0.5, 0.09);
  L.finSub = b === 11 ? T(0.5, m ? 0.14 : 0.16, 1, 1, 1.6) : hide(0.5, 0.16);
  L.stats = b === 11 ? T(0.5, m ? 0.22 : 0.24, 1, 1, 2) : hide(0.5, 0.24);
  L.noteN = b === 11 ? T(m ? 0.5 : 0.135, m ? 0.9 : 0.86, 1, 1, 3) : hide(0.135, 0.86);
  L.cta = b === 11 ? T(0.5, m ? 0.31 : 0.335, 1, 1, 2.6) : hide(0.5, 0.335);
  // leyendas y pie
  L.leg3 = b >= 3 && b <= 6 ? T(m ? 0.5 : 0.135, m ? 0.88 : 0.79, 1, 1, b === 3 ? 6.4 : 0.3) : hide(0.135, 0.79);
  L.legS = b === 7 ? T(m ? 0.5 : 0.135, m ? 0.88 : 0.79, 1, 1, 2.4) : hide(0.135, 0.79);
  L.noteL = b === 2 ? T(m ? 0.5 : 0.135, m ? 0.88 : 0.79, 1, 1, 3.4) : hide(0.135, 0.79);
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
  if (b === 3) return { c: CORAB, z: 14.0 + dz, pitch: 50, bearing: -18 };
  if (b === 4 || b === 5) return { c: CORAB, z: 13.3 + dz, pitch: 46, bearing: -18 };
  if (b === 6) return { c: CORAB, z: 13.3 + dz, pitch: 46, bearing: -18 };
  if (b === 7) return { c: MID, z: 13.2 + dz, pitch: 48, bearing: -18 };
  if (b === 8 || b === 9) return { c: WET, z: 13.4 + dz, pitch: 50, bearing: -18 };
  if (b === 10) return { c: MID, z: 12.7 + dz, pitch: 0, bearing: 0 };
  return { c: MID, z: 12.55 + dz, pitch: 54, bearing: -10 };
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
  { corab: 0, vias: 0.25, canales: 0.35, hum: 0.5, parq: 0.2, barr: 0, bld: 0.5 },
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

const EV = EVID_COLOR;
const PRESS_SPEC: DSpec = {
  core: { title: 'CORABASTOS', sub: 'Concentración comercial y logística', color: '#d9755f' },
  nodes: [
    { id: 'p1', title: 'MOVILIDAD', badge: 'DOCUMENTADA', badgeColor: EV.DOCUMENTADA, Icon: Truck, color: '#9c8fc0', ink: '#150f2b', ang: 315 },
    { id: 'p2', title: 'ESPACIO PÚBLICO', badge: 'HIPOTÉTICA', badgeColor: EV.HIPOTÉTICA, Icon: Trees, color: '#a3b86c', ink: '#1c2410', ang: 45 },
    { id: 'p4', title: 'ECOSISTEMAS', badge: 'DOCUMENTADA', badgeColor: EV.DOCUMENTADA, Icon: Droplets, color: '#6fb1a7', ink: '#06201c', ang: 135 },
    { id: 'p3', title: 'BARRIOS', badge: 'INFERIDA', badgeColor: EV.INFERIDA, Icon: House, color: '#cdae67', ink: '#2a2008', ang: 225 },
  ],
  links: [
    { id: 'cv', a: 'core', b: 'p1', style: 'solid', color: LINE_COLORS.vial, arrow: true, delay: 0.6 },
    { id: 'ch', a: 'core', b: 'p4', style: 'solid', color: LINE_COLORS.hidrico, arrow: true, delay: 2.4, off: -8 },
    { id: 'ce', a: 'core', b: 'p4', style: 'solid', color: LINE_COLORS.ecologico, arrow: true, delay: 4.2, off: 8 },
    { id: 'cb', a: 'core', b: 'p3', style: 'dotted', color: LINE_COLORS.socio, delay: 6.0 },
    { id: 'cp', a: 'core', b: 'p2', style: 'dotted', color: '#d0d0d0', delay: 6.2 },
    { id: 'r1', a: 'p1', b: 'p2', style: 'solid', color: '#ffffff', arrow: true, ring: true, delay: 0.4 },
    { id: 'r2', a: 'p2', b: 'p4', style: 'solid', color: '#ffffff', arrow: true, ring: true, delay: 0.6 },
    { id: 'r3', a: 'p4', b: 'p3', style: 'solid', color: '#ffffff', arrow: true, ring: true, delay: 0.8 },
    { id: 'r4', a: 'p3', b: 'p1', style: 'solid', color: '#ffffff', arrow: true, ring: true, delay: 1.0 },
  ],
};
const CAP_SPEC: DSpec = {
  core: { title: 'CAPACIDAD', sub: 'Respuesta territorial', color: '#ebe5d9' },
  nodes: [
    { id: 'q3', title: 'ECOSISTEMAS', badge: 'EXISTENTE', badgeColor: '#6fb1a7', sub: 'Humedales con perímetro vigente', Icon: Waves, color: '#6fb1a7', ink: '#06201c', ang: 0 },
    { id: 'q2', title: 'INFRAESTRUCTURA', badge: 'EXISTENTE', badgeColor: '#6fb1a7', sub: 'Av. Ciudad de Cali · SuDS (propuesta)', Icon: Route, color: '#9c8fc0', ink: '#150f2b', ang: 120 },
    { id: 'q1', title: 'COMUNIDADES', badge: 'EXISTENTE', badgeColor: '#6fb1a7', sub: 'Colectivos ambientales · JAC de Kennedy', Icon: Users, color: '#cdae67', ink: '#2a2008', ang: 240 },
  ],
  links: [
    { id: 'k1', a: 'core', b: 'q1', style: 'solid', color: '#6fb1a7', arrow: true, delay: 0.5 },
    { id: 'k2', a: 'core', b: 'q2', style: 'solid', color: '#6fb1a7', arrow: true, delay: 0.7 },
    { id: 'k3', a: 'core', b: 'q3', style: 'solid', color: '#6fb1a7', arrow: true, delay: 0.9 },
    { id: 'c1', a: 'q1', b: 'q3', style: 'dashed', color: COLORS.mustard, ring: true, delay: 2.0 },
    { id: 'c2', a: 'q3', b: 'q2', style: 'dotted', color: COLORS.coral, ring: true, delay: 2.3 },
    { id: 'c3', a: 'q2', b: 'q1', style: 'dashed', color: COLORS.mustard, ring: true, delay: 2.6 },
  ],
};
const WET_SPEC: DSpec = {
  core: { title: 'HUMEDALES', sub: 'Perímetros de protección vigentes', color: '#6fd07a' },
  nodes: [
    { id: 'i1', title: 'SISTEMAS HÍDRICOS', Icon: Droplets, color: '#5ab0ff', ink: '#06182b', ang: 315 },
    { id: 'i2', title: 'BARRIOS', Icon: House, color: '#cdae67', ink: '#2a2008', ang: 45 },
    { id: 'i4', title: 'ACTIVIDADES ECONÓMICAS', Icon: Store, color: '#d9755f', ink: '#2a0d06', ang: 135 },
    { id: 'i3', title: 'MOVILIDAD', Icon: Truck, color: '#9c8fc0', ink: '#150f2b', ang: 225 },
  ],
  links: [
    { id: 'ia1', a: 'core', b: 'i1', style: 'solid', color: LINE_COLORS.hidrico, arrow: true, delay: 0.8 },
    { id: 'ia3', a: 'core', b: 'i3', style: 'solid', color: LINE_COLORS.vial, arrow: true, delay: 1.1 },
    { id: 'ia2', a: 'core', b: 'i2', style: 'dotted', color: LINE_COLORS.socio, delay: 1.4 },
    { id: 'ia4', a: 'core', b: 'i4', style: 'dotted', color: COLORS.coral, delay: 1.7 },
  ],
};
const emphPress = (id: string, b: number, ring: boolean) => (ring ? (b === 6 ? 1 : 0) : b === 6 ? 0.28 : b === 5 ? 0.85 : 1);
const emphAll = () => 1;
interface Red { nodes: [number, number, number, string][]; edges: [number, number, number, number][]; capas: string[]; tipos: string[]; total: { nodos: number; relaciones: number; capas: number } }
interface Api { map: maplibregl.Map; markers: Record<string, HTMLElement>; hl: HL; three: { ready: boolean; on: boolean; k: { v: number } }; ready: boolean }

export default function Conclusion() {
  const [beat, setBeat] = useState(0);
  const [selP, setSelP] = useState<string | null>(null);
  const [m, setM] = useState(() => window.innerWidth < 768);
  const [size, setSize] = useState(() => stageSize());
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
  const paths = useRef<Record<string, { base: SVGPathElement | null; flow: SVGPathElement | null; trav: SVGPathElement | null }>>({});
  const mRef = useRef(m); mRef.current = m;
  const selRef = useRef<string | null>(null); selRef.current = selP;

  const projectAt = useCallback((ll: LngLat) => () => {
    const ap = api.current, el = mapElRef.current, st = stageRef.current;
    if (!ap || !ap.ready || !el || !st) return null;
    const r = el.getBoundingClientRect(), s = st.getBoundingClientRect(), k = r.width / (el.clientWidth || 1), p = ap.map.project(ll);
    return { x: r.left - s.left + p.x * k, y: r.top - s.top + p.y * k };
  }, []);
  const projCorab = useRef(projectAt(CORAB)).current;
  const projMid = useRef(projectAt(MID)).current;
  const projWet = useRef(projectAt(WET)).current;
  const go = useCallback((i: number) => {
    const t = Math.max(0, Math.min(N - 1, i));
    gsap.to(window, { scrollTo: { y: t * window.innerHeight, autoKill: false }, duration: reduced() ? 0 : 0.9, ease: 'power2.inOut' });
  }, []);

  // ---------- posiciones de los elementos
  const applyLayout = (b: number, instant = false) => {
    const { W, H } = stageSize(), rm = reduced() || instant;
    Object.entries(layout(b, mRef.current)).forEach(([id, s]) => {
      const el = els.current[id]; if (!el) return;
      const pos = Number.isFinite(s.x) ? { x: s.x * W, y: s.y * H } : {};
      gsap.killTweensOf(el, 'x,y,opacity,scale');
      gsap.to(el, { ...pos, opacity: s.o, scale: s.s, duration: rm ? 0 : 1.1, delay: rm ? 0 : s.d, ease: 'power3.inOut', overwrite: 'auto', pointerEvents: s.o > 0.5 ? 'auto' : 'none' });
    });
  };

  useLayoutEffect(() => {
    const { W, H } = stageSize();
    Object.entries(layout(0, mRef.current)).forEach(([id, s]) => {
      const el = els.current[id]; if (!el) return;
      gsap.set(el, { xPercent: -50, yPercent: -50, x: Number.isFinite(s.x) ? s.x * W : 0, y: Number.isFinite(s.y) ? s.y * H : 0, opacity: 0, scale: s.s });
    });
    CONNS.forEach((c) => { cs.current[c.id] = { p: 0, op: 0 }; });
  }, []);

  // ---------- reencuadre automático
  useEffect(() => {
    let t = 0;
    const refit = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => { setSize(stageSize()); setM(window.innerWidth < 768); api.current?.map.resize(); applyLayout(beatRef.current, true); ScrollTrigger.refresh(); }, 60);
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

  // red POT-Kennedy real animada (se enciende desde Corabastos hacia afuera)
  const netRef = useRef<SVGSVGElement>(null);
  const net = useRef<{ red: Red | null; P: { v: number }; O: { v: number } }>({ red: null, P: { v: 0 }, O: { v: 0 } });
  const orb = useRef({ on: false, base: -10, t0: 0 });
  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, reduced() ? 0 : ms)); };
  const showMk = (ids: string[]) => { const a = api.current; if (!a) return; Object.entries(a.markers).forEach(([id, el]) => el.classList.toggle('on', ids.includes(id))); };

  // cámara, capas y marcadores por secuencia
  useEffect(() => {
    const a = api.current; if (!a || !mapReady) return;
    const b = beat, prev = prevRef.current;
    clearTimers();
    orb.current.on = false;
    const { H } = stageSize();
    const C = cam(b, mRef.current);
    const fly = (ms: number) => a.map.easeTo({ center: C.c, zoom: C.z, pitch: C.pitch, bearing: C.bearing, padding: { top: Math.round(H * (b === 11 ? 0.4 : 0.15)), bottom: Math.round(H * 0.1), left: 0, right: 0 }, duration: reduced() ? 0 : ms, essential: true });
    gsap.to(mapWrapRef.current, { opacity: b < 2 ? 0 : b === 10 ? 0.3 : b === 11 ? 0.78 : b === 8 ? 0.8 : b >= 3 && b <= 7 ? 0.5 : 1, scale: b < 2 ? 0.94 : 1, duration: reduced() ? 0 : 1.4, ease: 'power2.inOut', delay: b === 2 && prev < 2 ? 0.4 : 0 });
    if (b < 2) { to3D(false); fly(0); }
    else {
      if (b === 2 && prev < 2) { a.map.jumpTo({ center: MID, zoom: 12.8, pitch: 0, bearing: 0 }); later(() => fly(3400), 900); later(() => to3D(true), 600); }
      else { fly(b === 3 ? 2600 : 2200); to3D(true); }
    }
    if (b === 11) orb.current = { on: true, base: C.bearing, t0: performance.now() + (reduced() ? 1e12 : 3600) };
    // marcadores
    const mk = b === 2 ? ['corab'] : b === 7 ? ['act1', 'act2', 'avcali', 'suds', 'burro'] : b === 8 || b === 9 ? ['burro', 'techo', 'lavaca'] : [];
    later(() => showMk(mk), b === 2 ? 3000 : 600);
    // capas de análisis (con escalonado propio en la propagación)
    const target = HLT[b];
    (Object.keys(target) as (keyof HL)[]).forEach((k) => {
      const dl = b === 3 && HLDELAY3[k] !== undefined ? HLDELAY3[k]! : b === 2 && k === 'corab' ? 2.2 : 0;
      gsap.to(a.hl, { [k]: target[k], duration: reduced() ? 0 : 1.2, delay: reduced() ? 0 : dl, ease: 'power2.inOut', overwrite: 'auto', onUpdate: () => paintHL() });
    });
    return clearTimers;
  }, [beat, mapReady]);

  // ---------- red viva final
  useEffect(() => {
    if (!mapReady) return;
    const svg = netRef.current; if (!svg) return;
    let dead = false; let tickFn: (() => void) | null = null;
    fetch('./data/red.json').then((r) => r.json()).then((red: Red) => {
      if (dead) return;
      net.current.red = red;
      const NS = 'http://www.w3.org/2000/svg';
      const mkEl = (tag: string, at: Record<string, string | number>) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, String(at[k])); return e; };
      const dist = (i: number) => Math.hypot((red.nodes[i][0] - CORAB[0]) * 1.1, red.nodes[i][1] - CORAB[1]);
      const maxD = Math.max(...red.nodes.map((_, i) => dist(i))) || 1;
      const deg = red.nodes.map(() => 0); red.edges.forEach(([s, t]) => { deg[s]++; deg[t]++; });
      const gE = mkEl('g', {}), gP = mkEl('g', {}), gN = mkEl('g', {}); svg.append(gE, gP, gN);
      const eRank = red.edges.map(([s, t]) => (dist(s) + dist(t)) / 2 / maxD);
      const eEls = red.edges.map(([s, , , w], i) => { const p = mkEl('path', { fill: 'none', stroke: red.capas[red.nodes[s][2]], 'stroke-width': 0.9 + w * 0.55, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1, opacity: 0 }); gE.appendChild(p); return p; });
      const pulses = red.edges.map((e, i) => ({ i, ph: (i * 0.37) % 1, sp: 0.16 + ((i * 7) % 5) * 0.035 })).filter((_, i) => red.edges[i][3] >= 2 || i % 3 === 0).slice(0, 46);
      const pEls = pulses.map((pl) => { const c = mkEl('circle', { r: 2.6, fill: '#ffffff', opacity: 0 }); (c as SVGElement).style.filter = 'drop-shadow(0 0 5px ' + red.capas[red.nodes[red.edges[pl.i][0]][2]] + ')'; gP.appendChild(c); return c; });
      const nRank = red.nodes.map((_, i) => dist(i) / maxD);
      const short = (s: string) => s.split(' (')[0].split(' / ')[0].replace(/^Flora Nativa Hub: /, '').toUpperCase().slice(0, 30);
      const nEls = red.nodes.map((n, i) => {
        const g = mkEl('g', {}); const halo = mkEl('circle', { fill: 'none', stroke: red.capas[n[2]], 'stroke-width': 1.4, opacity: 0 });
        const c = mkEl('circle', { fill: red.capas[n[2]], stroke: '#000', 'stroke-width': 1.2, opacity: 0 });
        const t = mkEl('text', { fill: '#e8e8e8', 'font-size': 10, 'letter-spacing': '0.1em', opacity: 0, 'paint-order': 'stroke', stroke: '#000', 'stroke-width': 3, 'stroke-linejoin': 'round' }); (t as SVGElement).style.fontFamily = 'IBM Plex Mono, monospace'; t.textContent = short(n[3]);
        g.append(halo, c, t); gN.appendChild(g); return { halo, c, t };
      });
      const stageEl = stageRef.current!, mapEl = mapElRef.current!;
      const proj = (ll: LngLat) => { const a = api.current; if (!a) return null; const r = mapEl.getBoundingClientRect(), k = r.width / (mapEl.clientWidth || 1), p = a.map.project(ll), s = stageEl.getBoundingClientRect(); return { x: r.left - s.left + p.x * k, y: r.top - s.top + p.y * k }; };
      tickFn = () => {
        const O = net.current.O.v, P = net.current.P.v;
        svg.style.opacity = String(O);
        if (orb.current.on) { const now = performance.now(); if (now > orb.current.t0 && api.current) api.current.map.setBearing(orb.current.base + ((now - orb.current.t0) / 1000) * 2.6); }
        if (O < 0.01) return;
        const time = gsap.ticker.time;
        const dots = beatRef.current === 10;
        const pos = red.nodes.map((n) => proj([n[0], n[1]]));
        red.edges.forEach(([s, t], i) => {
          const a = pos[s], b = pos[t]; const el = eEls[i]; if (!a || !b) return;
          const st = eRank[i] * 0.62, pr = Math.max(0, Math.min(1, (P - st) / 0.38));
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 - len * 0.3 - 6;
          el.setAttribute('d', 'M' + a.x + ',' + a.y + ' Q' + cx + ',' + cy + ' ' + b.x + ',' + b.y);
          el.setAttribute('stroke-dashoffset', String(1 - pr)); el.setAttribute('opacity', dots ? '0' : String(0.62 * Math.min(1, pr * 3)));
        });
        pulses.forEach((pl, k) => {
          const [s, t] = red.edges[pl.i], a = pos[s], b = pos[t]; const el = pEls[k]; if (!a || !b) return;
          const st = eRank[pl.i] * 0.62, pr = Math.max(0, Math.min(1, (P - st) / 0.38));
          if (pr < 0.98 || dots) { el.setAttribute('opacity', '0'); return; }
          const u = (time * pl.sp + pl.ph) % 1, len = Math.hypot(b.x - a.x, b.y - a.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2 - len * 0.3 - 6, v = 1 - u;
          el.setAttribute('cx', String(v * v * a.x + 2 * v * u * cx + u * u * b.x)); el.setAttribute('cy', String(v * v * a.y + 2 * v * u * cy + u * u * b.y)); el.setAttribute('opacity', String(0.95 * Math.sin(u * Math.PI)));
        });
        // etiquetas mono de lugares reales: solo fuera de la red propia y sin chocar entre sí
        const { W: sw, H: sh } = stageSize(); const placed: { x0: number; y0: number; x1: number; y1: number }[] = [];
        const ccx = sw / 2, ccy = sh * 0.5, r1n = Math.min(sh * 0.2, sw * 0.17);
        const order = red.nodes.map((_, i) => i).sort((x, y) => deg[y] - deg[x]);
        const labelOn = new Set<number>();
        if (dots && !mRef.current) {
          for (const i of order) {
            const p = pos[i]; if (!p || labelOn.size >= 8) continue;
            const wd = red.nodes[i][3].split(' (')[0].split(' / ')[0].slice(0, 30).length * 6.8 + 14, box = { x0: p.x + 8, y0: p.y - 8, x1: p.x + 8 + wd, y1: p.y + 8 };
            if (((p.x - ccx) / (r1n * 0.87 + 270)) ** 2 + ((p.y - ccy) / (r1n * 1.9 + 40)) ** 2 < 1 || box.x1 > sw - 20 || box.x0 < 10 || p.y < 80 || p.y > sh - 120) continue;
            if (box.x0 < 330 && p.y < 90) continue;
            if (placed.some((q) => box.x0 < q.x1 + 6 && box.x1 > q.x0 - 6 && box.y0 < q.y1 + 4 && box.y1 > q.y0 - 4)) continue;
            placed.push(box); labelOn.add(i);
          }
        }
        nEls.forEach((n, i) => {
          const p = pos[i]; if (!p) return;
          n.t.setAttribute('x', String(p.x + 9)); n.t.setAttribute('y', String(p.y + 3.5)); n.t.setAttribute('opacity', labelOn.has(i) ? '0.95' : '0');
          const vis = dots ? (labelOn.has(i) ? 0.9 : 0) : Math.max(0, Math.min(1, (P - nRank[i] * 0.62) / 0.12)), r = (3 + Math.min(deg[i], 12) * 0.42) * (0.6 + 0.4 * vis);
          const pulse = 1 + 0.16 * Math.sin(time * 2.2 + i);
          n.c.setAttribute('cx', String(p.x)); n.c.setAttribute('cy', String(p.y)); n.c.setAttribute('r', String(r * pulse)); n.c.setAttribute('opacity', String(vis));
          n.halo.setAttribute('cx', String(p.x)); n.halo.setAttribute('cy', String(p.y));
          if (!dots && deg[i] >= 5) { const q = (time * 0.6 + i * 0.3) % 1; n.halo.setAttribute('r', String(r * (1.4 + q * 2.4))); n.halo.setAttribute('opacity', String(vis * 0.65 * (1 - q))); } else n.halo.setAttribute('opacity', '0');
        });
      };
      gsap.ticker.add(tickFn);
    }).catch(() => undefined);
    return () => { dead = true; if (tickFn) gsap.ticker.remove(tickFn); svg.replaceChildren(); net.current.red = null; };
  }, [mapReady]);

  // ---------- elementos y conexiones
  useEffect(() => {
    applyLayout(beat);
    CONNS.forEach((c) => {
      const s = cs.current[c.id]; if (!s) return;
      const on = c.show(beat), rm = reduced();
      gsap.killTweensOf(s, 'p');
      gsap.to(s, { p: on ? 1 : 0, duration: rm ? 0 : on ? 1.1 : 0.5, delay: rm ? 0 : on ? c.delay(beat) : 0, ease: 'power2.inOut', overwrite: 'auto' });
      gsap.to(s, { op: c.op(beat), duration: rm ? 0 : 0.8, overwrite: false });
    });
    if (beat < 3 || beat > 7) setSelP(null);
    const fin = beat === 11, rmo = reduced();
    gsap.to(net.current.O, { v: fin ? 1 : beat === 10 ? 0.9 : 0, duration: rmo ? 0 : 0.9, overwrite: true });
    gsap.to(net.current.P, { v: fin ? 1 : 0, duration: rmo ? 0 : fin ? 7 : 0.4, delay: rmo ? 0 : fin ? 1.6 : 0, ease: 'power2.inOut', overwrite: true });
    // título por letras y contadores
    const lt = stageRef.current ? Array.from(stageRef.current.querySelectorAll('.ltr')) : [];
    if (fin) gsap.fromTo(lt, { y: 54, opacity: 0, filter: 'blur(12px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: rmo ? 0 : 1.2, ease: 'power3.out', stagger: rmo ? 0 : 0.05, delay: rmo ? 0 : 0.7, overwrite: true });
    else gsap.set(lt, { opacity: 0, y: 54 });
    const nums = stageRef.current ? Array.from(stageRef.current.querySelectorAll('.stat')) as HTMLElement[] : [];
    nums.forEach((el) => {
      const target = +(el.dataset.v ?? 0), o = { v: 0 };
      if (fin) gsap.to(o, { v: target, duration: rmo ? 0 : 2.4, delay: rmo ? 0 : 2.2, ease: 'power2.out', onUpdate: () => { el.textContent = String(Math.round(o.v)); }, overwrite: true });
      else el.textContent = '0';
    });
  }, [beat]);

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
    const tick = () => {
      const sr = stage.getBoundingClientRect();
      // pines anclados al mapa
      const pinC = els.current.pinC, hubW = els.current.hubW;
      const pc = place(CORAB); if (pinC && pc) gsap.set(pinC, { x: pc.x - sr.left, y: pc.y - sr.top - (mRef.current ? 70 : 92) });
      const pw = place(WET); if (hubW && pw) gsap.set(hubW, { x: pw.x - sr.left, y: pw.y - sr.top - 52 });
      for (const c of CONNS) {
        const st = cs.current[c.id], p = paths.current[c.id];
        if (!st || !p || !p.base || !p.flow) continue;
        if (st.p < 0.002) { p.base.style.opacity = '0'; p.flow.style.opacity = '0'; if (p.trav) p.trav.style.opacity = '0'; continue; }
        const a = pt(c.a), b = pt(c.b);
        if (!a || !b || !Number.isFinite(a.x + a.y + b.x + b.y)) { p.base.style.opacity = '0'; p.flow.style.opacity = '0'; continue; }
        a.x -= sr.left; a.y -= sr.top; b.x -= sr.left; b.y -= sr.top;
        const d = c.bulge !== undefined ? Qb(a, b, c.bulge) : Sh(a, b);
        const sel = selRef.current && ((selRef.current === 'p1' && c.id === 'cv') || (selRef.current === 'p4' && (c.id === 'ch' || c.id === 'ce')) || (selRef.current === 'p3' && c.id === 'cb') || (selRef.current === 'p2' && c.id === 'cp'));
        p.base.setAttribute('d', d); p.flow.setAttribute('d', d);
        if (p.trav) { p.trav.setAttribute('d', d); p.trav.style.opacity = st.p > 0.98 ? String(Math.min(1, st.op + 0.15)) : '0'; }
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
  const selCard = [...PRESS.map((p) => ({ id: p.id, title: p.title, ev: p.ev as string, color: p.color, note: p.note })), ...CAPS.map((c) => ({ id: c.id, title: c.title, ev: 'EXISTENTE', color: c.color, note: c.note }))].find((p) => p.id === selP);
  const mapTop = 0;

  const EvBadge = ({ ev }: { ev: string }) => (
    <span className="kicker" style={{ color: EVID_COLOR[ev as keyof typeof EVID_COLOR], display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <i style={{ width: 7, height: 7, borderRadius: '50%', background: EVID_COLOR[ev as keyof typeof EVID_COLOR], display: 'inline-block' }} />{ev}
    </span>
  );
  const red0 = { nodos: 58, relaciones: 383, capas: 8, visibles: 76 };
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

        <svg ref={netRef} id="net" aria-hidden />
        <svg id="links" aria-hidden>
          {CONNS.map((c, ci) => (
            <g key={c.id}>
              <path ref={(n) => { paths.current[c.id] = { ...(paths.current[c.id] ?? { flow: null, trav: null }), base: n }; }} pathLength={1} stroke={c.color} strokeDasharray="1" strokeDashoffset="1" strokeWidth={c.w} opacity={0} />
              <path ref={(n) => { paths.current[c.id] = { ...(paths.current[c.id] ?? { base: null, trav: null }), flow: n }; }} className="flow" stroke={c.color} strokeWidth={c.w * 1.9} opacity={0} />
              <path ref={(n) => { paths.current[c.id] = { ...(paths.current[c.id] ?? { base: null, flow: null }), trav: n }; }} className="trav" pathLength={1} stroke="#ffffff" strokeWidth={c.w * 2.4} opacity={0}
                style={{ ['--dur' as string]: 2.2 + (ci % 5) * 0.38 + 's', ['--dl' as string]: '-' + ((ci * 0.53) % 3).toFixed(2) + 's', filter: 'drop-shadow(0 0 5px ' + c.color + ')' } as React.CSSProperties} />
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
          <h3 className="title-main" style={{ fontSize: m ? 'clamp(16px,4.8vw,26px)' : 'clamp(18px,1.9vw,34px)', letterSpacing: '0.05em', lineHeight: 1.2 }}>¿Por qué no podemos intervenir cada problema por separado?</h3>
        </div>
        <div ref={reg('hCap')} className="abs chip" style={{ whiteSpace: m ? 'normal' : 'nowrap', textAlign: 'center', maxWidth: '88vw' }}>Capacidad de respuesta territorial</div>
        <div ref={reg('hRec')} className="abs text-center" style={{ pointerEvents: 'none' }}>
          <h2 className="title-main" style={{ fontSize: m ? 'clamp(26px,8vw,48px)' : 'clamp(32px,4.6vw,80px)', letterSpacing: '0.1em' }}>Recuperar no es aislar</h2>
        </div>
        <div ref={reg('subRec')} className="abs text-center" style={{ width: m ? '86vw' : '46vw', pointerEvents: 'none', background: 'rgba(0,0,0,0.78)', border: '1px solid #383838', borderRadius: 14, padding: '14px 20px' }}>
          <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(14px,1.25vw,19px)', color: '#d4d4d4', lineHeight: 1.5 }}>Proteger los humedales no consiste únicamente en delimitar sus bordes, sino también en comprender y gestionar las dinámicas que afectan su funcionamiento.</p>
        </div>

        {/* 3-9. redes: mismo lenguaje premium, ancladas a puntos reales del mapa */}
        <Diagram spec={PRESS_SPEC} active={beat >= 3 && beat <= 6} beat={beat} W={size.W} H={size.H} m={m} project={projCorab} emph={emphPress} selected={selP} onSelect={(id) => setSelP((s) => (s === id ? null : id))} />
        <Diagram spec={CAP_SPEC} active={beat === 7} beat={beat} W={size.W} H={size.H} m={m} project={projMid} emph={emphAll} selected={selP} onSelect={(id) => setSelP((s) => (s === id ? null : id))} />
        <Diagram spec={WET_SPEC} active={beat === 9} beat={beat} W={size.W} H={size.H} m={m} project={projWet} emph={emphAll} selected={null} onSelect={() => undefined} />

        {/* 7. red propia premium */}
        <RedPremium active={beat === 10} W={size.W} H={size.H} m={m} />

        {/* 8. conclusión */}
        <div ref={reg('fin')} className="abs text-center" style={{ pointerEvents: 'none', width: '94vw' }}>
          <h2 className="title-main" style={{ fontSize: m ? 'clamp(20px,6.6vw,40px)' : 'clamp(26px,3.9vw,70px)', letterSpacing: '0.08em', textShadow: '0 0 40px rgba(0,0,0,0.9)' }} aria-label="Kennedy como sistema vivo">
            {'Kennedy como sistema vivo'.split(' ').map((w, wi) => (
              <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap', marginRight: '0.32em' }} aria-hidden>
                {w.split('').map((ch, ci) => <span key={ci} className="ltr" style={{ display: 'inline-block', opacity: 0 }}>{ch}</span>)}
              </span>
            ))}
          </h2>
        </div>
        <div ref={reg('finSub')} className="abs text-center" style={{ width: m ? '84vw' : '40vw', pointerEvents: 'none' }}>
          <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(14px,1.3vw,20px)', color: '#e0e0e0', textShadow: '0 0 18px #000' }}>Comprender sus relaciones para orientar su transformación.</p>
        </div>
        <div ref={reg('stats')} className="abs text-center" style={{ pointerEvents: 'none' }}>
          <div className="flex items-end justify-center" style={{ gap: m ? 22 : 44 }}>
            {[['nodos', red0.nodos], ['relaciones', red0.relaciones], ['capas', red0.capas]].map(([l, v]) => (
              <div key={l as string}>
                <b className="stat title-main" data-v={v as number} style={{ fontSize: m ? 24 : 'clamp(24px,2.6vw,44px)', fontWeight: 300, display: 'block' }}>0</b>
                <span className="kicker">{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div ref={reg('noteN')} className="abs" style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.85)', border: '1px solid #383838', borderRadius: 12, padding: '10px 14px', width: m ? '86vw' : 'min(23vw,290px)' }}>
          <p className="kicker" style={{ marginBottom: 4 }}>Red del proyecto</p>
          <p style={{ fontSize: 11.5, color: '#d0d0d0', lineHeight: 1.45 }}>Se muestran las {red0.visibles} relaciones de mayor peso entre los {red0.nodos} nodos. Cada color es una capa territorial.</p>
        </div>
        <div ref={reg('cta')} className="abs text-center" style={{ pointerEvents: 'none' }}>
          <a className="btn-ghost pri shine" href="../pot-kennedy-mapa.html" style={{ pointerEvents: beat === 11 ? 'auto' : 'none', height: 46, padding: '0 22px', fontSize: 13 }}>Explorar red completa →</a>
        </div>

        {/* leyendas y pie de texto */}
        <div ref={reg('leg3')} className="abs" style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.85)', border: '1px solid #383838', borderRadius: 12, padding: '10px 14px', width: m ? '86vw' : 'min(23vw,290px)' }}>
          <p className="kicker" style={{ marginBottom: 6 }}>Tipos de relación</p>
          {[['Red vial', LINE_COLORS.vial, '1'], ['Sistema hídrico', LINE_COLORS.hidrico, '1'], ['Conexión ecológica', LINE_COLORS.ecologico, '1'], ['Relación socioeconómica', LINE_COLORS.socio, '0']].map(([t, c, s]) => (
            <div key={t} className="flex items-center gap-2" style={{ fontSize: 11.5, color: '#d0d0d0', lineHeight: 1.7 }}>
              <svg width="30" height="8"><line x1="0" y1="4" x2="30" y2="4" stroke={c} strokeWidth="2.2" strokeDasharray={s === '1' ? undefined : '1 5'} strokeLinecap="round" /></svg>{t}
            </div>
          ))}
          <div className="flex flex-wrap gap-x-3 gap-y-1" style={{ marginTop: 6 }}>{(['DOCUMENTADA', 'INFERIDA', 'HIPOTÉTICA'] as const).map((e) => <EvBadge key={e} ev={e} />)}</div>
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
          {selCard && beat >= 3 && beat <= 7 ? (
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
