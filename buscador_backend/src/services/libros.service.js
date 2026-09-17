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

function buscarPorTituloYCategorias(terminos) {
  const stmtTitulo = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE titulo LIKE ?
    LIMIT 10
  `);

  const stmtCategoria = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE categoria = ?
    LIMIT 10
  `);

  const isbnsExistentes = new Set();
  const combinados = [];

  for (const termino of terminos) {
    const resultadosTitulo = stmtTitulo.all(termino + '%');
    for (const libro of resultadosTitulo) {
      if (!isbnsExistentes.has(libro.isbn)) {
        isbnsExistentes.add(libro.isbn);
        combinados.push(libro);
      }
    }

    const categoriaEncontrada = encontrarCategoriaPorPalabra(termino);
    if (categoriaEncontrada) {
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
  const terminos = obtenerTerminosBusqueda(texto);
  return buscarPorTituloYCategorias(terminos);
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