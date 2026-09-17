const librosService = require('../services/libros.service');

function buscar(req, res) {
  const q = req.query.q;

  if (!q || q.trim() === '') {
    return res.json([]);
  }

  const resultados = librosService.buscarPorTitulo(q);

  res.json(resultados);
}

function buscarPorCategoria(req, res) {
  const nombre = req.query.nombre;

  if (!nombre) {
    return res.json([]);
  }

  const resultados = librosService.buscarPorCategoria(nombre);

  res.json(resultados);
}

module.exports = { buscar, buscarPorCategoria };