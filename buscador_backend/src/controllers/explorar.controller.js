const servicio = require('../services/explorar.service');

function explorar(req, res) {
  try {
    res.json(servicio.obtenerExplorar(req.query.refrescar === '1'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo armar la pantalla de explorar' });
  }
}

module.exports = { explorar };