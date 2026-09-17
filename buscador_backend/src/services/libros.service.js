const db = require('../db/conexion');
const categorias = require('../data/categorias');

function encontrarCategoriaPorPalabra(texto) {
  const textoLower = texto.toLowerCase();
  for (const [categoria, palabras] of Object.entries(categorias)) {
    if (palabras.includes(textoLower)) {
      return categoria;
    }
  }
  return null;
}

function buscarPorTitulo(texto) {
  const stmtTitulo = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE titulo LIKE ?
    LIMIT 10
  `);

  const resultadosTitulo = stmtTitulo.all(texto + '%');

  const categoriaEncontrada = encontrarCategoriaPorPalabra(texto);

  if (!categoriaEncontrada) {
    return resultadosTitulo;
  }

  const stmtCategoria = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE categoria = ?
    LIMIT 10
  `);

  const resultadosCategoria = stmtCategoria.all(categoriaEncontrada);

  const isbnsExistentes = new Set(resultadosTitulo.map((libro) => libro.isbn));
  const combinados = [...resultadosTitulo];

  for (const libro of resultadosCategoria) {
    if (!isbnsExistentes.has(libro.isbn)) {
      combinados.push(libro);
    }
  }

  return combinados;
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