const URL_BASE = 'http://localhost:3000';

async function pedir(ruta, opciones) {
  const respuesta = await fetch(`${URL_BASE}${ruta}`, opciones);
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error((datos && datos.error) || 'Algo salió mal');
  }
  return datos;
}

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

async function obtenerResumenes(isbns) {
  if (isbns.length === 0) {
    return {};
  }
  const lista = isbns.slice(0, 100).map(encodeURIComponent).join(',');
  return pedir(`/resumenes?isbns=${lista}`);
}

async function obtenerBiblioteca() {
  return pedir('/biblioteca');
}

async function obtenerEntrada(isbn) {
  return pedir(`/biblioteca/${encodeURIComponent(isbn)}`);
}

async function guardarEntrada(isbn, datos) {
  return pedir(`/biblioteca/${encodeURIComponent(isbn)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
}

async function eliminarEntrada(isbn) {
  return pedir(`/biblioteca/${encodeURIComponent(isbn)}`, { method: 'DELETE' });
}

async function obtenerResenas(isbn) {
  return pedir(`/resenas/${encodeURIComponent(isbn)}`);
}

export {
  buscarLibros,
  buscarPorCategoria,
  obtenerEstadisticas,
  obtenerResumenes,
  obtenerBiblioteca,
  obtenerEntrada,
  guardarEntrada,
  eliminarEntrada,
  obtenerResenas
};