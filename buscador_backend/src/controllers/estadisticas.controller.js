const estadisticasService = require('../services/estadisticas.service');
const estadisticasPerfilesService = require('../services/estadisticasPerfiles.service');

function obtener(req, res) {
  const datos = estadisticasService.obtenerEstadisticas();

  if (!datos) {
    return res.status(404).json({ mensaje: 'Ejecuta estadisticas.py para generar los datos' });
  }

  res.json(datos);
}

function obtenerDePerfiles(req, res) {
  if (req.perfil.es_dueno !== 1) {
    return res.status(403).json({ error: 'Solo el dueño de la cuenta puede ver esto' });
  }

  res.json(estadisticasPerfilesService.obtenerEstadisticasPerfiles(req.cuenta.id));
}

module.exports = { obtener, obtenerDePerfiles };
