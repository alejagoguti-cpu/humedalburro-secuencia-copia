import * as shp from 'shapefile';
const Q = 'C:/Users/aleja/Music/SEMESTRE 8/qgis/';
const upl = await shp.read(Q + 'unidadplaneamientolocal/UnidadPlaneamientoLocal.shp', Q + 'unidadplaneamientolocal/UnidadPlaneamientoLocal.dbf', {encoding: 'utf-8'});
console.log('UPL', upl.features.length, Object.keys(upl.features[0].properties));
upl.features.forEach(f => console.log(JSON.stringify(f.properties).slice(0, 160), f.geometry.type));
const cor = await shp.read(Q + 'UPZ Corabastos (80)/Corabasto_poligono.shp', Q + 'UPZ Corabastos (80)/Corabasto_poligono.dbf', {encoding: 'utf-8'});
console.log('COR', cor.features.length, JSON.stringify(cor.features[0].properties).slice(0, 300), cor.features[0].geometry.type, JSON.stringify(cor.features[0].geometry.coordinates).slice(0, 120));
