// Red POT-Kennedy real (datos/red-pot-kennedy-visor.xlsx): nodos con lon/lat y relaciones, para la animación final.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire('file:///C:/Users/aleja/Music/SEMESTRE%208/Programaci%C3%B3n/humedalburro-secuencia-copia/');
const ExcelJS = require('exceljs');
const txt = (c) => { let x = c && c.value; if (x && typeof x === 'object') x = 'result' in x ? x.result : (x.richText ? x.richText.map((t) => t.text).join('') : x.text); return x == null ? '' : String(x); };
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('../../datos/red-pot-kennedy-visor.xlsx');
const rows = (ws, n) => { const o = []; for (let r = 2; r <= ws.rowCount; r++) { const a = []; for (let c = 1; c <= n; c++) a.push(txt(ws.getCell(r, c))); if (a[0]) o.push(a); } return o; };
const capas = rows(wb.getWorksheet('CAPAS'), 6);
const tipos = rows(wb.getWorksheet('INTERACCIONES'), 5);
const nod = rows(wb.getWorksheet('NODOS'), 14);
const aris = rows(wb.getWorksheet('ARISTAS'), 12);
const idx = new Map(nod.map((r, i) => [r[0], i]));
const nodes = nod.map((r) => ({ id: r[0], n: r[1], c: capas.findIndex((c) => c[1] === r[2]), ll: [+(+r[13]).toFixed(5), +(+r[12]).toFixed(5)] }));
const all = aris.map((r) => ({ s: idx.get(r[1]), t: idx.get(r[2]), ty: tipos.findIndex((t) => t[1] === r[3]), w: +r[7] || 1 })).filter((e) => e.s != null && e.t != null && e.s !== e.t);
const hist = {}; all.forEach((e) => { hist[e.w] = (hist[e.w] || 0) + 1; });
console.log('nodos', nodes.length, 'aristas', all.length, 'peso', hist);
// se conservan las relaciones de mayor peso (≥2) y, además, la de mayor peso de cada nodo para que ninguno quede aislado
const keep = new Set(); all.forEach((e, i) => { if (e.w >= 2) keep.add(i); });
const best = new Map(); all.forEach((e, i) => { [e.s, e.t].forEach((n) => { if (!best.has(n) || all[best.get(n)].w < e.w) best.set(n, i); }); });
best.forEach((i) => keep.add(i));
const edges = [...keep].map((i) => all[i]).map((e) => [e.s, e.t, e.ty, e.w]);
console.log('aristas conservadas', edges.length);
writeFileSync('public/data/red.json', JSON.stringify({ nodes: nodes.map((n) => [n.ll[0], n.ll[1], n.c, n.n]), edges, capas: capas.map((c) => c[3]), tipos: tipos.map((t) => t[3]), total: { nodos: nodes.length, relaciones: all.length, capas: capas.length } }));
