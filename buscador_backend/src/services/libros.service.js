const db = require('../db/conexion');
const categorias = require('../data/categorias');
const diccionarioIdiomas = require('../data/idiomas');
const lematizar = require('../utils/lematizar');

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
  const lema = lematizar(prefijo.toLowerCase());
  const stmt = db.prepare(`
    SELECT DISTINCT isbn FROM indice WHERE palabra LIKE ? LIMIT 50
  `);
  return stmt.all(lema + '%').map((fila) => fila.isbn);
}

function buscarIsbnsPorPalabraExacta(palabra) {
  const lema = lematizar(palabra.toLowerCase());
  const stmt = db.prepare(`
    SELECT DISTINCT isbn FROM indice WHERE palabra = ? LIMIT 50
  `);
  return stmt.all(lema).map((fila) => fila.isbn);
}

function buscarIsbnsPorFrase(frase, esOriginal) {
  const palabras = frase.trim().split(/\s+/).filter((p) => p.length > 0);

  if (palabras.length === 0) {
    return [];
  }

  let conjuntos = palabras.map((palabra) =>
    esOriginal
      ? new Set(buscarIsbnsPorPrefijo(palabra))
      : new Set(buscarIsbnsPorPalabraExacta(palabra))
  );

  let interseccion = conjuntos[0];
  for (let i = 1; i < conjuntos.length; i++) {
    interseccion = new Set([...interseccion].filter((isbn) => conjuntos[i].has(isbn)));
  }

  return [...interseccion];
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

function buscarPorTitulo(texto) {
  const textoLower = texto.toLowerCase();
  const esOriginal = !diccionarioIdiomas[textoLower];
  const terminos = obtenerTerminosBusqueda(texto);

  const isbnsExistentes = new Set();
  let combinados = [];

  for (const termino of terminos) {
    const isbns = buscarIsbnsPorFrase(termino, esOriginal);
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
        LIMIT 50
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

function buscarPorCategoria(categoria) {
  const stmt = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE categoria = ?
    LIMIT 50
  `);
  return stmt.all(categoria);
}

module.exports = { buscarPorTitulo, buscarPorCategoria };