// Calcula el diseño "ancla" de la red plana: posiciones sin cruces de flechas ni flechas sobre actores,
// usando los radios reales (texto completo + grado). Resultado: datos/layout-plana.json
// Uso: node tools/optimizar-layout-plana.js <minutos> [semilla]
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const MIN = +(process.argv[2] || 5);
let seed = +(process.argv[3] || 1);
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const html = fs.readFileSync(path.join(ROOT, 'red-actores-plana.html'), 'utf8');
const D = JSON.parse(html.match(/const DATA=(.*?);\n/)[1]);
const { nodes, edges } = D, N = nodes.length;
// ---- mismas reglas de texto que la página (sin expresiones regulares)
function labelOf(n) {
  let out = '', depth = 0, buf = '', longP = '';
  for (const ch of n.name) {
    if (ch === '(') { depth++; buf = ''; continue }
    if (ch === ')' && depth > 0) { depth--; if (depth === 0) { if (buf.length <= 7 && buf.indexOf('/') < 0) out += ' (' + buf + ')'; else if (!longP) longP = buf } continue }
    if (depth > 0) buf += ch; else out += ch
  }
  out = out.split(' ').filter(Boolean).join(' ');
  if (out.startsWith('Flora Nativa Hub: ')) out = 'Flora: ' + out.slice(18);
  if (out.length <= 7 && longP) out = out + ' · ' + longP;
  return out;
}
function wrapLines(s) {
  const w = s.split(' '); const target = s.length <= 14 ? 1 : Math.ceil(s.length / 13); let W = Math.max(...w.map(x => x.length));
  for (; ; W++) { const L = []; let cur = ''; w.forEach(x => { if (!cur) cur = x; else if ((cur + ' ' + x).length <= W) cur += ' ' + x; else { L.push(cur); cur = x } }); L.push(cur); if (L.length <= target || W > 60) return L }
}
const deg = new Array(N).fill(0); edges.forEach(e => { deg[e.s]++; deg[e.t]++ });
const R = nodes.map((n, i) => { const lines = wrapLines(labelOf(n)); const mc = Math.max(...lines.map(l => l.length)); const wE = mc * .56, hE = lines.length * 1.17 + 1.1; const rEm = Math.sqrt((wE / 2) ** 2 + (hE / 2) ** 2); return Math.max(Math.min(80, 36 + 7 * Math.sqrt(deg[i])), 11 * rEm + 7) });
const MX = 2600, MY = 1500;
const P = nodes.map(() => ({ x: 100 + rnd() * MX, y: 100 + rnd() * MY }));
const inc = nodes.map(() => []); edges.forEach((e, k) => { inc[e.s].push(k); inc[e.t].push(k) });
const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
const segX = (a, b, c, d) => ccw(a, b, c) * ccw(a, b, d) < 0 && ccw(c, d, a) * ccw(c, d, b) < 0;
function distSeg(p, a, b) { const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy || 1; let u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l; u = Math.max(0, Math.min(1, u)); return Math.hypot(p.x - a.x - u * dx, p.y - a.y - u * dy) }
function local(i) {
  let c = 0;
  for (const k of inc[i]) {
    const e = edges[k];
    for (let m = 0; m < edges.length; m++) { if (m === k) continue; const f = edges[m]; if (f.s === e.s || f.s === e.t || f.t === e.s || f.t === e.t) continue; if (segX(P[e.s], P[e.t], P[f.s], P[f.t])) c += 1000 }
    for (let n = 0; n < N; n++) { if (n === e.s || n === e.t) continue; if (distSeg(P[n], P[e.s], P[e.t]) < R[n] + 14) c += 1000 }
    c += Math.hypot(P[e.s].x - P[e.t].x, P[e.s].y - P[e.t].y) * .02;
  }
  for (let m = 0; m < edges.length; m++) { const f = edges[m]; if (f.s === i || f.t === i) continue; if (distSeg(P[i], P[f.s], P[f.t]) < R[i] + 14) c += 1000 }
  for (let n = 0; n < N; n++) { if (n === i) continue; if (Math.hypot(P[i].x - P[n].x, P[i].y - P[n].y) < R[i] + R[n] + 24) c += 800 }
  return c;
}
const total = () => { let c = 0; for (let i = 0; i < N; i++) c += local(i); return c };
function crossings() { let cr = 0; for (let a = 0; a < edges.length; a++)for (let b = a + 1; b < edges.length; b++) { const e = edges[a], f = edges[b]; if (e.s === f.s || e.s === f.t || e.t === f.s || e.t === f.t) continue; if (segX(P[e.s], P[e.t], P[f.s], P[f.t])) cr++ } return cr }
function hits() { let h = 0; edges.forEach(e => { for (let n = 0; n < N; n++) { if (n !== e.s && n !== e.t && distSeg(P[n], P[e.s], P[e.t]) < R[n] + 14) h++ } }); return h }
function anneal(iters) {
  for (let it = 0; it < iters; it++) {
    const f = 1 - it / iters, i = (rnd() * N) | 0, ox = P[i].x, oy = P[i].y, before = local(i), step = 20 + 320 * f;
    if (rnd() < .03) { P[i].x = 60 + rnd() * MX; P[i].y = 60 + rnd() * MY } else { P[i].x = Math.min(MX, Math.max(60, ox + (rnd() - .5) * 2 * step)); P[i].y = Math.min(MY, Math.max(60, oy + (rnd() - .5) * 2 * step)) }
    const d = local(i) - before; if (d > 0 && rnd() > Math.exp(-d / Math.max(.3, f * f * 600))) { P[i].x = ox; P[i].y = oy }
  }
}
const OUT = path.join(ROOT, 'datos', 'layout-plana.json');
let best = null, bc = 1e18, bcr = 99, bh = 99, t0 = Date.now();
while (Date.now() - t0 < MIN * 60000) {
  P.forEach(p => { p.x = 100 + rnd() * MX; p.y = 100 + rnd() * MY });
  anneal(350000);
  const c = total(), cr = crossings(), h = hits();
  if (cr + h < bcr + bh || (cr + h === bcr + bh && c < bc)) {
    bc = c; bcr = cr; bh = h; best = P.map(p => ({ x: +p.x.toFixed(1), y: +p.y.toFixed(1) }));
    fs.writeFileSync(OUT, JSON.stringify(best));
    console.log('mejor: cruces', cr, 'flechas sobre nodos', h, 'costo', Math.round(c), 't=' + Math.round((Date.now() - t0) / 1000) + 's');
  }
  if (cr === 0 && h === 0 && c < 5000) break;
}
console.log('FIN cruces', bcr, 'sobre nodos', bh);
