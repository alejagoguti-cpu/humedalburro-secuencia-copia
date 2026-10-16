// Datos reales para la página de conclusión: perímetro de Corabastos (manzana catastral 004547001, 41,2 ha,
// la mayor dentro de la UPZ Corabastos) y barrios cercanos (centroides del archivo barrios_bogota.geojson).
import proj4 from 'proj4';
import { readFileSync, writeFileSync } from 'node:fs';
const utm = '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs';
const inv = (x, y) => proj4(utm, 'WGS84', [x + 586865, y + 509725]);
const r5 = (v) => Math.round(v * 1e5) / 1e5;
const M = JSON.parse(readFileSync('../../assets/kennedy_manzanas.json', 'utf8'));
const m = M.find((x) => x.codigo === '004547001');
const ring = m.pts.map(([x, y]) => inv(x, y).map(r5));
if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) ring.push(ring[0]);
const c = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
writeFileSync('public/data/corabastos.json', JSON.stringify({
  type: 'Feature', properties: { codigo: '004547001', ha: 41.2, centro: c.map(r5) }, geometry: { type: 'Polygon', coordinates: [ring] },
}));
console.log('Corabastos: vértices', ring.length, 'centro', c.map(r5));
const B = JSON.parse(readFileSync('C:/Users/aleja/Music/SEMESTRE 8/barrios_bogota.geojson', 'utf8'));
const near = B.features.filter((f) => { const [x, y] = f.geometry.coordinates; return Math.hypot((x - c[0]) * 111320 * Math.cos((4.63 * Math.PI) / 180), (y - c[1]) * 110574) < 3500; });
writeFileSync('public/data/barrios.json', JSON.stringify({
  type: 'FeatureCollection',
  features: near.map((f) => ({ type: 'Feature', properties: { n: f.properties.nombre }, geometry: { type: 'Point', coordinates: f.geometry.coordinates.map(r5) } })),
}));
console.log('barrios', near.length);
