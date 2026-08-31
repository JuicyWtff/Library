const db = require('../db/conexion');

function buscarPorTitulo(texto) {
  const stmt = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial
    FROM libros
    WHERE titulo LIKE ?
    LIMIT 10
  `);

  return stmt.all(texto + '%');
}

module.exports = { buscarPorTitulo };