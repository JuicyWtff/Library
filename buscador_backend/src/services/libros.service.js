const db = require('../db/conexion');
const categorias = require('../data/categorias');
const diccionarioIdiomas = require('../data/idiomas');

function encontrarCategoriaPorPalabra(texto) {
  const textoLower = texto.toLowerCase();
  for (const [categoria, palabras] of Object.entries(categorias)) {
    if (palabras.includes(textoLower)) {
      return categoria;
    }
  }
  return null;
}

function obtenerTerminosBusqueda(texto) {
  const textoLower = texto.toLowerCase();
  if (diccionarioIdiomas[textoLower]) {
    return diccionarioIdiomas[textoLower];
  }
  return [texto];
}

function buscarIsbnsPorPrefijo(prefijo) {
  const stmt = db.prepare(`
    SELECT DISTINCT isbn FROM indice WHERE palabra LIKE ? LIMIT 10
  `);
  return stmt.all(prefijo.toLowerCase() + '%').map((fila) => fila.isbn);
}

function buscarIsbnsPorPalabraExacta(palabra) {
  const stmt = db.prepare(`
    SELECT DISTINCT isbn FROM indice WHERE palabra = ? LIMIT 10
  `);
  return stmt.all(palabra.toLowerCase()).map((fila) => fila.isbn);
}

function obtenerLibrosPorIsbns(isbns) {
  if (isbns.length === 0) {
    return [];
  }
  const placeholders = isbns.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE isbn IN (${placeholders})
  `);
  return stmt.all(...isbns);
}

function buscarPorTituloYCategorias(terminos, esOriginal) {
  const isbnsExistentes = new Set();
  let combinados = [];

  for (const termino of terminos) {
    const isbns = esOriginal
      ? buscarIsbnsPorPrefijo(termino)
      : buscarIsbnsPorPalabraExacta(termino);

    const libros = obtenerLibrosPorIsbns(isbns);

    for (const libro of libros) {
      if (!isbnsExistentes.has(libro.isbn)) {
        isbnsExistentes.add(libro.isbn);
        combinados.push(libro);
      }
    }

    const categoriaEncontrada = encontrarCategoriaPorPalabra(termino);
    if (categoriaEncontrada) {
      const stmtCategoria = db.prepare(`
        SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
        FROM libros
        WHERE categoria = ?
        LIMIT 10
      `);
      const resultadosCategoria = stmtCategoria.all(categoriaEncontrada);
      for (const libro of resultadosCategoria) {
        if (!isbnsExistentes.has(libro.isbn)) {
          isbnsExistentes.add(libro.isbn);
          combinados.push(libro);
        }
      }
    }
  }

  return combinados;
}

function buscarPorTitulo(texto) {
  const textoLower = texto.toLowerCase();
  const esOriginal = !diccionarioIdiomas[textoLower];
  const terminos = obtenerTerminosBusqueda(texto);
  return buscarPorTituloYCategorias(terminos, esOriginal);
}

function buscarPorCategoria(categoria) {
  const stmt = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE categoria = ?
    LIMIT 20
  `);
  return stmt.all(categoria);
}

module.exports = { buscarPorTitulo, buscarPorCategoria };