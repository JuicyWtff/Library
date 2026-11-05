const URL_BASE = 'http://localhost:3000';

async function buscarLibros(texto) {
  const respuesta = await fetch(`${URL_BASE}/buscar?q=${texto}`);
  const datos = await respuesta.json();
  return datos;
}

async function buscarPorCategoria(categoria) {
  const respuesta = await fetch(`${URL_BASE}/categoria?nombre=${categoria}`);
  const datos = await respuesta.json();
  return datos;
}

async function obtenerEstadisticas() {
  const respuesta = await fetch(`${URL_BASE}/estadisticas`);
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las estadísticas');
  }
  return respuesta.json();
}

export { buscarLibros, buscarPorCategoria, obtenerEstadisticas };