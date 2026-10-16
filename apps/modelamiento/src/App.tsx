import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import * as maplibregl from 'maplibre-gl';
import { ChartLine, Droplets, Lightbulb, Network, Satellite, Share2, Store, Truck, Users, Waypoints, type LucideIcon } from 'lucide-react';
import { BEATS, COLORS, COMPONENTS, DYNS, PLACES, RELS, STEP_LABELS, type LngLat } from './content';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
// El worker de MapLibre se sirve como archivo estático (public/) para que funcione igual en dev y en GitHub Pages.
maplibregl.setWorkerUrl(new URL('./maplibre-gl-worker.mjs', document.baseURI).href);

(window as unknown as { __gsap: typeof gsap }).__gsap = gsap; // utilidad de depuración
const N = BEATS.length;
const DYN_ICONS: Record<string, LucideIcon> = { dyn1: Store, dyn2: Truck, dyn3: Users, dyn4: Droplets };
const COMP_ICONS: LucideIcon[] = [ChartLine, Satellite, Share2];
const cv = (c: string, ink = '#0a0a0a') => ({ '--c': c, '--ink': ink }) as React.CSSProperties;
export const stageSize = () => {
  const s = document.getElementById('stage');
  return { W: (s && s.clientWidth) || window.innerWidth, H: (s && s.clientHeight) || window.innerHeight };
};
export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- disposición por secuencia
interface St { x: number; y: number; o: number; s: number; d: number }
const T = (x: number, y: number, o = 1, s = 1, d = 0): St => ({ x, y, o, s, d });

function layout(b: number, m: boolean): Record<string, St> {
  const L: Record<string, St> = {};
  const dim = b >= 9 ? 0 : 1;
  const hy = m ? 0.305 : 0.255;
  // título
  L.title = b === 0 ? T(0.5, 0.5, 1, 1) : b >= 9 ? T(0.5, -0.04, 0, m ? 0.5 : 0.3) : T(0.5, m ? 0.055 : 0.07, 1, m ? 0.5 : 0.3);
  L.hint = b === 0 ? T(0.5, m ? 0.62 : 0.64, 0.9, 1, 1.4) : T(0.5, m ? 0.62 : 0.64, 0);
  // dos ejes
  L.ejes = b === 0 ? T(0.5, 0.5, 0, 0.94) : b === 1 ? T(0.5, m ? 0.27 : 0.31, 1, 1, 0.55) : b >= 9 ? T(0.5, -0.02, 0, 1) : T(0.5, m ? 0.125 : 0.172, 1, 1);
  if (b === 0) {
    L.axR = T(0.5, 0.5, 0, 0.94);
    L.axL = T(0.5, 0.5, 0, 0.94);
  } else if (b === 1) {
    L.axR = T(m ? 0.5 : 0.77, m ? 0.5 : 0.52, 1, 1, 1.15);
    L.axL = T(m ? 0.5 : 0.23, m ? 0.68 : 0.52, 1, 1, 1.15);
  } else {
    L.axR = T(m ? 0.76 : 0.84, b >= 9 ? -0.02 : m ? 0.2 : 0.15, b >= 9 ? 0 : 1, 1);
    L.axL = T(m ? 0.24 : 0.16, b >= 9 ? -0.02 : m ? 0.2 : 0.15, b >= 9 ? 0 : 1, 1);
  }
  // encabezados de secuencia
  L.hVivo = b >= 3 && b <= 7 ? T(0.5, hy, 1, 1, 0.35) : T(0.5, hy, 0, 0.98);
  L.hRel = b === 8 ? T(0.5, hy, 1, 1, 0.35) : T(0.5, hy, 0, 0.98);
  L.hRed = b >= 9 ? T(0.5, m ? 0.2 : 0.17, 1, 1, 0.5) : T(0.5, m ? 0.2 : 0.17, 0, 0.98);
  // dinámicas
  const dp = m ? [[0.25, 0.43], [0.75, 0.43], [0.25, 0.72], [0.75, 0.72]] : [[0.15, 0.47], [0.85, 0.47], [0.15, 0.73], [0.85, 0.73]];
  DYNS.forEach((d, i) => { L[d.id] = b >= 4 + i ? T(dp[i][0], dp[i][1], dim, 1, 0.1) : T(dp[i][0], dp[i][1], 0, 0.96); });
  // red propia
  L.hub = b >= 9 ? T(0.5, m ? 0.4 : 0.42, 1, 1, 0.5) : T(0.5, m ? 0.4 : 0.42, 0, 0.96);
  const cp = m ? [[0.5, 0.54], [0.5, 0.65], [0.5, 0.76]] : [[0.2, 0.64], [0.5, 0.64], [0.8, 0.64]];
  COMPONENTS.forEach((c, i) => { L[c.id] = b >= 9 ? T(cp[i][0], cp[i][1], 1, 1, 0.9 + i * 0.35) : T(cp[i][0], cp[i][1], 0, 0.96); });
  L.caption = b >= 4 && b <= 8 ? T(0.5, m ? 0.84 : 0.86, 1, 1, b === 8 ? 2 : 1.1) : T(0.5, m ? 0.84 : 0.86, 0);
  L.cta = b === 10 ? T(0.5, m ? 0.88 : 0.82, 1, 1, 1.2) : T(0.5, m ? 0.88 : 0.82, 0);
  return L;
}

