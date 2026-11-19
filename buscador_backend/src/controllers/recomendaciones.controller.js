const recomendaciones = require('../services/recomendaciones.service');
const arbol = require('../services/arbol.service');

function paraTi(req, res) {
  try {
    res.json(recomendaciones.obtenerParaTi());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudieron armar las recomendaciones' });
  }
}

function verArbol(req, res) {
  try {
    res.json(arbol.describirArbol());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo describir el arbol' });
  }
}

module.exports = { paraTi, verArbol };