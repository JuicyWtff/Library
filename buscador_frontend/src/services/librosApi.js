const URL_BASE = 'http://localhost:3000';

async function buscarLibros(texto) {
  const respuesta = await fetch(`${URL_BASE}/buscar?q=${texto}`);
  const datos = await respuesta.json();
  return datos;
}

export { buscarLibros };