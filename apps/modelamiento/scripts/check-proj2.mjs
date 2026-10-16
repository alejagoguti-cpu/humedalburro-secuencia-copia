import proj4 from 'proj4';
import { readFileSync } from 'node:fs';
const utm = '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs';
const inv = (x, y) => proj4(utm, 'WGS84', [x + 586865, y + 509725]);
const w = JSON.parse(readFileSync('../../assets/kennedy_water_bodies.json', 'utf8'));
w.forEach((f) => {
  const cx = f.pts.reduce((s, p) => s + p[0], 0) / f.pts.length, cy = f.pts.reduce((s, p) => s + p[1], 0) / f.pts.length;
  const [lon, lat] = inv(cx, cy);
  if (/humedal|burro|techo|vaca/i.test(f.nombre)) console.log(f.nombre, f.tipo, lat.toFixed(5), lon.toFixed(5));
});
console.log('Excel: El Burro 4.64062,-74.14979 | Techo 4.64681,-74.14243 | La Vaca 4.62899,-74.16255');
