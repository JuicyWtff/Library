const path = require('path');
const Database = require('better-sqlite3');
const { consultaVotos } = require('./calificaciones.service');

const db = new Database(path.join(__dirname, '..', '..', 'books.db'));

const PESO_PROMEDIO_GLOBAL = 10;
const MIN_VOTOS_GENERAL = 10;
const MIN_VOTOS_CATEGORIA = 3;
const LIBROS_POR_FILA = 20;
const VIGENCIA_MS = 5 * 60 * 1000;

let construidoEn = 0;
let cache = null;

function reconstruirResumen() {
  db.exec(`
    DROP TABLE IF EXISTS temp.resumen_libros;
    CREATE TEMP TABLE resumen_libros AS
    SELECT
      isbn,
      COUNT(estrellas) AS votos,
      AVG(estrellas) AS promedio,
      SUM(lectura) AS lecturas
    FROM (${consultaVotos()})
    GROUP BY isbn;
    CREATE INDEX temp.idx_resumen_isbn ON resumen_libros(isbn);
  `);
}

function promedioGlobal() {
  const fila = db
    .prepare(`SELECT AVG(estrellas) AS promedio FROM (${consultaVotos()})`)
    .get();
  return fila.promedio || 0;
}

function formatear(fila) {
  return {
    isbn: fila.isbn,
    titulo: fila.titulo,
    autor: fila.autor,
    imagen: fila.imagen,
    categoria: fila.categoria,
    promedio: fila.promedio === null ? null : Math.round(fila.promedio * 10) / 10,
    votos: fila.votos,
    lecturas: fila.lecturas
  };
}

function mejoresCalificados(c, minVotos, categoria) {
  const puntaje = `((r.votos * 1.0 / (r.votos + ${PESO_PROMEDIO_GLOBAL})) * r.promedio
    + (${PESO_PROMEDIO_GLOBAL} * 1.0 / (r.votos + ${PESO_PROMEDIO_GLOBAL})) * ${c})`;
  const filtroCategoria = categoria ? 'AND l.categoria = ?' : '';
  const parametros = categoria
    ? [minVotos, categoria, LIBROS_POR_FILA]
    : [minVotos, LIBROS_POR_FILA];

  return db
    .prepare(
      `SELECT l.isbn, l.titulo, l.autor, l.imagen, l.categoria,
              r.votos, r.promedio, r.lecturas
       FROM resumen_libros r
       JOIN libros l ON l.isbn = r.isbn
       WHERE r.votos >= ? ${filtroCategoria}
       ORDER BY ${puntaje} DESC
       LIMIT ?`
    )
    .all(...parametros)
    .map(formatear);
}

function masLeidos() {
  return db
    .prepare(
      `SELECT l.isbn, l.titulo, l.autor, l.imagen, l.categoria,
              r.votos, r.promedio, r.lecturas
       FROM resumen_libros r
       JOIN libros l ON l.isbn = r.isbn
       ORDER BY r.lecturas DESC
       LIMIT ?`
    )
    .all(LIBROS_POR_FILA)
    .map(formatear);
}

function construirSecciones() {
  reconstruirResumen();
  const c = promedioGlobal();
  const secciones = [];

  const mejores = mejoresCalificados(c, MIN_VOTOS_GENERAL, null);
  if (mejores.length > 0) {
    secciones.push({ id: 'mejores', titulo: 'Mejor calificados', libros: mejores });
  }

  const leidos = masLeidos();
  if (leidos.length > 0) {
    secciones.push({ id: 'leidos', titulo: 'Lo más leído', libros: leidos });
  }

  const categorias = db
    .prepare(
      `SELECT DISTINCT categoria FROM libros
       WHERE categoria IS NOT NULL AND categoria != 'Unclassified'
       ORDER BY categoria`
    )
    .all()
    .map((fila) => fila.categoria);

  for (const categoria of categorias) {
    const libros = mejoresCalificados(c, MIN_VOTOS_CATEGORIA, categoria);
    if (libros.length > 0) {
      secciones.push({
        id: `categoria-${categoria}`,
        titulo: `Lo mejor de ${categoria}`,
        libros
      });
    }
  }

  return secciones;
}

function obtenerExplorar(forzar) {
  const vigente = cache && Date.now() - construidoEn < VIGENCIA_MS;
  if (!forzar && vigente) {
    return cache;
  }
  cache = { secciones: construirSecciones() };
  construidoEn = Date.now();
  return cache;
}

module.exports = { obtenerExplorar };