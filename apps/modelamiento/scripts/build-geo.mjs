// Convierte las UPL del Decreto 555 de 2021 (shapefile del proyecto, MAGNA en grados) a GeoJSON liviano.
import * as shp from 'shapefile';
import { writeFileSync } from 'node:fs';
const Q = 'C:/Users/aleja/Music/SEMESTRE 8/qgis/unidadplaneamientolocal/UnidadPlaneamientoLocal';
const fc = await shp.read(Q + '.shp', Q + '.dbf', { encoding: 'utf-8' });
const r = (n) => Math.round(n * 1e5) / 1e5;
const rr = (c) => (typeof c[0] === 'number' ? [r(c[0]), r(c[1])] : c.map(rr));
const out = {
  type: 'FeatureCollection',
  features: fc.features.map((f) => ({
    type: 'Feature',
    properties: { CODIGO_UPL: f.properties.CODIGO_UPL, NOMBRE: f.properties.NOMBRE },
    geometry: { type: f.geometry.type, coordinates: rr(f.geometry.coordinates) },
  })),
};
writeFileSync('public/data/upl-bogota.geojson', JSON.stringify(out));
console.log('OK', out.features.length, 'UPL');
