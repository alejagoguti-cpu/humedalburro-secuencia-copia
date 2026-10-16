// Contenido de la presentación. Solo texto y datos del proyecto (guion del POT / Excel de la red POT-Kennedy).
// Ninguna relación ni cifra se inventa: cada relación cita su sustento.

export const COLORS = {
  ink: '#e6e6e6',
  mut: '#8e8e8e',
  line: '#383838',
  bg: '#000000',
  coral: '#d9755f',
  violet: '#9c8fc0',
  mustard: '#cdae67',
  teal: '#6fb1a7',
};

export const BEATS = [
  'titulo',
  'ejes',
  'territorio',
  'vivo',
  'dyn1',
  'dyn2',
  'dyn3',
  'dyn4',
  'relaciones',
  'red',
  'final',
] as const;

export const STEP_LABELS = [
  'Concepto',
  'Dos ejes',
  'Territorio',
  'Sistema vivo',
  'Abastecimiento',
  'Transporte',
  'Economía',
  'Naturales',
  'Relaciones',
  'Red propia',
  'Red completa',
];

export type LngLat = [number, number];

// Coordenadas validadas del Excel del proyecto (datos/red-pot-kennedy-visor.xlsx, hoja NODOS).
export const PLACES: Record<string, { name: string; lngLat: LngLat; ref: string }> = {
  corabastos: { name: 'Corabastos', lngLat: [-74.1583, 4.62647], ref: 'NOD-ECO01' },
  burro: { name: 'Humedal El Burro', lngLat: [-74.14979, 4.64062], ref: 'NOD-EEP01' },
  cali: { name: 'Av. Ciudad de Cali', lngLat: [-74.15192, 4.63958], ref: 'NOD-MOV02' },
  patio: { name: 'Economía popular · Patio Bonito', lngLat: [-74.15123, 4.62489], ref: 'NOD-ECO03' },
};

export interface Dyn {
  id: 'dyn1' | 'dyn2' | 'dyn3' | 'dyn4';
  n: string;
  title: string;
  note: string;
  place: keyof typeof PLACES;
  color: string;
  side: 'left' | 'right';
}

export const DYNS: Dyn[] = [
  {
    id: 'dyn1',
    n: '01',
    title: 'Abastecimiento diario de alimentos',
    note: 'Corabastos concentra la venta mayorista de alimentos de la ciudad.',
    place: 'corabastos',
    color: COLORS.coral,
    side: 'left',
  },
  {
    id: 'dyn2',
    n: '02',
    title: 'Flujos de transporte y logística',
    note: 'Tractomulas por la Av. Ciudad de Cali y la Carrera 80.',
    place: 'cali',
    color: COLORS.violet,
    side: 'right',
  },
  {
    id: 'dyn3',
    n: '03',
    title: 'Actividades económicas y trabajo comunitario',
    note: 'Economía popular que rodea a Corabastos y sostiene a Kennedy.',
    place: 'patio',
    color: COLORS.mustard,
    side: 'left',
  },
  {
    id: 'dyn4',
    n: '04',
    title: 'Sistemas naturales y ambientales',
    note: 'Humedales El Burro, Techo y La Vaca, y su conectividad ecológica.',
    place: 'burro',
    color: COLORS.teal,
    side: 'right',
  },
];

export interface Rel {
  id: string;
  a: Dyn['id'];
  b: Dyn['id'];
  label: string;
  text: string;
  source: string;
}

// Relaciones tomadas del análisis del POT (Decreto 555 de 2021) que forma parte del proyecto.
export const RELS: Rel[] = [
  {
    id: 'r1',
    a: 'dyn1',
    b: 'dyn2',
    label: 'Abastecimiento · Transporte',
    text: 'Concentrar la venta mayorista en un solo punto colapsa la red vial con tráfico pesado.',
    source: 'POT, arts. 152 y 308',
  },
  {
    id: 'r2',
    a: 'dyn1',
    b: 'dyn4',
    label: 'Abastecimiento · Sistemas naturales',
    text: 'La concentración mayorista degrada los humedales El Burro, Techo y La Vaca.',
    source: 'POT, arts. 47 y 55',
  },
  {
    id: 'r3',
    a: 'dyn2',
    b: 'dyn4',
    label: 'Transporte · Sistemas naturales',
    text: 'El tráfico de tractomulas por la Av. Ciudad de Cali y la Carrera 80 bordea los mismos ecosistemas que el POT promete cuidar.',
    source: 'POT, arts. 47, 55, 152 y 308',
  },
  {
    id: 'r4',
    a: 'dyn3',
    b: 'dyn1',
    label: 'Economía popular · Abastecimiento',
    text: 'Corabastos funciona como el corazón de un tejido vivo de economía popular que sostiene a Kennedy y a la ciudad.',
    source: 'Análisis del proyecto sobre el POT',
  },
];

export const COMPONENTS = [
  { id: 'comp1', title: 'Indicadores territoriales' },
  { id: 'comp2', title: 'Imágenes satelitales' },
  { id: 'comp3', title: 'Conectografías' },
];
