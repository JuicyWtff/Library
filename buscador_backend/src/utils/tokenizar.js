const stopwords = require('../data/stopwords');
const lematizar = require('./lematizar');

function tokenizar(titulo) {
  const limpio = titulo.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const palabras = limpio.split(/\s+/).filter((p) => p.length > 0);
  const sinVacias = palabras.filter((p) => !stopwords.includes(p));
  const lematizadas = sinVacias.map((p) => lematizar(p));
  return [...new Set(lematizadas)];
}

module.exports = tokenizar;
