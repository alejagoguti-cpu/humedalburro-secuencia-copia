// Optimiza posiciones de la red plana (mínimos cruces) y las guarda en datos/layout-plana.json
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2], MIN = +(process.argv[3] || 5);
const html = fs.readFileSync(path.join(ROOT, 'red-actores-plana.html'), 'utf8');
const D = JSON.parse(html.match(/const DATA=(.*?);\n/)[1]);
const { nodes, edges } = D;
const wrap = s => { if (s.length <= 20) return [s]; const w = s.split(' '); let best = 0, bd = 1e9; for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' ').length, b = w.slice(i).join(' ').length, d = Math.abs(a - b); if (d < bd) { bd = d; best = i } } return best ? [w.slice(0, best).join(' '), w.slice(best).join(' ')] : [s] };
const W = nodes.map(n => Math.max(70, Math.max(...wrap(n.short).map(s => s.length)) * 6.4 + 10)), H = 104, UP = 34, DN = 70;
let seed = +(process.argv[4] || 1); const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const N = nodes.length, MX = 2300, MY = 1500, CX = 1000, CN = 1000, CO = 800;
const P = nodes.map(() => ({ x: 60 + rnd() * MX, y: 60 + rnd() * MY }));
const inc = nodes.map(() => []); edges.forEach((e, k) => { inc[e.s].push(k); inc[e.t].push(k) });
const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
const segX = (a, b, c, d) => ccw(a, b, c) * ccw(a, b, d) < 0 && ccw(c, d, a) * ccw(c, d, b) < 0;
const rectOf = (k, m) => ({ x0: P[k].x - W[k] / 2 - m, x1: P[k].x + W[k] / 2 + m, y0: P[k].y - UP - m, y1: P[k].y + DN + m });
function segRect(a, b, r) {
  if (Math.max(a.x, b.x) < r.x0 || Math.min(a.x, b.x) > r.x1 || Math.max(a.y, b.y) < r.y0 || Math.min(a.y, b.y) > r.y1) return false;
  let t0 = 0, t1 = 1; const dx = b.x - a.x, dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - r.x0], [dx, r.x1 - a.x], [-dy, a.y - r.y0], [dy, r.y1 - a.y]]) { if (p === 0) { if (q < 0) return false } else { const u = q / p; if (p < 0) { if (u > t1) return false; if (u > t0) t0 = u } else { if (u < t0) return false; if (u < t1) t1 = u } } }
  return t0 <= t1
}
function local(i) {
  let c = 0;
  for (const k of inc[i]) {
    const e = edges[k];
    for (let m = 0; m < edges.length; m++) { if (m === k) continue; const f = edges[m]; if (f.s === e.s || f.s === e.t || f.t === e.s || f.t === e.t) continue; if (segX(P[e.s], P[e.t], P[f.s], P[f.t])) c += CX }
    for (let n = 0; n < N; n++) { if (n === e.s || n === e.t) continue; if (segRect(P[e.s], P[e.t], rectOf(n, 14))) c += CN }
    c += Math.hypot(P[e.s].x - P[e.t].x, P[e.s].y - P[e.t].y) * .01
  }
  const r = rectOf(i, 14); for (let m = 0; m < edges.length; m++) { const f = edges[m]; if (f.s === i || f.t === i) continue; if (segRect(P[f.s], P[f.t], r)) c += CN }
  for (let n = 0; n < N; n++) { if (n === i) continue; const ox = (W[i] + W[n]) / 2 + 30 - Math.abs(P[i].x - P[n].x), oy = H + 16 - Math.abs(P[i].y - P[n].y); if (ox > 0 && oy > 0) c += CO }
  return c
}
const total = () => { let c = 0; for (let i = 0; i < N; i++) c += local(i); return c };
const crossings = () => { let cr = 0; for (let a = 0; a < edges.length; a++)for (let b = a + 1; b < edges.length; b++) { const e = edges[a], f = edges[b]; if (e.s === f.s || e.s === f.t || e.t === f.s || e.t === f.t) continue; if (segX(P[e.s], P[e.t], P[f.s], P[f.t])) cr++ } return cr };
function anneal(iters) {
  for (let it = 0; it < iters; it++) {
    const f = 1 - it / iters, i = (rnd() * N) | 0, ox = P[i].x, oy = P[i].y, before = local(i), step = 20 + 300 * f;
    if (rnd() < .04) { P[i].x = 60 + rnd() * MX; P[i].y = 60 + rnd() * MY } else { P[i].x = Math.min(MX, Math.max(60, ox + (rnd() - .5) * 2 * step)); P[i].y = Math.min(MY, Math.max(60, oy + (rnd() - .5) * 2 * step)) }
    const d = local(i) - before; if (d > 0 && rnd() > Math.exp(-d / Math.max(.3, f * 500))) { P[i].x = ox; P[i].y = oy }
  }
}
let best = null, bc = 1e18, bcr = 99, t0 = Date.now();
const LF = path.join(ROOT, 'datos', 'layout-plana.json'); if (fs.existsSync(LF)) { const L = JSON.parse(fs.readFileSync(LF, 'utf8')); L.forEach((q, i) => { P[i].x = q.x; P[i].y = q.y }); bc = total(); bcr = crossings(); best = L; console.log('base: cruces', bcr, 'costo', Math.round(bc)); }
while (Date.now() - t0 < MIN * 60000) {
  P.forEach(p => { p.x = 60 + rnd() * MX; p.y = 60 + rnd() * MY });
  anneal(300000);
  const c = total(), cr = crossings();
  if (cr < bcr || (cr === bcr && c < bc)) { bc = c; bcr = cr; best = P.map(p => ({ x: +p.x.toFixed(1), y: +p.y.toFixed(1) })); fs.writeFileSync(path.join(ROOT, 'datos', 'layout-plana.json'), JSON.stringify(best)); console.log('mejor: cruces', cr, 'costo', Math.round(c), 't=', Math.round((Date.now() - t0) / 1000) + 's') }
  if (cr === 0 && c < 6000) break;
}
console.log('FIN cruces', bcr);