// ---------------------------------------------------------------- conexiones
interface Conn {
  id: string; kind: 'title' | 'axes' | 'kennedy' | 'loc' | 'rel' | 'hub';
  a: string; b: string; color: string; w: number; bulge?: number;
  show: (b: number) => boolean; op: (b: number) => number; delay: (b: number) => number;
}
const CONNS: Conn[] = [
  { id: 'tv', kind: 'title', a: 'el:title', b: 'el:ejes', color: COLORS.ink, w: 1, show: (b) => b >= 1 && b < 9, op: () => 0.9, delay: () => 0.35 },
  { id: 'axR', kind: 'axes', a: 'el:ejes', b: 'el:axR', color: COLORS.ink, w: 1, show: (b) => b >= 1 && b < 9, op: () => 0.85, delay: (b) => (b === 1 ? 1 : 0.2) },
  { id: 'axL', kind: 'axes', a: 'el:ejes', b: 'el:axL', color: COLORS.ink, w: 1, show: (b) => b >= 1 && b < 9, op: () => 0.85, delay: (b) => (b === 1 ? 1 : 0.2) },
  { id: 'kR', kind: 'kennedy', a: 'el:axR', b: 'kennedy', color: COLORS.coral, w: 1.2, show: (b) => b === 2, op: () => 0.9, delay: () => 0.8 },
  { id: 'kL', kind: 'kennedy', a: 'el:axL', b: 'kennedy', color: COLORS.coral, w: 1.2, show: (b) => b === 2, op: () => 0.9, delay: () => 0.8 },
  ...DYNS.map((d, i): Conn => ({ id: 'loc' + (i + 1), kind: 'loc', a: 'el:' + d.id, b: 'place:' + d.place, color: d.color, w: 1.4, show: (b) => b >= 4 + i && b < 8, op: () => 0.95, delay: () => 0.55 })),
  ...RELS.map((r, i): Conn => ({ id: r.id, kind: 'rel', a: 'el:' + r.a, b: 'el:' + r.b, color: '#ffffff', w: 2, bulge: [-70, 46, 56, 56][i], show: (b) => b >= 8 && b < 9, op: () => 1, delay: () => 0.5 + i * 0.5 })),
  ...COMPONENTS.map((c, i): Conn => ({ id: 'hub' + (i + 1), kind: 'hub', a: 'el:hub', b: 'el:' + c.id, color: COLORS.ink, w: 1.1, show: (b) => b >= 9, op: () => 0.9, delay: () => 0.9 + i * 0.35 })),
];

type Pt = { x: number; y: number };
const Sh = (a: Pt, b: Pt) => { const mx = (a.x + b.x) / 2; return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`; };
const Sv = (a: Pt, b: Pt) => { const my = (a.y + b.y) / 2; return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`; };
const Qb = (a: Pt, b: Pt, bulge: number) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 - (dy / len) * bulge, cy = (a.y + b.y) / 2 + (dx / len) * bulge;
  return `M${a.x},${a.y} Q${cx},${cy} ${b.x},${b.y}`;
};

