// Genera datos/red-pot-critica.xlsx (capas, interacciones, nodos, aristas) a partir del texto
// "El POT (Decreto 555/2021) y Kennedy: Corabastos, humedales, indicadores POT/ODS".
// Uso: node tools/make-red-pot-critica.js
const ExcelJS = require('exceljs'); const path = require('path');
const ROOT = path.join(__dirname, '..');

const capas = [
  ['C1', 'Norma y estrategias del POT', 'Lo que el Decreto 555 de 2021 propone para ordenar Kennedy', '#5b9dff', 'fa-scale-balanced', 'POT'],
  ['C2', 'Territorio de Kennedy', 'Elementos físicos y ecosistemas sobre los que actúa la norma', '#34d399', 'fa-map-location-dot', 'TER'],
  ['C3', 'Tejido vivo', 'Economía popular y seguridad alimentaria que sostienen la localidad', '#fb923c', 'fa-people-roof', 'VIV'],
  ['C4', 'Fallas de fondo del POT', 'Lo que la norma asume o ignora y por qué choca con la realidad', '#f43f5e', 'fa-triangle-exclamation', 'FAL'],
  ['C5', 'Indicadores POT y ODS', 'Cómo el POT mide su propio cumplimiento (no son indicadores propios)', '#fbbf24', 'fa-chart-line', 'IND'],
];
const tipos = [
  ['T1', 'Ordena / propone', 'La norma ordena, contiene o propone una estrategia', '#5b9dff', 'fa-sitemap'],
  ['T2', 'Presiona / degrada', 'Una dinámica carga, congestiona o deteriora a otro elemento', '#f43f5e', 'fa-down-long'],
  ['T3', 'Protege / sostiene', 'Protege un ecosistema o sostiene un tejido o sistema', '#34d399', 'fa-shield-heart'],
  ['T4', 'Mide', 'Un indicador mide el avance de una estrategia o meta', '#fbbf24', 'fa-ruler'],
  ['T5', 'Ignora / contradice', 'La norma o el indicador no ve, o contradice, a otro elemento', '#f472b6', 'fa-eye-slash'],
];
// [id, nombre, capa(1-5), categoria, escala, ubicacion, descripcion, falla/tension, articulos, hipotesis, fuente, icono]
const N = [
  ['P01', 'Unidades de Planeamiento Local (UPL)', 1, 'Ordenamiento', 'Local', 'Kennedy', 'El POT subdivide la localidad en UPL para ordenar por proximidad.', 'Piezas que ordenan por separado un territorio que funciona en red.', 'Arts. 9 y 10', 'La UPL organiza lo local pero no la escala regional.', 'Decreto 555 de 2021', 'fa-border-all'],
  ['P02', 'Proximidad y ciudad de 15 minutos', 1, 'Principio rector', 'Local', 'Kennedy', 'Promesa de resolver servicios y empleo a distancia caminable.', 'No alcanza para problemas de escala regional como el abastecimiento.', 'Arts. 9 y 10', '', 'Decreto 555 de 2021', 'fa-person-walking'],
  ['P03', 'Actuaciones Estratégicas (Eje Tintal, Porvenir, Chucua La Vaca)', 1, 'Instrumento', 'Zonal', 'Kennedy', 'Intervenciones físicas priorizadas para transformar sectores.', 'Intervenciones locales y desarticuladas.', 'Art. 81', '', 'Decreto 555 de 2021', 'fa-bullseye'],
  ['P04', 'Sistema de Abastecimiento', 1, 'Sistema', 'Regional', 'Bogotá-región', 'Reconoce la fragilidad de concentrar la venta mayorista en un punto.', '', 'Art. 570', '', 'Decreto 555 de 2021', 'fa-truck-ramp-box'],
  ['P05', 'Descentralizar Corabastos: red regional equilibrada', 1, 'Estrategia', 'Regional', 'Bogotá-región', 'Pasar de un gran nodo mayorista a una red regional de abastecimiento.', 'Trata a Corabastos como un predio que se mueve en el mapa.', 'Art. 570', 'Mover el predio no mueve el tejido que lo rodea.', 'Decreto 555 de 2021', 'fa-network-wired'],
  ['P06', 'Manzanas del Cuidado', 1, 'Estrategia', 'Barrial', 'Kennedy', 'Servicios de cuidado agrupados para acercar la ciudad a las personas.', '', 'Arts. 94 y 169', '', 'Decreto 555 de 2021', 'fa-hand-holding-heart'],
  ['P07', 'Protección de humedales', 1, 'Norma ambiental', 'Local', 'Kennedy', 'Reservas hídricas protegidas: El Burro, Techo y La Vaca.', 'Protege el humedal pero consolida el tráfico que lo bordea.', 'Arts. 47 y 55', '', 'Decreto 555 de 2021', 'fa-droplet'],
  ['P08', 'Malla vial y movilidad de carga', 1, 'Norma de movilidad', 'Zonal', 'Kennedy', 'Define la red vial por la que circula el tráfico pesado.', 'Consolida tractomulas por Av. Ciudad de Cali y Cra. 80.', 'Arts. 152 y 308', '', 'Decreto 555 de 2021', 'fa-road'],
  ['T01', 'Corabastos (central mayorista)', 2, 'Equipamiento', 'Regional', 'Kennedy', 'Concentra la venta mayorista de alimentos de la ciudad.', 'Un solo punto: fragilidad, congestión y presión ambiental.', '', '', '', 'fa-warehouse'],
  ['T02', 'Humedal El Burro', 2, 'Ecosistema', 'Local', 'Kennedy', 'Reserva hídrica protegida.', '', 'Arts. 47 y 55', '', '', 'fa-water'],
  ['T03', 'Humedal de Techo', 2, 'Ecosistema', 'Local', 'Kennedy', 'Reserva hídrica protegida.', '', 'Arts. 47 y 55', '', '', 'fa-water'],
  ['T04', 'Humedal La Vaca', 2, 'Ecosistema', 'Local', 'Kennedy', 'Reserva hídrica protegida.', '', 'Arts. 47 y 55', '', '', 'fa-water'],
  ['T05', 'Av. Ciudad de Cali y Carrera 80 (tráfico de tractomulas)', 2, 'Infraestructura', 'Zonal', 'Kennedy', 'Corredores de carga que bordean los humedales.', 'Tráfico pesado junto a los ecosistemas que se prometen cuidar.', 'Arts. 152 y 308', '', '', 'fa-truck'],
  ['V01', 'Economía popular alrededor de Corabastos', 3, 'Tejido vivo', 'Local-regional', 'Kennedy', 'Comercio, reciclaje, transporte y servicios que viven de la central.', 'No aparece como sujeto en la norma.', '', 'Es el corazón de un tejido vivo que sostiene a Kennedy y a la ciudad.', '', 'fa-people-roof'],
  ['V02', 'Seguridad alimentaria de Bogotá', 3, 'Sistema', 'Regional', 'Bogotá-región', 'Abastecimiento de alimentos de la ciudad.', 'Frágil si todo depende de un solo punto.', 'Art. 570', '', '', 'fa-bowl-food'],
  ['F01', 'Corabastos tratado como predio movible', 4, 'Falla de fondo', 'Regional', '', 'Se asume que basta moverlo en el mapa.', 'Ignora el tejido de economía popular que lo rodea.', '', '', '', 'fa-location-crosshairs'],
  ['F02', 'Localidad fragmentada en piezas aisladas', 4, 'Falla de fondo', 'Local', '', 'Reservas protegidas conviven con tráfico pesado que las bordea.', 'Humedal y corredor de carga se planean por separado.', '', '', '', 'fa-puzzle-piece'],
  ['F03', 'Escala regional resuelta con obras locales desarticuladas', 4, 'Falla de fondo', 'Regional', '', 'Una sobrecarga regional se atiende con intervenciones físicas locales.', '', '', '', '', 'fa-scale-unbalanced'],
  ['F04', 'La planificación choca con la realidad del territorio', 4, 'Resultado', 'Local', '', 'Síntesis de las fallas anteriores.', '', '', '', '', 'fa-burst'],
  ['I01', 'Espacio público efectivo por habitante', 5, 'Indicador POT', 'Local', 'Kennedy', 'm² de espacio público por persona.', '', '', '', 'Decreto 555 de 2021', 'fa-tree-city'],
  ['I02', 'Densidad habitacional por hectárea', 5, 'Indicador POT', 'Local', 'Kennedy', 'Viviendas por hectárea.', '', '', '', 'Decreto 555 de 2021', 'fa-city'],
  ['I03', 'Cobertura de equipamientos', 5, 'Indicador POT', 'Local', 'Kennedy', 'Acceso a equipamientos de servicio.', '', '', '', 'Decreto 555 de 2021', 'fa-school'],
  ['I04', 'Metros lineales de malla vial arterial construida', 5, 'Indicador POT', 'Zonal', 'Kennedy', 'Longitud de vías arteriales construidas.', 'Mide obra, no el efecto sobre humedales o economía popular.', '', '', 'Decreto 555 de 2021', 'fa-ruler-horizontal'],
  ['I05', 'Ejecución formal de obras (cumplimiento por infraestructura)', 5, 'Lógica de medición', 'Local', 'Kennedy', 'El plan demuestra metas por obras construidas y m² ampliados.', 'Cumplir la obra no equivale a resolver el problema.', '', '', '', 'fa-helmet-safety'],
  ['O11', 'ODS 11: Ciudades y comunidades sostenibles', 5, 'ODS', 'Global', '', 'Meta global a la que se vinculan los indicadores.', '', '', '', 'Naciones Unidas', 'fa-city'],
  ['O09', 'ODS 9: Industria, innovación e infraestructura', 5, 'ODS', 'Global', '', 'Meta global a la que se vinculan los indicadores.', '', '', '', 'Naciones Unidas', 'fa-industry'],
  ['O13', 'ODS 13: Acción por el clima', 5, 'ODS', 'Global', '', 'Meta global a la que se vinculan los indicadores.', '', '', '', 'Naciones Unidas', 'fa-cloud-sun-rain'],
];
// [origen, destino, tipo(1-5), detalle, justificacion, impacto, peso]
const E = [
  ['P01', 'P02', 1, 'La UPL aplica la proximidad', 'Las UPL son la unidad en la que se organiza la ciudad de 15 minutos.', 'Ordena por piezas locales.', 3],
  ['P02', 'P06', 1, 'La proximidad se concreta en Manzanas del Cuidado', 'Acerca servicios de cuidado a las personas.', 'Mejora acceso local.', 3],
  ['P01', 'P03', 1, 'Las UPL enmarcan las Actuaciones Estratégicas', 'Eje Tintal, Porvenir y Chucua La Vaca se ubican en la localidad.', 'Intervención por sectores.', 2],
  ['P04', 'P05', 1, 'El sistema propone descentralizar', 'Concentrar la venta mayorista en un punto es una fragilidad.', 'Busca una red regional equilibrada.', 4],
  ['P05', 'T01', 1, 'Reubicar la función mayorista', 'La estrategia actúa sobre el predio de Corabastos.', 'Mover el nodo en el mapa.', 4],
  ['P05', 'P06', 1, 'Se combina con Manzanas del Cuidado', 'El POT acompaña la descentralización con estrategias de proximidad.', 'Respuesta local a un problema regional.', 2],
  ['P05', 'V02', 3, 'Busca equilibrar el abastecimiento regional', 'Una red equilibrada reduce la dependencia de un solo punto.', 'Seguridad alimentaria.', 3],
  ['T01', 'V02', 2, 'Concentrar la venta genera fragilidad', 'Si falla el único punto, falla el abastecimiento.', 'Riesgo para la seguridad alimentaria de la ciudad.', 4],
  ['T01', 'T05', 2, 'Genera tráfico pesado', 'Las tractomulas de la central usan los corredores de carga.', 'Colapso de la red vial.', 4],
  ['P08', 'T05', 1, 'Consolida el corredor de carga', 'La norma de movilidad mantiene las tractomulas por Av. Ciudad de Cali y Cra. 80.', 'Tráfico pesado consolidado.', 4],
  ['T05', 'T02', 2, 'Bordea el humedal', 'El corredor de carga colinda con el ecosistema protegido.', 'Presión sobre El Burro.', 3],
  ['T05', 'T03', 2, 'Bordea el humedal', 'El corredor de carga colinda con el ecosistema protegido.', 'Presión sobre Techo.', 3],
  ['T05', 'T04', 2, 'Bordea el humedal', 'El corredor de carga colinda con el ecosistema protegido.', 'Presión sobre La Vaca.', 3],
  ['T01', 'T02', 2, 'Degrada el humedal', 'La actividad mayorista presiona los humedales cercanos.', 'Degradación ambiental.', 3],
  ['T01', 'T03', 2, 'Degrada el humedal', 'La actividad mayorista presiona los humedales cercanos.', 'Degradación ambiental.', 3],
  ['T01', 'T04', 2, 'Degrada el humedal', 'La actividad mayorista presiona los humedales cercanos.', 'Degradación ambiental.', 3],
  ['P07', 'T02', 3, 'Protege como reserva', 'Los arts. 47 y 55 protegen el humedal.', 'Reserva hídrica.', 3],
  ['P07', 'T03', 3, 'Protege como reserva', 'Los arts. 47 y 55 protegen el humedal.', 'Reserva hídrica.', 3],
  ['P07', 'T04', 3, 'Protege como reserva', 'Los arts. 47 y 55 protegen el humedal.', 'Reserva hídrica.', 3],
  ['P03', 'T04', 1, 'Chucua La Vaca como Actuación Estratégica', 'Una de las tres actuaciones está sobre el humedal La Vaca.', 'Intervención física sobre el humedal.', 2],
  ['V01', 'T01', 3, 'Sostiene y es sostenida por la central', 'La economía popular vive del movimiento de Corabastos.', 'Tejido vivo.', 4],
  ['V01', 'V02', 3, 'Sostiene el abastecimiento', 'Comercio y logística populares llevan el alimento a la ciudad.', 'Seguridad alimentaria.', 3],
  ['P05', 'V01', 5, 'La estrategia no reconoce este tejido', 'Reubicar el predio no contempla la economía popular que depende de él.', 'Riesgo de desarticularla.', 4],
  ['P05', 'F01', 1, 'Origina la falla', 'Se plantea Corabastos como predio que se puede mover.', 'Falla de fondo.', 3],
  ['F01', 'V01', 5, 'Ignora el tejido vivo', 'Un predio no es un tejido de economía popular.', 'Invisibiliza actores.', 4],
  ['P07', 'F02', 5, 'Protege sin articular con el tráfico', 'Dibuja la reserva hídrica pero deja pasar el corredor de carga al lado.', 'Piezas aisladas.', 3],
  ['P08', 'F02', 5, 'Consolida el tráfico junto a lo protegido', 'La norma vial y la ambiental no se articulan.', 'Piezas aisladas.', 3],
  ['P03', 'F03', 5, 'Obras locales para un problema regional', 'Las actuaciones intervienen sectores, no la escala de la sobrecarga.', 'Intervención desarticulada.', 3],
  ['P01', 'F03', 5, 'Ordena por piezas locales', 'Las UPL no cubren la escala regional.', 'Intervención desarticulada.', 2],
  ['F01', 'F04', 1, 'Conduce al choque con la realidad', 'Ignorar el tejido vivo impide que la norma funcione.', 'Choque planificación-realidad.', 3],
  ['F02', 'F04', 1, 'Conduce al choque con la realidad', 'Fragmentar el territorio contradice cómo funciona.', 'Choque planificación-realidad.', 3],
  ['F03', 'F04', 1, 'Conduce al choque con la realidad', 'La escala de la solución no corresponde a la del problema.', 'Choque planificación-realidad.', 3],
  ['I01', 'O11', 4, 'Vinculado al ODS 11', 'El POT conecta el espacio público con ciudades sostenibles.', 'Cumplimiento declarado.', 2],
  ['I02', 'O11', 4, 'Vinculado al ODS 11', 'La densidad habitacional se relaciona con ciudades sostenibles.', 'Cumplimiento declarado.', 2],
  ['I03', 'O11', 4, 'Vinculado al ODS 11', 'La cobertura de equipamientos se relaciona con ciudades sostenibles.', 'Cumplimiento declarado.', 2],
  ['I04', 'O09', 4, 'Vinculado al ODS 9', 'La malla vial arterial se relaciona con infraestructura.', 'Cumplimiento declarado.', 2],
  ['I04', 'O13', 4, 'Vinculado al ODS 13', 'El POT vincula sus obras viales y de espacio público con la acción climática.', 'Cumplimiento declarado.', 1],
  ['I01', 'P02', 4, 'Mide la proximidad', 'El espacio público por habitante mide el acceso cercano.', 'Seguimiento de la estrategia.', 2],
  ['I03', 'P06', 4, 'Mide las Manzanas del Cuidado', 'La cobertura de equipamientos mide el cuidado.', 'Seguimiento de la estrategia.', 2],
  ['I02', 'P03', 4, 'Mide las Actuaciones Estratégicas', 'La densidad habitacional hace seguimiento a las actuaciones.', 'Seguimiento de la estrategia.', 2],
  ['I04', 'P08', 4, 'Mide la malla vial', 'Los metros construidos miden la norma de movilidad.', 'Seguimiento de la estrategia.', 2],
  ['I01', 'I05', 1, 'Alimenta la lógica de obras', 'El m² de espacio público ampliado se cuenta como cumplimiento.', 'Cumplimiento por obra.', 2],
  ['I03', 'I05', 1, 'Alimenta la lógica de obras', 'La cobertura de equipamientos se cuenta como obra ejecutada.', 'Cumplimiento por obra.', 2],
  ['I04', 'I05', 1, 'Alimenta la lógica de obras', 'Los metros de vía construidos se cuentan como cumplimiento.', 'Cumplimiento por obra.', 2],
  ['I05', 'V01', 5, 'No mide el tejido vivo', 'Ningún indicador de obra captura la economía popular.', 'Lo esencial queda sin medir.', 4],
  ['I05', 'F04', 5, 'Cumplir la obra no evita el choque', 'Se puede cumplir el indicador y aun así fallar en el territorio.', 'Choque planificación-realidad.', 3],
  ['I04', 'T05', 2, 'Más vías arteriales, más carga', 'Construir malla vial arterial facilita el corredor de tractomulas.', 'Refuerza la presión sobre los humedales.', 2],
];

