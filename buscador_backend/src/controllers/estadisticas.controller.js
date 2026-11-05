const estadisticasService = require('../services/estadisticas.service');

function obtener(req, res) {
  const datos = estadisticasService.obtenerEstadisticas();

  if (!datos) {
    return res.status(404).json({ mensaje: 'Ejecuta estadisticas.py para generar los datos' });
  }

  res.json(datos);
}

module.exports = { obtener };