// Contenido de la página de conclusión. Solo texto del guion y datos del proyecto.
// Las coordenadas salen de datos/red-pot-kennedy-visor.xlsx (hoja NODOS) y del perímetro catastral real de Corabastos.
import { COLORS, type LngLat } from './content';

export { COLORS };
export type { LngLat };

export const CORAB: LngLat = [-74.15879, 4.63061]; // centro de la manzana catastral 004547001 (41,2 ha)

export const PLACES2: Record<string, { name: string; ll: LngLat; ref: string }> = {
  corab: { name: 'Corabastos', ll: CORAB, ref: 'Manzana catastral 004547001' },
  burro: { name: 'Humedal El Burro', ll: [-74.14979, 4.64062], ref: 'NOD-EEP01' },
  techo: { name: 'Humedal de Techo', ll: [-74.14243, 4.64681], ref: 'NOD-EEP03' },
  lavaca: { name: 'Humedal La Vaca', ll: [-74.16255, 4.62899], ref: 'NOD-EEP02' },
  act1: { name: 'Colectivos ambientales comunitarios', ll: [-74.15121, 4.64167], ref: 'NOD-ACT01' },
  act2: { name: 'JAC de Kennedy', ll: [-74.15405, 4.63014], ref: 'NOD-ACT02' },
  avcali: { name: 'Av. Ciudad de Cali', ll: [-74.15192, 4.63958], ref: 'NOD-MOV02' },
  suds: { name: 'Drenaje urbano sostenible (SuDS)', ll: [-74.14556, 4.63432], ref: 'NOD-EEP06' },
};

export const BEATS2 = [
  'concentracion', 'fragmentacion', 'corabastos', 'propagacion', 'territorio', 'pregunta',
  'integradas', 'capacidades', 'recuperar', 'interdependencias', 'red', 'final',
] as const;

export const LABELS2 = [
  'Concentración', 'Fragmentación', 'Corabastos', 'Propagación', 'Escala amplia', 'Pregunta',
  'Interdependencia', 'Capacidades', 'Recuperar', 'Humedales', 'Red propia', 'Conclusión',
];

export type Evidence = 'DOCUMENTADA' | 'INFERIDA' | 'HIPOTÉTICA';
export const EVID_COLOR: Record<Evidence, string> = { DOCUMENTADA: '#6fb1a7', INFERIDA: '#cdae67', HIPOTÉTICA: '#8e8e8e' };

export const PRESS = [
  { id: 'p1', title: 'MOVILIDAD', ev: 'DOCUMENTADA' as Evidence, color: '#9c8fc0', note: 'Tráfico pesado canalizado por la Av. Ciudad de Cali. Fuente: relación ECO01→MOV02 del proyecto.' },
  { id: 'p2', title: 'ESPACIO PÚBLICO', ev: 'HIPOTÉTICA' as Evidence, color: '#a3b86c', note: 'Relación por verificar: el proyecto no tiene aún evidencia suficiente.' },
  { id: 'p3', title: 'BARRIOS', ev: 'INFERIDA' as Evidence, color: '#cdae67', note: 'Economía popular y tejido residencial alrededor de la central.' },
  { id: 'p4', title: 'ECOSISTEMAS', ev: 'DOCUMENTADA' as Evidence, color: '#6fb1a7', note: 'Vertimientos hacia La Vaca y canales pluviales. Fuente: PMA La Vaca (SDA 2009) y Res. 3964/2019.' },
];

export const CAPS = [
  { id: 'q1', title: 'COMUNIDADES', color: '#cdae67', note: 'Colectivos ambientales comunitarios y juntas de acción comunal, ya registrados en la red del proyecto.' },
  { id: 'q2', title: 'INFRAESTRUCTURA', color: '#9c8fc0', note: 'Corredores y drenaje urbano sostenible, según la red del proyecto.' },
  { id: 'q3', title: 'ECOSISTEMAS', color: '#6fb1a7', note: 'Humedales de Kennedy con perímetro de protección vigente.' },
];

export const INTERD = [
  { id: 'i1', title: 'SISTEMAS HÍDRICOS', color: '#5ab0ff' },
  { id: 'i2', title: 'BARRIOS', color: '#cdae67' },
  { id: 'i3', title: 'MOVILIDAD', color: '#9c8fc0' },
  { id: 'i4', title: 'ACTIVIDADES ECONÓMICAS', color: '#d9755f' },
];

export const SYSTEMS = [
  { id: 's1', title: 'SOCIAL', color: '#d9755f', desc: 'Personas, comunidades, actividades económicas y organización territorial.', comps: ['Personas', 'Comunidades', 'Actividades económicas', 'Organización territorial'] },
  { id: 's2', title: 'TECNOLÓGICO', color: '#9c8fc0', desc: 'Infraestructura, transporte, logística y redes de servicios.', comps: ['Infraestructura', 'Transporte', 'Logística', 'Redes de servicios'] },
  { id: 's3', title: 'ECOLÓGICO', color: '#6fb1a7', desc: 'Humedales, agua, vegetación, biodiversidad y procesos ambientales.', comps: ['Humedales', 'Agua', 'Vegetación', 'Biodiversidad', 'Procesos ambientales'] },
];

export const LINE_COLORS = { vial: '#f0f0f0', hidrico: '#5ab0ff', ecologico: '#6fd07a', socio: '#cdae67' };
