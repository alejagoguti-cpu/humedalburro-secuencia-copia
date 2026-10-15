// Convierte el libro "red-actores-humanos-no-humanos-kennedy-v2.xlsx" al formato del visor
// (CAPAS, INTERACCIONES, NODOS, ARISTAS, RED) -> datos/red-actores-kennedy.xlsx
// Uso: node tools/make-red-actores.js <libro-origen.xlsx>
const ExcelJS = require('exceljs'); const path = require('path');
const v = c => { let x = c.value; if (x && typeof x === 'object') x = 'result' in x ? x.result : (x.richText ? x.richText.map(t => t.text).join('') : x.text); return x == null ? '' : String(x).trim(); };
const CAPAS = [
  ['C1', 'Actores institucionales', 'Entidades distritales y nacionales que regulan, planean y operan', '#3B9EFF', 'fa-landmark', 'INSTITUCIONAL'],
  ['C2', 'Actores corporativos', 'Empresas y gremios con alta capacidad de transformación del suelo', '#FB923C', 'fa-building', 'CORPORATIVO'],
  ['C3', 'Actores comunitarios y populares', 'Organizaciones, recicladores, comerciantes, escuelas y ciencia ciudadana', '#F43F5E', 'fa-people-group', 'COMUNITARIO'],
  ['C4', 'Actores no humanos bióticos', 'Flora, fauna y microbiota del humedal', '#4ADE80', 'fa-feather', 'BIÓTICO'],
  ['C5', 'Actores no humanos físicos', 'Infraestructura, suelo y cuerpos de agua que condicionan el territorio', '#A78BFA', 'fa-road', 'FÍSICO']];
const capaDe = t => /Institucional/.test(t) ? CAPAS[0][1] : /Corporativo/.test(t) ? CAPAS[1][1] : /Biótico/.test(t) ? CAPAS[3][1] : /No Humano/.test(t) ? CAPAS[4][1] : CAPAS[2][1];
const TIPOS = [
  ['T01', 'Flujo metabólico e hidráulico', 'Residuos, aguas, contaminantes y sedimentos que circulan entre actores', '#FB923C', 'fa-droplet', /Metabólica \/ Residuo|Hidráulica|Tóxica|Física|Nutricional/],
  ['T02', 'Economía y logística', 'Dependencia comercial, explotación, carga y demanda urbana', '#FACC15', 'fa-coins', /Económica|Logística|Comercial|Urbana|Constructiva|Cinética/],
  ['T03', 'Fricción espacial y ecológica', 'Fractura, ruido, sombra, desecación y desplazamiento de la vida', '#F43F5E', 'fa-burst', /Espacial|Sensorial|Morfológica|Hidrogeológica|Térmica|Ecológica \/ Enmascaramiento/],
  ['T04', 'Gobernanza y norma', 'Habilitación, regulación, litigio y desacople institucional', '#3B9EFF', 'fa-scale-balanced', /Normativa|Gobernanza|Regulatoria|Administrativa|Jurídica/],
  ['T05', 'Custodia y cuidado', 'Manejo, alianza comunitaria, pedagogía y ciencia', '#4ADE80', 'fa-hand-holding-heart', /Custodia|Operativa|Biocultural|Red Comunitaria|Pedagógica|Científica/],
  ['T06', 'Vida y hábitat', 'Oferta trófica, hábitat, dispersión y biorremediación', '#2DD4BF', 'fa-seedling', /Trófica|Hábitat|Biorremediación|Dispersión/]];
const tipoDe = s => (TIPOS.find(t => t[5].test(s)) || TIPOS[0]);
const PESO = { 'Crítica': 3, 'Severa': 3, 'Alta': 2, 'Media': 1, 'Baja': 1 };
(async () => {
  const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(path.resolve(process.argv[2]));
  const n = wb.getWorksheet('Nodos (Actores H y No H)'), a = wb.getWorksheet('Aristas (Dinámicas y Red)');
  const out = new ExcelJS.Workbook(), add = (name, head, rows) => { const w = out.addWorksheet(name); w.addRow(head); rows.forEach(r => w.addRow(r)); };
  add('CAPAS', ['Codigo', 'Capa', 'Descripcion', 'Color', 'Icono', 'Insignia'], CAPAS);
  add('INTERACCIONES', ['Codigo', 'Tipo', 'Definicion', 'Color', 'Icono'], TIPOS.map(t => t.slice(0, 5)));
  const byName = new Map(), nodes = [];
  for (let r = 5; r <= n.rowCount; r++) {
    const id = v(n.getCell(r, 1)); if (!id) continue; const g = c => v(n.getCell(r, c));
    byName.set(g(2), id);
    nodes.push([id, g(2), capaDe(g(3)), g(3), g(4), g(6) + (g(5) ? ' · ' + g(5) : ''), g(14),
      'Vulnerabilidad territorial: ' + g(19) + ' · Poder de decisión: ' + g(15),
      'Coordinación: ' + g(17) + ' · Acción: ' + g(18), 'Control de información: ' + g(16), g(13), '', g(7), g(8), '', '', '', '']);
  }
  add('NODOS', ['ID', 'Nombre', 'Capa', 'Categoria', 'Escala', 'Ubicacion', 'Rol', 'Alerta', 'Actores', 'Hipotesis', 'Fuente', 'Imagen', 'Latitud', 'Longitud', 'Imagen 1', 'Imagen 2', '', 'Icono'], nodes);
  const edges = [];
  for (let r = 5; r <= a.rowCount; r++) {
    const id = v(a.getCell(r, 1)); if (!id) continue; const g = c => v(a.getCell(r, c));
    const s = byName.get(g(2)), t = byName.get(g(3)); if (!s || !t) throw new Error('Arista sin nodo: ' + id);
    edges.push([id, s, t, tipoDe(g(4))[1], g(4) + ' (' + g(5) + ', ' + g(6) + ' m)', g(7), g(9), PESO[g(9)] || 1, '', g(8), '', g(10)]);
  }
  add('ARISTAS', ['ID', 'Origen', 'Destino', 'Tipo', 'Detalle', 'Justificacion', 'Tension', 'Peso', 'Declarada', 'Operativa', 'Hipotesis', 'Evidencia'], edges);
  add('RED', ['Clave', 'Valor'], [
    ['titulo', 'Red de actores humanos y no humanos de Kennedy — Corte II'], ['marca', 'ACTORES H Y NO H · KENNEDY'],
    ['saludo', 'la red de actores humanos y no humanos de Kennedy'], ['fuentes', 'Análisis relacional de gobernanza, poder y conectografías del Corte II'],
    ['faq1_pregunta', '¿Qué es un actor humano y uno no humano?'], ['faq1_respuesta', 'Humanos: instituciones, empresas, comunidades y organizaciones. No humanos: flora, fauna, microbiota, infraestructura y cuerpos de agua que también condicionan el territorio.'],
    ['faq2_pregunta', '¿Qué muestran las aristas?'], ['faq2_respuesta', 'Flujos de poder, transferencias metabólicas y fricciones entre actores; el peso refleja el impacto en sostenibilidad (Media, Alta, Severa, Crítica).'],
    ['faq3_pregunta', '¿Cómo veo la red en el territorio?'], ['faq3_respuesta', 'Pulsa MATERIALIZAR: cada actor aparece sobre sus coordenadas WGS84 en Kennedy y las aristas se trazan entre ellos.']]);
  await out.xlsx.writeFile(path.join(__dirname, '..', 'datos', 'red-actores-kennedy.xlsx'));
  console.log('OK', nodes.length, 'nodos', edges.length, 'aristas');
})().catch(e => { console.error(e); process.exit(1); });
