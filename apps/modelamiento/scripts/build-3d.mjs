// Convierte los datos 3D reales de Kennedy (assets/kennedy_*.json, coordenadas locales UTM18N - origen)
// a GeoJSON en lon/lat para MapLibre. Solo se conserva el sector que se ve en la presentación.
import proj4 from 'proj4';
import { readFileSync, writeFileSync } from 'node:fs';

const utm = '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs';
const inv = (x, y) => proj4(utm, 'WGS84', [x + 586865, y + 509725]);
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const A = '../../assets/';
const read = (f) => JSON.parse(readFileSync(A + f, 'utf8'));

// área de interés: UPL Kennedy, Tintal, Porvenir y Patio Bonito + lugares del proyecto
const upl = JSON.parse(readFileSync('public/data/upl-bogota.geojson', 'utf8'));
const pts = [[-74.1583, 4.62647], [-74.14979, 4.64062], [-74.15192, 4.63958], [-74.15123, 4.62489]];
let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9];
const walk = (c) => { if (typeof c[0] === 'number') { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } else c.forEach(walk); };
upl.features.filter((f) => ['UPL18', 'UPL13', 'UPL14', 'UPL15'].includes(f.properties.CODIGO_UPL)).forEach((f) => walk(f.geometry.coordinates));
pts.forEach((p) => walk(p));
const pad = 0.004;
const bb = [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
const inside = (lon, lat) => lon >= bb[0] && lon <= bb[2] && lat >= bb[1] && lat <= bb[3];
console.log('bbox', bb.map((v) => v.toFixed(4)).join(', '));

const area = (p) => { let s = 0; for (let i = 0; i < p.length - 1; i++) s += p[i][0] * p[i + 1][1] - p[i + 1][0] * p[i][1]; return Math.abs(s) / 2; };
const ring = (p) => { const o = p.map(([x, y]) => inv(x, y).map(r5)); const a = o[0], b = o[o.length - 1]; if (a[0] !== b[0] || a[1] !== b[1]) o.push(a); return o; };
const dedupe = (o) => o.filter((p, i) => i === 0 || p[0] !== o[i - 1][0] || p[1] !== o[i - 1][1]);

// edificios: contorno simplificado (1 m) y codificado como enteros (1e-5 grados) con deltas
function dp(p, tol) {
  if (p.length < 5) return p;
  const keep = new Array(p.length).fill(false); keep[0] = keep[p.length - 1] = true;
  const st = [[0, p.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1;
    const dx = p[b][0] - p[a][0], dy = p[b][1] - p[a][1], L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((p[i][0] - p[a][0]) * dy - (p[i][1] - p[a][1]) * dx) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = true; st.push([a, mi], [mi, b]); }
  }
  return p.filter((_, i) => keep[i]);
}
const B = read('kennedy_buildings.json');
const out = [];
for (const b of B) {
  if (!b.pts || b.pts.length < 4 || area(b.pts) < 30) continue;
  const c = b.pts[0]; const [lon, lat] = inv(c[0], c[1]);
  if (!inside(lon, lat)) continue;
  const sp = dp(b.pts.slice(0, -1), 1.0); if (sp.length < 3) continue;
  const ints = sp.map(([x, y]) => inv(x, y).map((v) => Math.round(v * 1e5)));
  const rec = [Math.max(3, Math.round(b.h * 2) / 2), ints[0][0], ints[0][1]];
  for (let i = 1; i < ints.length; i++) rec.push(ints[i][0] - ints[i - 1][0], ints[i][1] - ints[i - 1][1]);
  out.push(rec);
}
writeFileSync('public/data/edificios.json', JSON.stringify(out));
console.log('edificios', B.length, '->', out.length);

const poly = (list, props) => list.flatMap((f) => { if (!f.pts || f.pts.length < 3) return []; const [lon, lat] = inv(f.pts[0][0], f.pts[0][1]); if (!inside(lon, lat)) return []; return [{ type: 'Feature', properties: props(f), geometry: { type: 'Polygon', coordinates: [dedupe(ring(f.pts))] } }]; });
const parques = poly(read('kennedy_parques.json'), (f) => ({ n: f.nombre }));
const agua = poly(read('kennedy_water_bodies.json'), (f) => ({ n: f.nombre, t: f.tipo }));
writeFileSync('public/data/parques.json', JSON.stringify({ type: 'FeatureCollection', features: parques }));
writeFileSync('public/data/agua.json', JSON.stringify({ type: 'FeatureCollection', features: agua }));
console.log('parques', parques.length, 'agua', agua.length);

const net = read('kennedy_net.json');
const lines = [];
for (const [kind, p] of net.edges) {
  if (!p || p.length < 2) continue;
  const o = p.map(([x, y]) => inv(x, y).map(r5));
  if (!inside(o[0][0], o[0][1])) continue;
  lines.push({ type: 'Feature', properties: { k: kind }, geometry: { type: 'LineString', coordinates: o } });
}
writeFileSync('public/data/vias.json', JSON.stringify({ type: 'FeatureCollection', features: lines }));
console.log('vías', lines.length);

// árboles reales (x, y locales, altura en m): se guardan como enteros con deltas, ordenados por longitud
const T = read('kennedy_trees_real.json');
const tr = [];
for (const t of T) {
  const [lon, lat] = inv(t[0], t[1]);
  if (!inside(lon, lat)) continue;
  tr.push([Math.round(lon * 1e5), Math.round(lat * 1e5), Math.max(4, Math.min(300, Math.round(t[2] * 10)))]);
}
tr.sort((a, b) => a[0] - b[0]);
const flat = [];
let pl = 0, pa = 0;
for (const [lo, la, h] of tr) { flat.push(h, lo - pl, la - pa); pl = lo; pa = la; }
writeFileSync('public/data/arboles.json', JSON.stringify(flat));
console.log('árboles', T.length, '->', tr.length);
