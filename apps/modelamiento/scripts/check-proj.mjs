import proj4 from 'proj4';
const utm = '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs';
const inv = (x, y) => proj4(utm, 'WGS84', [x + 586865, y + 509725]);
// Techo (según modulo-08-3d.js) y Excel del proyecto: 4.64681, -74.14243
console.log('Techo local->', inv(8180.94, 2102.08));
// ida y vuelta con Corabastos del Excel
const [E, N] = proj4('WGS84', utm, [-74.1583, 4.62647]);
console.log('Corabastos local', E - 586865, N - 509725);