// ---------------------------------------------------------------- mapa
const MAP_STYLE_BG = COLORS.bg;
export const VIEW3D = { pitch: 52, bearing: -18 };
function decodeBuildings(rows: number[][]) {
  const features = rows.map((r) => {
    let x = r[1], y = r[2];
    const ring: [number, number][] = [[x / 1e5, y / 1e5]];
    for (let i = 3; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; ring.push([x / 1e5, y / 1e5]); }
    ring.push(ring[0]);
    return { type: 'Feature' as const, properties: { h: r[0] }, geometry: { type: 'Polygon' as const, coordinates: [ring] } };
  });
  return { type: 'FeatureCollection' as const, features };
}
function decodeTrees(flat: number[]) {
  const features = [];
  let lo = 0, la = 0;
  for (let i = 0; i < flat.length; i += 3) {
    const h = flat[i] / 10; lo += flat[i + 1]; la += flat[i + 2];
    const lon = lo / 1e5, lat = la / 1e5, r = Math.max(0.8, h * 0.55);
    const dy = r / 110574, dx = r / (111320 * Math.cos((lat * Math.PI) / 180));
    const ring: [number, number][] = [];
    for (let k = 0; k < 6; k++) { const t = (k / 6) * Math.PI * 2; ring.push([lon + dx * Math.cos(t), lat + dy * Math.sin(t)]); }
    ring.push(ring[0]);
    features.push({ type: 'Feature' as const, properties: { h, b: h * 0.32 }, geometry: { type: 'Polygon' as const, coordinates: [ring] } });
  }
  return { type: 'FeatureCollection' as const, features };
}
export async function load3D(map: maplibregl.Map, isDead: () => boolean) {
  const j = (f: string) => fetch('./data/' + f).then((r) => r.json());
  const [b, p, w, v, tr] = await Promise.all([j('edificios.json'), j('parques.json'), j('agua.json'), j('vias.json'), j('arboles.json')]);
  if (isDead()) return false;
  const opt = { maxzoom: 16, tolerance: 0.6, buffer: 16 };
  map.addSource('parques', { type: 'geojson', data: p, ...opt });
  map.addSource('agua', { type: 'geojson', data: w, ...opt });
  map.addSource('vias', { type: 'geojson', data: v, ...opt });
  map.addSource('edificios', { type: 'geojson', data: decodeBuildings(b), ...opt });
  map.addSource('arboles', { type: 'geojson', data: decodeTrees(tr), ...opt });
  map.addLayer({ id: 'parques-fill', type: 'fill', source: 'parques', paint: { 'fill-color': '#3a4d36', 'fill-opacity': 0 } });
  map.addLayer({ id: 'agua-fill', type: 'fill', source: 'agua', paint: { 'fill-color': '#3f7a96', 'fill-opacity': 0 } });
  map.addLayer({ id: 'vias-line', type: 'line', source: 'vias', paint: { 'line-color': '#55555f', 'line-width': 0.7, 'line-opacity': 0 } });
  map.addLayer({
    id: 'bld3d', type: 'fill-extrusion', source: 'edificios',
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'h'], 3, '#b9b4ac', 12, '#d6d2ca', 40, '#f2efe9'],
      'fill-extrusion-height': ['*', ['get', 'h'], 0.001], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0,
      'fill-extrusion-vertical-gradient': true,
    },
  });
  map.addLayer({
    id: 'arboles3d', type: 'fill-extrusion', source: 'arboles',
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'h'], 2, '#3d6a38', 8, '#4e8944', 18, '#6aa95a'],
      'fill-extrusion-height': ['*', ['get', 'h'], 0.001], 'fill-extrusion-base': ['*', ['get', 'b'], 0.001], 'fill-extrusion-opacity': 0,
    },
  });
  map.setLight({ anchor: 'viewport', color: '#ffffff', intensity: 0.5, position: [1.3, 210, 55] });
  return true;
}
export function bboxOf(geom: any): [number, number, number, number] {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const walk = (c: any) => { if (typeof c[0] === 'number') { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } else c.forEach(walk); };
  walk(geom.coordinates);
  return [x0, y0, x1, y1];
}
export const unionBox = (bs: [number, number, number, number][]): [number, number, number, number] =>
  [Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1])), Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3]))];

interface MapApi {
  map: maplibregl.Map; bogota: [number, number, number, number]; kennedy: [number, number, number, number]; cluster: [number, number, number, number];
  markers: Record<string, HTMLElement>; kennedyCenter: LngLat; hl: { v: number };
  three: { ready: boolean; on: boolean; k: { v: number } };
}

