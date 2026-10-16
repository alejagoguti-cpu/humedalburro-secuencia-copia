import * as shp from 'shapefile';
import { readFileSync } from 'node:fs';
import proj4 from 'proj4';
const Q = 'C:/Users/aleja/Music/SEMESTRE 8/qgis/UPZ Corabastos (80)/';
for (const n of ['CORABASTOSS', 'UPZ', 'Corabasto_poligonooooo', 'Corabasto_poligono']) {
  const fc = await shp.read(Q + n + '.shp', Q + n + '.dbf', { encoding: 'utf-8' });
  const g = fc.features[0].geometry;
  let b = [1e9, 1e9, -1e9, -1e9];
  const w = (c) => { if (typeof c[0] === 'number') { b = [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[0]), Math.max(b[3], c[1])]; } else c.forEach(w); };
  fc.features.forEach((f) => w(f.geometry.coordinates));
  console.log(n, fc.features.length, g.type, JSON.stringify(fc.features[0].properties).slice(0, 140), b.map((v) => v.toFixed(4)).join(','));
}
const net = JSON.parse(readFileSync('../../assets/kennedy_net.json', 'utf8'));
const kinds = {}; net.edges.forEach((e) => { kinds[e[0]] = (kinds[e[0]] || 0) + 1; });
console.log('vías por tipo', kinds, net.edges[0].length, JSON.stringify(net.edges.find((e) => e[0] !== 'local')).slice(0, 120));
const ag = JSON.parse(readFileSync('public/data/agua.json', 'utf8'));
const t = {}; ag.features.forEach((f) => { t[f.properties.t] = (t[f.properties.t] || []).concat(f.properties.n); });
console.log(Object.entries(t).map(([k, v]) => k + ': ' + v.slice(0, 6).join(' | ')).join('\n'));
const bar = JSON.parse(readFileSync('C:/Users/aleja/Music/SEMESTRE 8/barrios_bogota.geojson', 'utf8'));
const near = bar.features.filter((f) => { const [x, y] = f.geometry.coordinates; return Math.hypot((x + 74.1583) * 111320 * Math.cos(4.63 * Math.PI / 180), (y - 4.62647) * 110574) < 3000; });
console.log('barrios a <3 km de Corabastos:', near.length, near.slice(0, 5).map((f) => f.properties.nombre).join(', '));
