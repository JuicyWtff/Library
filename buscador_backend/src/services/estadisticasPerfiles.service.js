const db = require('../db/conexion');
const { SIN_CLASIFICAR } = require('./arbol.service');
const { construirVectorPerfil, terminosDeMayorPeso } = require('./recomendaciones.service');

const TERMINOS_POR_PERFIL = 10;
const DECIMALES_PESO = 3;
const DECIMALES_PROMEDIO = 2;

const consultaPerfilesDeCuenta = db.prepare(
  'SELECT id, nombre, color FROM perfiles WHERE cuenta_id = ? ORDER BY es_dueno DESC, id'
);

const consultaPorEstado = db.prepare(
  `SELECT estado, COUNT(*) AS cantidad
   FROM perfil_biblioteca
   WHERE perfil_id = ?
   GROUP BY estado`
);

const consultaPorGenero = db.prepare(
  `SELECT COALESCE(l.categoria, '${SIN_CLASIFICAR}') AS genero, COUNT(*) AS cantidad
   FROM perfil_biblioteca b
   JOIN libros l ON l.isbn = b.isbn
   WHERE b.perfil_id = ?
   GROUP BY genero
   ORDER BY cantidad DESC, genero`
);

const consultaPromedio = db.prepare(
  'SELECT AVG(estrellas) AS promedio FROM perfil_biblioteca WHERE perfil_id = ? AND estrellas IS NOT NULL'
);

function contarPorEstado(perfilId) {
  const conteo = { leido: 0, leyendo: 0, pendiente: 0 };
  for (const { estado, cantidad } of consultaPorEstado.all(perfilId)) {
    conteo[estado] = cantidad;
  }
  return conteo;
}

function redondear(valor, decimales) {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function obtenerPromedio(perfilId) {
  const { promedio } = consultaPromedio.get(perfilId);
  return promedio === null ? null : redondear(promedio, DECIMALES_PROMEDIO);
}

function obtenerTerminos(perfilId) {
  const vector = construirVectorPerfil(perfilId);
  return terminosDeMayorPeso(vector, TERMINOS_POR_PERFIL).map(([palabra, peso]) => ({
    palabra,
    peso: redondear(peso, DECIMALES_PESO)
  }));
}

function resumirPerfil(perfil) {
  const porEstado = contarPorEstado(perfil.id);
  return {
    id: perfil.id,
    nombre: perfil.nombre,
    color: perfil.color,
    total_libros: porEstado.leido + porEstado.leyendo + porEstado.pendiente,
    terminos: obtenerTerminos(perfil.id),
    por_estado: porEstado,
    por_genero: consultaPorGenero.all(perfil.id),
    promedio: obtenerPromedio(perfil.id)
  };
}

function obtenerEstadisticasPerfiles(cuentaId) {
  return consultaPerfilesDeCuenta.all(cuentaId).map(resumirPerfil);
}

module.exports = { obtenerEstadisticasPerfiles };
