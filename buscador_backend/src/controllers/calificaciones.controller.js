const servicio = require('../services/calificaciones.service');

function responderError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno' });
}

function resumenes(req, res) {
  try {
    const isbns = String(req.query.isbns || '')
      .split(',')
      .map((i) => i.trim());
    res.json(servicio.obtenerResumenes(isbns));
  } catch (err) {
    responderError(res, err);
  }
}

function listarBiblioteca(req, res) {
  try {
    res.json(servicio.listarBiblioteca());
  } catch (err) {
    responderError(res, err);
  }
}

function obtenerEntrada(req, res) {
  try {
    const entrada = servicio.obtenerEntrada(req.params.isbn);
    res.json(entrada);
  } catch (err) {
    responderError(res, err);
  }
}

function guardarEntrada(req, res) {
  try {
    const cuerpo = req.body || {};
    const datos = {};
    if ('estado' in cuerpo) datos.estado = cuerpo.estado;
    if ('estrellas' in cuerpo) datos.estrellas = cuerpo.estrellas;
    if ('resena' in cuerpo) datos.resena = cuerpo.resena;
    res.json(servicio.guardarEntrada(req.params.isbn, datos));
  } catch (err) {
    responderError(res, err);
  }
}

function eliminarEntrada(req, res) {
  try {
    servicio.eliminarEntrada(req.params.isbn);
    res.json({ ok: true });
  } catch (err) {
    responderError(res, err);
  }
}

function listarResenas(req, res) {
  try {
    res.json(servicio.listarResenas(req.params.isbn));
  } catch (err) {
    responderError(res, err);
  }
}

module.exports = {
  resumenes,
  listarBiblioteca,
  obtenerEntrada,
  guardarEntrada,
  eliminarEntrada,
  listarResenas
};