export default function App() {
  const [beat, setBeat] = useState(0);
  const [selRel, setSelRel] = useState<string | null>(null);
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
  const api = useRef<MapApi | null>(null);
  const timers = useRef<number[]>([]);
  const cs = useRef<Record<string, { p: number; op: number }>>({});
  const paths = useRef<Record<string, { base: SVGPathElement | null; flow: SVGPathElement | null }>>({});
  const mRef = useRef(m);
  mRef.current = m;
  const selRef = useRef<string | null>(null);
  selRef.current = selRel;

  const go = useCallback((i: number) => {
    const t = Math.max(0, Math.min(N - 1, i));
    gsap.to(window, { scrollTo: { y: t * window.innerHeight, autoKill: false }, duration: reduced() ? 0 : 0.9, ease: 'power2.inOut' });
  }, []);

  // ---------- tamaño: el escenario se reencuadra solo ante cualquier cambio de ventana, zoom o pantalla completa
  useEffect(() => {
    let t = 0;
    const refit = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        setM(window.innerWidth < 768);
        api.current?.map.resize();
        applyLayout(beatRef.current, true);
        ScrollTrigger.refresh();
      }, 60);
    };
    window.addEventListener('resize', refit);
    window.addEventListener('orientationchange', refit);
    window.visualViewport?.addEventListener('resize', refit);
    const ro = new ResizeObserver(refit);
    if (stageRef.current) ro.observe(stageRef.current);
    const late = window.setTimeout(refit, 600);
    window.addEventListener('load', refit);
    return () => {
      window.clearTimeout(t); window.clearTimeout(late); ro.disconnect();
      window.removeEventListener('resize', refit); window.removeEventListener('orientationchange', refit);
      window.visualViewport?.removeEventListener('resize', refit); window.removeEventListener('load', refit);
    };
  }, []);

  // ---------- posiciones de los elementos
  const applyLayout = (b: number, instant = false) => {
    const { W, H } = stageSize(), rm = reduced() || instant;
    const L = layout(b, mRef.current);
    Object.entries(L).forEach(([id, s]) => {
      const el = els.current[id];
      if (!el) return;
      gsap.to(el, {
        x: s.x * W, y: s.y * H, opacity: s.o, scale: s.s,
        duration: rm ? 0 : 1.15, delay: rm ? 0 : s.d, ease: 'power3.inOut', overwrite: 'auto',
        pointerEvents: s.o > 0.5 ? 'auto' : 'none',
      });
    });
  };

  // ---------- estado inicial de los elementos
  useLayoutEffect(() => {
    const L = layout(0, mRef.current);
    const { W, H } = stageSize();
    Object.entries(L).forEach(([id, s]) => {
      const el = els.current[id];
      if (el) gsap.set(el, { xPercent: -50, yPercent: -50, x: s.x * W, y: s.y * H, opacity: 0, scale: s.s });
    });
    CONNS.forEach((c) => { cs.current[c.id] = { p: 0, op: 0 }; });
    if (reduced()) gsap.set(els.current.title!, { opacity: 1 });
    else gsap.fromTo(els.current.title!, { opacity: 0, y: '+=14' }, { opacity: 1, y: '-=14', duration: 1.8, ease: 'power2.out', delay: 0.2 });
    gsap.to(els.current.hint!, { opacity: 0.9, duration: 1, delay: 1.6 });
  }, []);

  // ---------- scroll ↔ secuencia (ScrollTrigger)
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
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) { if (e.key === 'Enter' || e.key === ' ') return; }
      const b = beatRef.current;
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(b + 1); }
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(b - 1); }
    };
    window.addEventListener('keydown', key);
    return () => { st.kill(); window.removeEventListener('keydown', key); };
  }, [go]);

  // ---------- mapa (MapLibre + GeoJSON real de UPL, Decreto 555 de 2021)
  useEffect(() => {
    let dead = false;
    let map: maplibregl.Map | null = null;
    (async () => {
      const data = await fetch('./data/upl-bogota.geojson').then((r) => r.json());
      if (dead || !mapElRef.current) return;
      const feats: any[] = data.features;
      const by = (code: string) => feats.find((f) => f.properties.CODIGO_UPL === code);
      const bogota = unionBox(feats.filter((f) => !['UPL01', 'UPL02', 'UPL05'].includes(f.properties.CODIGO_UPL)).map((f) => bboxOf(f.geometry)));
      
      const pts = Object.values(PLACES).map((p) => p.lngLat);
      const cluster: [number, number, number, number] = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
      // encuadre del sector: UPL Kennedy, Tintal, Porvenir y Patio Bonito, más los lugares del proyecto
      const kennedy = unionBox([bboxOf(by('UPL18').geometry), cluster]);
      map = new maplibregl.Map({
        container: mapElRef.current, interactive: false, attributionControl: false, fadeDuration: 0,
        center: [(bogota[0] + bogota[2]) / 2, (bogota[1] + bogota[3]) / 2], zoom: 9,
        style: {
          version: 8,
          sources: { upl: { type: 'geojson', data } },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': MAP_STYLE_BG } },
            { id: 'upl-fill', type: 'fill', source: 'upl', paint: { 'fill-color': '#15151a' } },
            { id: 'upl-line', type: 'line', source: 'upl', paint: { 'line-color': '#3c3c46', 'line-width': 0.8 } },
            { id: 'near-fill', type: 'fill', source: 'upl', filter: ['in', ['get', 'CODIGO_UPL'], ['literal', ['UPL13', 'UPL14', 'UPL15']]], paint: { 'fill-color': '#1d1d24' } },
            { id: 'kennedy-fill', type: 'fill', source: 'upl', filter: ['==', ['get', 'CODIGO_UPL'], 'UPL18'], paint: { 'fill-color': COLORS.coral, 'fill-opacity': 0 } },
            { id: 'kennedy-line', type: 'line', source: 'upl', filter: ['==', ['get', 'CODIGO_UPL'], 'UPL18'], paint: { 'line-color': COLORS.coral, 'line-width': 2, 'line-opacity': 0 } },
          ],
        },
      });
      map.fitBounds([[bogota[0], bogota[1]], [bogota[2], bogota[3]]], { padding: 30, duration: 0 });
      // marcadores HTML (sin glifos remotos)
      const markers: Record<string, HTMLElement> = {};
      const addMk = (id: string, ll: LngLat, label: string, cls: string, color = COLORS.ink, anchor: 'left' | 'center' = 'left', tag = '') => {
        const outer = document.createElement('div');
        const inner = document.createElement('div');
        inner.className = 'mk ' + cls; inner.style.setProperty('--c', color);
        inner.innerHTML = '<i></i><span>' + label + '</span>' + (tag ? '<em style="background:' + color + '">' + tag + '</em>' : '');
        outer.appendChild(inner);
        new maplibregl.Marker({ element: outer, anchor }).setLngLat(ll).addTo(map!);
        markers[id] = inner;
      };
      const ctr = (code: string): LngLat => { const b = bboxOf(by(code).geometry); return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; };
      const kc = ctr('UPL18');
      addMk('bogota', [(bogota[0] + bogota[2]) / 2, bogota[3] - (bogota[3] - bogota[1]) * 0.05], 'Bogotá · 33 UPL', 'upl', COLORS.ink, 'center');
      addMk('kennedy', kc, 'UPL Kennedy', 'upl', COLORS.coral, 'center');
      addMk('tintal', ctr('UPL13'), 'Tintal', 'upl', COLORS.mut, 'center');
      addMk('porvenir', ctr('UPL15'), 'Porvenir', 'upl', COLORS.mut, 'center');
      addMk('patiob', ctr('UPL14'), 'Patio Bonito', 'upl', COLORS.mut, 'center');
      DYNS.forEach((d) => addMk(d.place, PLACES[d.place].lngLat, PLACES[d.place].name, 'pulse', d.color, 'left', d.n));
      api.current = { map, bogota, kennedy, cluster, markers, kennedyCenter: [(cluster[0] + cluster[2]) / 2, (cluster[1] + cluster[3]) / 2] as LngLat, hl: { v: 0 }, three: { ready: false, on: false, k: { v: 0 } } };
      (window as unknown as { __map: maplibregl.Map }).__map = map; // utilidad de depuración
      map.on('load', () => {
        if (dead) return;
        setMapReady(true);
        load3D(map!, () => dead).then((ok) => { if (ok && api.current) { api.current.three.ready = true; if (api.current.three.on) to3D(true); } }).catch(() => undefined);
      });
    })();
    return () => { dead = true; map?.remove(); api.current = null; };
  }, []);

  // ---------- cámara y marcadores según la secuencia
  const camPad = () => {
    const { W } = stageSize();
    return mRef.current ? { top: 40, bottom: 60, left: 24, right: 24 } : { top: 40, bottom: 70, left: Math.round(W * 0.06), right: Math.round(W * 0.06) };
  };
  const clusterPad = () => {
    const { W } = stageSize();
    return mRef.current ? { top: 70, bottom: 70, left: 40, right: 40 } : { top: 70, bottom: 80, left: Math.round(W * 0.3), right: Math.round(W * 0.3) };
  };
  const setHl = (v: number, dur: number) => {
    const a = api.current; if (!a) return;
    gsap.to(a.hl, { v, duration: reduced() ? 0 : dur, ease: 'power2.out', onUpdate: () => {
      a.map.setPaintProperty('kennedy-fill', 'fill-opacity', a.hl.v * 0.3 * (1 - a.three.k.v));
      a.map.setPaintProperty('kennedy-line', 'line-opacity', a.hl.v * (1 - a.three.k.v));
    } });
  };
  const showMk = (ids: string[]) => {
    const a = api.current; if (!a) return;
    Object.entries(a.markers).forEach(([id, el]) => el.classList.toggle('on', ids.includes(id)));
  };
  const lastPaint = useRef(0);
  const apply3D = (force = false) => {
    const a = api.current; if (!a || !a.three.ready) return;
    const k = a.three.k.v, now = performance.now();
    if (!force && k > 0.002 && k < 0.998 && now - lastPaint.current < 70) return;
    lastPaint.current = now;
    const m3 = a.map, f = Math.min(1, k * 1.6);
    m3.setPaintProperty('bld3d', 'fill-extrusion-height', ['*', ['get', 'h'], Math.max(0.001, k)]);
    m3.setPaintProperty('bld3d', 'fill-extrusion-opacity', 0.96 * Math.min(1, k * 3));
    m3.setPaintProperty('arboles3d', 'fill-extrusion-height', ['*', ['get', 'h'], Math.max(0.001, k)]);
    m3.setPaintProperty('arboles3d', 'fill-extrusion-base', ['*', ['get', 'b'], Math.max(0.001, k)]);
    m3.setPaintProperty('arboles3d', 'fill-extrusion-opacity', 0.95 * Math.min(1, k * 3));
    m3.setPaintProperty('parques-fill', 'fill-opacity', 0.85 * f);
    m3.setPaintProperty('agua-fill', 'fill-opacity', 0.9 * f);
    m3.setPaintProperty('vias-line', 'line-opacity', 0.75 * f);
    m3.setPaintProperty('kennedy-fill', 'fill-opacity', a.hl.v * 0.3 * (1 - k));
    m3.setPaintProperty('kennedy-line', 'line-opacity', a.hl.v * (1 - k));
    m3.setPaintProperty('upl-line', 'line-opacity', 1 - 0.8 * k);
    m3.setPaintProperty('near-fill', 'fill-opacity', 1 - 0.8 * k);
  };
  const to3D = (on: boolean, instant = false) => {
    const a = api.current; if (!a) return;
    a.three.on = on;
    if (!a.three.ready) return;
    gsap.to(a.three.k, { v: on ? 1 : 0, duration: reduced() || instant ? 0 : 2.4, ease: 'power2.inOut', overwrite: true, onUpdate: () => apply3D(), onComplete: () => apply3D(true) });
  };
  const flyCenter = (z: number, ms: number) => {
    const a = api.current; if (!a) return;
    const c: [number, number] = [(a.cluster[0] + a.cluster[2]) / 2, (a.cluster[1] + a.cluster[3]) / 2];
    a.map.easeTo({ center: c, zoom: mRef.current ? z - 0.8 : z, pitch: mRef.current ? 46 : VIEW3D.pitch, bearing: VIEW3D.bearing, duration: reduced() ? 0 : ms, essential: true });
  };
  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, reduced() ? 0 : ms)); };
  const fly = (box: [number, number, number, number], pad: maplibregl.PaddingOptions, ms: number, maxZoom?: number, view?: { pitch: number; bearing: number }, boost = 0) => {
    const mp = api.current?.map; if (!mp) return;
    const dur = reduced() ? 0 : ms;
    const bounds: [[number, number], [number, number]] = [[box[0], box[1]], [box[2], box[3]]];
    if (!view) { mp.fitBounds(bounds, { padding: pad, duration: dur, essential: true, pitch: 0, bearing: 0 }); return; }
    const cam = mp.cameraForBounds(bounds, { padding: pad, ...(maxZoom ? { maxZoom } : {}) });
    if (!cam || !cam.center) { mp.fitBounds(bounds, { padding: pad, duration: dur, essential: true }); return; }
    const z = Math.min(maxZoom ?? 22, (cam.zoom ?? 12) + boost);
    mp.easeTo({ center: cam.center, zoom: z, pitch: mRef.current ? 48 : view.pitch, bearing: view.bearing, duration: dur, essential: true });
  };
  const dynMk = (b: number) => DYNS.filter((_, i) => b >= 4 + i).map((d) => d.place as string);

  useEffect(() => {
    const a = api.current; if (!a || !mapReady) return;
    const b = beat, prev = prevRef.current;
    clearTimers();
    const wrap = mapWrapRef.current!;
    const vis = b >= 2;
    gsap.to(wrap, { opacity: vis ? (b >= 9 ? 0.28 : b >= 8 ? 0.5 : b >= 4 ? 0.62 : 1) : 0, scale: vis ? 1 : 0.94, duration: reduced() ? 0 : 1.5, ease: 'power2.inOut', delay: vis && prev < 2 ? 0.5 : 0 });
    if (b < 2) {
      showMk([]); setHl(0, 0.4); to3D(false);
      later(() => { if (beatRef.current < 2) a.map.fitBounds([[a.bogota[0], a.bogota[1]], [a.bogota[2], a.bogota[3]]], { padding: camPad(), duration: 0 }); }, 1600);
    } else if (b === 2) {
      if (prev < 2) {
        a.map.fitBounds([[a.bogota[0], a.bogota[1]], [a.bogota[2], a.bogota[3]]], { padding: camPad(), duration: 0 });
        showMk(['bogota']); setHl(0, 0.1);
        later(() => { setHl(1, 1.4); showMk(['kennedy', 'tintal', 'porvenir', 'patiob']); }, 2000);
        later(() => flyCenter(13.1, 3200), 3600);
        later(() => to3D(true), 4800);
        later(() => showMk(['tintal', 'porvenir', 'patiob', 'corabastos', 'burro']), 6600);
      } else {
        setHl(1, 0.5); flyCenter(13.1, 2200); to3D(true);
        showMk(['tintal', 'porvenir', 'patiob', 'corabastos', 'burro']);
      }
    } else {
      setHl(1, 0.5);
      fly(a.cluster, clusterPad(), prev < 3 ? 2600 : 1600, 14.4, VIEW3D, 0.6); to3D(true);
      showMk(b >= 9 ? [] : dynMk(b).concat(b === 3 ? ['corabastos', 'burro'] : []));
    }
    // en la secuencia 4 solo se ve cada lugar cuando su dinámica aparece; Corabastos y El Burro ya están identificados desde el territorio
    if (b >= 3 && b < 9) showMk(Array.from(new Set(['corabastos', 'burro', ...dynMk(b)])));
    Object.values(a.markers).forEach((el) => el.classList.toggle('tag', b >= 4));
    return clearTimers;
  }, [beat, mapReady]);

  // ---------- transición de elementos y conexiones al cambiar de secuencia
  useEffect(() => {
    applyLayout(beat);
    CONNS.forEach((c) => {
      const s = cs.current[c.id]; if (!s) return;
      const on = c.show(beat), rm = reduced();
      gsap.to(s, { p: on ? 1 : 0, duration: rm ? 0 : on ? 1.1 : 0.5, delay: rm ? 0 : on ? c.delay(beat) : 0, ease: 'power2.inOut', overwrite: 'auto' });
      gsap.to(s, { op: c.op(beat), duration: rm ? 0 : 0.8, overwrite: false });
    });
    if (beat !== 8) setSelRel(null);
  }, [beat]);

  // ---------- trazado de las conexiones: se recalcula en cada fotograma
  useEffect(() => {
    const stage = stageRef.current!;
    const anchor = (id: string): Pt | null => {
      const root = els.current[id]; if (!root) return null;
      const a = (root.querySelector('[data-a]') as HTMLElement | null) ?? root;
      const r = a.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const place = (ll: LngLat): Pt | null => {
      const a = api.current, el = mapElRef.current; if (!a || !el) return null;
      const r = el.getBoundingClientRect(), k = r.width / (el.clientWidth || 1), p = a.map.project(ll);
      return { x: r.left + p.x * k, y: r.top + p.y * k };
    };
    const pt = (ref: string): Pt | null => {
      if (ref.startsWith('el:')) return anchor(ref.slice(3));
      if (ref.startsWith('place:')) return place(PLACES[ref.slice(6)].lngLat);
      if (ref === 'kennedy') return api.current ? place(api.current.kennedyCenter) : null;
      return null;
    };
    const tick = () => {
      const sr = stage.getBoundingClientRect();
      for (const c of CONNS) {
        const st = cs.current[c.id], p = paths.current[c.id];
        if (!st || !p || !p.base || !p.flow) continue;
        if (st.p < 0.002) { p.base.style.opacity = '0'; p.flow.style.opacity = '0'; continue; }
        const a = pt(c.a), b = pt(c.b);
        if (!a || !b) { p.base.style.opacity = '0'; p.flow.style.opacity = '0'; continue; }
        if (!Number.isFinite(a.x + a.y + b.x + b.y)) { p.base.style.opacity = '0'; p.flow.style.opacity = '0'; continue; }
        a.x -= sr.left; a.y -= sr.top; b.x -= sr.left; b.y -= sr.top;
        let d: string;
        if (c.kind === 'title') d = Sv(a, b);
        else if (c.kind === 'axes') d = Sh(a, b);
        else if (c.kind === 'hub') d = Sv(a, b);
        else if (c.kind === 'rel') d = Qb(a, b, c.bulge ?? 40);
        else d = Sh(a, b);
        p.base.setAttribute('d', d);
        p.base.style.strokeDashoffset = String(1 - st.p);
        p.base.style.opacity = String(st.op);
        const sel = selRef.current === c.id;
        p.base.style.strokeWidth = String(sel ? c.w * 2.2 : c.w);
        const flowing = (c.kind === 'loc' || c.kind === 'rel' || c.kind === 'kennedy') && st.p > 0.98;
        p.flow.setAttribute('d', d);
        p.flow.style.opacity = flowing ? String(Math.min(1, st.op + 0.1)) : '0';
        p.flow.style.strokeWidth = String(sel ? c.w * 2.4 : c.w * 1.9);
        const hit = p.base.parentElement?.querySelector('.hit');
        if (hit) hit.setAttribute('d', d);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  const rel = RELS.find((r) => r.id === selRel);
  const mapTop = m ? '34vh' : '29vh';

  return (
    <>
      <div ref={spacerRef} style={{ height: `${N * 100}vh` }} aria-hidden />
      <div id="stage" ref={stageRef}>
        <div ref={mapWrapRef} className="pointer-events-none absolute inset-x-0 bottom-0" style={{ top: mapTop, opacity: 0 }}>
          <div ref={mapElRef} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }} />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20" style={{ background: 'linear-gradient(#000, rgba(0,0,0,0))' }} />
        </div>

        <svg id="links" aria-hidden="false">
          {CONNS.map((c) => (
            <g key={c.id}>
              <path ref={(n) => { paths.current[c.id] = { ...(paths.current[c.id] ?? { flow: null }), base: n }; }} pathLength={1} stroke={c.color} strokeDasharray="1" strokeDashoffset="1" strokeWidth={c.w} opacity={0} />
              <path ref={(n) => { paths.current[c.id] = { ...(paths.current[c.id] ?? { base: null }), flow: n }; }} className="flow" stroke={c.color} strokeWidth={c.w * 1.9} opacity={0} />
              {c.kind === 'rel' && <path className="hit" onClick={() => beat === 8 && setSelRel(c.id)} onPointerEnter={() => beat === 8 && setSelRel((s) => s ?? c.id)} />}
            </g>
          ))}
        </svg>

        {/* 1. título */}
        <div ref={reg('title')} className="abs flex flex-col items-center" style={{ pointerEvents: 'none' }}>
          <button className="title-btn" style={{ pointerEvents: beat === 0 ? 'auto' : 'none' }} onClick={() => beat === 0 && go(1)} aria-label="Comenzar la presentación">
            <h1 className="title-main text-center md:whitespace-nowrap" style={{ fontSize: m ? 'clamp(28px,8.6vw,60px)' : 'clamp(38px,5.2vw,100px)' }}>
              Modelamiento<br className="md:hidden" /> dinámico
            </h1>
          </button>
          <span data-a className="block" style={{ width: 1, height: 1, marginTop: 6 }} />
        </div>
        <div ref={reg('hint')} className="abs kicker text-center" style={{ pointerEvents: 'none' }}>Haz clic en el título para comenzar</div>

        {/* 2. dos ejes */}
        <div ref={reg('ejes')} className="abs node core" style={{ width: m ? '66vw' : '330px', cursor: beat === 1 ? 'pointer' : 'default' }} onClick={() => beat === 1 && go(2)}>
          <div className="tile"><Network /></div>
          <div className="txt">
            <p className="id">CONCEPTO</p>
            <p className="lb" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dos ejes fundamentales</p>
          </div>
        </div>
        <div ref={reg('axR')} className="abs node solid big" style={{ ...cv(COLORS.coral, '#ffffff'), width: m ? '46vw' : 'min(27vw,390px)' }}>
          <div className="wm"><Lightbulb /></div>
          <div className="tile"><Lightbulb /></div>
          <div className="txt">
            <p className="id">EJE 01</p>
            <p className="lb" style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>Economía, conocimiento e innovación adaptativa</p>
          </div>
        </div>
        <div ref={reg('axL')} className="abs node solid big" style={{ ...cv(COLORS.teal, '#0a0a0a'), width: m ? '46vw' : 'min(27vw,390px)' }}>
          <div className="wm"><Waypoints /></div>
          <div className="tile"><Waypoints /></div>
          <div className="txt">
            <p className="id">EJE 02</p>
            <p className="lb" style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>Infraestructura, redes y metabolismo territorial</p>
          </div>
        </div>

        {/* 3-5. territorio, sistema vivo, relaciones */}
        <div ref={reg('hVivo')} className="abs chip" style={{ maxWidth: '90vw', whiteSpace: m ? 'normal' : 'nowrap', textAlign: 'center' }}>El territorio como sistema vivo</div>
        <div ref={reg('hRel')} className="abs chip" style={{ maxWidth: '90vw', whiteSpace: m ? 'normal' : 'nowrap', textAlign: 'center' }}>¿Cómo se relacionan estas dinámicas?</div>
        <div ref={reg('hRed')} className="abs chip" style={{ maxWidth: '90vw', whiteSpace: m ? 'normal' : 'nowrap', textAlign: 'center' }}>Red propia de análisis territorial</div>

        {DYNS.map((d) => {
          const Ic = DYN_ICONS[d.id];
          return (
            <div key={d.id} ref={reg(d.id)} className="abs node" style={{ ...cv(d.color), width: m ? '45vw' : 'min(20vw,290px)' }}>
              <div className="wm"><Ic /></div>
              <div className="tile"><Ic /></div>
              <div className="txt">
                <p className="id">DINÁMICA {d.n}</p>
                <p className="lb">{d.title}</p>
                </div>
            </div>
          );
        })}

        {/* 6. red propia */}
        <div ref={reg('hub')} className="abs chip" style={{ whiteSpace: 'nowrap' }}>Sistema territorial · Kennedy</div>
        {COMPONENTS.map((c, i) => {
          const Ic = COMP_ICONS[i];
          return (
            <div key={c.id} ref={reg(c.id)} className="abs node" style={{ ...cv([COLORS.mustard, COLORS.teal, COLORS.violet][i]), width: m ? '72vw' : 'min(24vw,330px)' }}>
              <div className="wm"><Ic /></div>
              <div className="tile"><Ic /></div>
              <div className="txt">
                <p className="id">COMPONENTE 0{i + 1}</p>
                <p className="lb">{c.title}</p>
              </div>
            </div>
          );
        })}

        <div ref={reg('caption')} className="abs text-center" style={{ width: m ? '86vw' : '52vw', pointerEvents: 'none', background: 'rgba(0,0,0,0.88)', border: '1px solid #383838', borderRadius: 14, padding: '12px 18px' }}>
          {beat >= 4 && beat <= 7 ? (
            <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(13px,1.1vw,17px)' }}>
              <span className="kicker block" style={{ color: DYNS[beat - 4].color }}>Dinámica {DYNS[beat - 4].n} · {DYNS[beat - 4].title}</span>
              {DYNS[beat - 4].note}
            </p>
          ) : rel ? (
            <p className="node-title" style={{ fontWeight: 400, fontSize: 'clamp(13px,1.1vw,17px)' }}>
              <span className="kicker block" style={{ color: COLORS.coral }}>{rel.label}</span>
              {rel.text} <span style={{ color: COLORS.mut }}>· {rel.source}</span>
            </p>
          ) : (
            <p className="kicker">Selecciona una conexión para ver su explicación</p>
          )}
        </div>
        <div ref={reg('cta')} className="abs text-center" style={{ pointerEvents: 'none' }}>
          <div className="flex items-center justify-center gap-3" style={{ flexWrap: 'wrap' }}>
            <a className="btn-ghost pri" href="./conclusion.html" style={{ pointerEvents: beat === 10 ? 'auto' : 'none' }}>Continuar a la conclusión →</a>
            <a className="btn-ghost" href="../pot-kennedy-mapa.html" style={{ pointerEvents: beat === 10 ? 'auto' : 'none' }}>Abrir la red interactiva</a>
          </div>
        </div>

        {/* navegación */}
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 pb-4 pt-3" style={{ pointerEvents: 'none' }}>
          <button className="btn-ghost" style={{ pointerEvents: 'auto', visibility: beat === 0 ? 'hidden' : 'visible' }} onClick={() => go(beat - 1)}>← Atrás</button>
          <div className="flex flex-col items-center gap-1" aria-label={'Secuencia ' + (beat + 1) + ' de ' + N}>
            <div className="flex items-end gap-[5px]">
              {BEATS.map((_, i) => (
                <span key={i} style={{ width: 1.5, height: i === beat ? 14 : 6, background: i <= beat ? COLORS.ink : COLORS.line, transition: 'height .4s' }} />
              ))}
            </div>
            <span className="kicker hidden md:block" style={{ fontSize: 9.5 }}>{STEP_LABELS[beat]}</span>
          </div>
          <button className="btn-ghost" style={{ pointerEvents: 'auto', visibility: beat === N - 1 ? 'hidden' : 'visible' }} onClick={() => go(beat + 1)}>Continuar →</button>
        </div>
        <p className="kicker pointer-events-none absolute right-5 top-4 hidden text-right md:block" style={{ fontSize: 9, opacity: beat >= 2 ? 0.7 : 0 }}>UPL · Decreto 555 de 2021</p>
      </div>
    </>
  );
}
