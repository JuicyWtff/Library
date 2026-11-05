const fs = require('fs');
const path = require('path');

const RUTA = path.join(__dirname, '../../data/estadisticas.json');

function obtenerEstadisticas() {
  if (!fs.existsSync(RUTA)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(RUTA, 'utf-8'));
}

module.exports = { obtenerEstadisticas };