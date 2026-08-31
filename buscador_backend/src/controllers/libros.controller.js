const librosService = require('../services/libros.service');

function buscar(req, res) {
  const q = req.query.q;

  if (!q || q.trim() === '') {
    return res.json([]);
  }

  const resultados = librosService.buscarPorTitulo(q);

  res.json(resultados);
}

module.exports = { buscar };