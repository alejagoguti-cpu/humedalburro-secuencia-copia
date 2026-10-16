// Genera red-actores-plana.html: red 2D estilo diagrama (píldoras + conectores) donde cada clic revela las conexiones del actor.
// Uso: node tools/build-red-plana.js   (lee datos/red-actores-kennedy.xlsx, escribe red-actores-plana.html)
const ExcelJS = require('exceljs'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const txt = c => { let x = c && c.value; if (x && typeof x === 'object') x = 'result' in x ? x.result : (x.richText ? x.richText.map(t => t.text).join('') : x.text); return x == null ? '' : String(x).trim(); };
const rows = (ws, n) => { const o = []; for (let r = 2; r <= ws.rowCount; r++) { const a = []; for (let c = 1; c <= n; c++) a.push(txt(ws.getCell(r, c))); if (a[0]) o.push(a); } return o; };
const ICON = { 'Institucional': 'fa-landmark', 'Corporativo': 'fa-building', 'Comunitario': 'fa-people-group', 'Popular': 'fa-recycle', 'Educativo': 'fa-school', 'Científico': 'fa-microscope', 'Biótico': 'fa-feather', 'Físico': 'fa-road' };
(async () => {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(path.join(ROOT, 'datos', 'red-actores-kennedy.xlsx'));
  const capas = rows(wb.getWorksheet('CAPAS'), 6).map(r => ({ name: r[1], desc: r[2], color: r[3], icon: r[4], badge: r[5] }));
  const tipos = rows(wb.getWorksheet('INTERACCIONES'), 5).map(r => ({ name: r[1], def: r[2], color: r[3], icon: r[4] }));
  const nodes = rows(wb.getWorksheet('NODOS'), 14).map(r => {
    const key = Object.keys(ICON).find(k => r[3].includes(k));
    return { id: r[0], name: r[1], short: r[1].replace(/\s*\(.*?\)/g, '').replace(/^Flora Nativa Hub: /, 'Flora: '), cat: capas.findIndex(c => c.name === r[2]), kind: r[3], scale: r[4], loc: r[5], role: r[6], alert: r[7], actors: r[8], ctrl: r[9], geo: r[10], icon: ICON[key] || capas[capas.findIndex(c => c.name === r[2])].icon };
  });
  const ix = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = rows(wb.getWorksheet('ARISTAS'), 12).map(r => ({ id: r[0], s: ix.get(r[1]), t: ix.get(r[2]), type: tipos.findIndex(t => t.name === r[3]), detail: r[4], why: r[5], impact: r[6], w: +r[7] || 1, power: r[9], evidence: r[11] }));
  const data = { capas, tipos, nodes, edges };
  const html = fs.readFileSync(path.join(__dirname, 'plana-template.html'), 'utf8').replace('/*DATA*/', 'const DATA=' + JSON.stringify(data).replace(/</g, '\\u003c') + ';');
  fs.writeFileSync(path.join(ROOT, 'red-actores-plana.html'), html);
  console.log('OK', nodes.length, 'nodos', edges.length, 'aristas');
})().catch(e => { console.error(e); process.exit(1); });