(async () => {
  const wb = new ExcelJS.Workbook();
  const add = (name, head, rows) => { const ws = wb.addWorksheet(name); ws.addRow(head); rows.forEach(r => ws.addRow(r)); };
  add('CAPAS', ['Codigo', 'Capa', 'Descripcion', 'Color', 'Icono', 'Insignia'], capas);
  add('INTERACCIONES', ['Codigo', 'Tipo', 'Definicion', 'Color', 'Icono'], tipos);
  const capaName = i => capas[i - 1][1];
  add('NODOS', ['ID', 'Nombre', 'Capa', 'Categoria', 'Escala', 'Ubicacion', 'Rol', 'Alerta', 'Actores', 'Hipotesis', 'Fuente', 'Imagen', 'Latitud', 'Longitud', 'Imagen1', 'Imagen2', '', 'Icono'],
    N.map(n => [n[0], n[1], capaName(n[2]), n[3], n[4], n[5], n[6], n[7], n[8], n[9], n[10], '', '', '', '', '', '', n[11]]));
  const ids = new Set(N.map(n => n[0]));
  add('ARISTAS', ['ID', 'Origen', 'Destino', 'Tipo', 'Detalle', 'Justificacion', 'Impacto', 'Peso', '', 'Poder', '', 'Evidencia'],
    E.map((e, k) => { if (!ids.has(e[0]) || !ids.has(e[1])) throw new Error('arista con nodo inexistente: ' + e[0] + ' ' + e[1]); return ['R' + String(k + 1).padStart(2, '0'), e[0], e[1], tipos[e[2] - 1][1], e[3], e[4], e[5], e[6], '', '', '', 'Texto del análisis del POT (Decreto 555 de 2021)']; }));
  await wb.xlsx.writeFile(path.join(ROOT, 'datos', 'red-pot-critica.xlsx'));
  console.log('OK', N.length, 'nodos', E.length, 'aristas');
})();
