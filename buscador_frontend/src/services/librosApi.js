const URL_BASE = 'http://localhost:3000';

const RUTAS_SIN_AVISO_DE_SESION = [
  /^\/auth\/yo$/,
  /^\/auth\/login$/,
  /^\/auth\/registro$/,
  /^\/perfiles\/\d+\/entrar$/
];

let manejadorSesionVencida = null;

function registrarManejadorSesionVencida(manejador) {
  manejadorSesionVencida = manejador;
}

function avisarSesionVencida(ruta, estado, mensaje) {
  if (!manejadorSesionVencida) return;
  const ignorada = RUTAS_SIN_AVISO_DE_SESION.some((patron) => patron.test(ruta.split('?')[0]));
  if (ignorada) return;
  if (estado === 401) {
    manejadorSesionVencida('sesion');
  } else if (estado === 403 && mensaje === 'Debes elegir un perfil de tu cuenta') {
    manejadorSesionVencida('perfil');
  }
}

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(`${URL_BASE}${ruta}`, {
    ...opciones,
    credentials: 'include'
  });
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    const mensaje = (datos && datos.error) || 'Algo salió mal';
    avisarSesionVencida(ruta, respuesta.status, mensaje);
    const error = new Error(mensaje);
    error.estado = respuesta.status;
    throw error;
  }
  return datos;
}

function enviarJson(metodo, cuerpo) {
  return {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo)
  };
}

async function buscarLibros(texto) {
  return pedir(`/buscar?q=${texto}`);
}

async function buscarPorRelevancia(texto) {
  return pedir(`/buscar-relevancia?q=${texto}`);
}

async function buscarPorCategoria(categoria) {
  return pedir(`/categoria?nombre=${categoria}`);
}

async function obtenerEstadisticas() {
  return pedir('/estadisticas');
}

async function obtenerEstadisticasPerfiles() {
  return pedir('/estadisticas-perfiles');
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
  return pedir(`/biblioteca/${encodeURIComponent(isbn)}`, enviarJson('PUT', datos));
}

async function eliminarEntrada(isbn) {
  return pedir(`/biblioteca/${encodeURIComponent(isbn)}`, { method: 'DELETE' });
}

async function obtenerResenas(isbn) {
  return pedir(`/resenas/${encodeURIComponent(isbn)}`);
}

async function obtenerExplorar() {
  return pedir('/explorar');
}

async function obtenerParaTi() {
  return pedir('/para-ti');
}

async function registrarCuenta(datos) {
  return pedir('/auth/registro', enviarJson('POST', datos));
}

async function iniciarSesion(datos) {
  return pedir('/auth/login', enviarJson('POST', datos));
}

async function cerrarSesion() {
  return pedir('/auth/logout', { method: 'POST' });
}

async function salirDePerfil() {
  return pedir('/auth/salir-perfil', { method: 'POST' });
}

async function obtenerYo() {
  return pedir('/auth/yo');
}

async function listarPerfiles() {
  return pedir('/perfiles');
}

async function crearPerfil(datos) {
  return pedir('/perfiles', enviarJson('POST', datos));
}

async function actualizarPerfil(id, datos) {
  return pedir(`/perfiles/${id}`, enviarJson('PUT', datos));
}

async function eliminarPerfil(id) {
  return pedir(`/perfiles/${id}`, { method: 'DELETE' });
}

async function entrarAPerfil(id, pin) {
  return pedir(`/perfiles/${id}/entrar`, enviarJson('POST', pin ? { pin } : {}));
}

export {
  registrarManejadorSesionVencida,
  buscarLibros,
  buscarPorRelevancia,
  buscarPorCategoria,
  obtenerEstadisticas,
  obtenerEstadisticasPerfiles,
  obtenerResumenes,
  obtenerBiblioteca,
  obtenerEntrada,
  guardarEntrada,
  eliminarEntrada,
  obtenerResenas,
  obtenerExplorar,
  obtenerParaTi,
  registrarCuenta,
  iniciarSesion,
  cerrarSesion,
  salirDePerfil,
  obtenerYo,
  listarPerfiles,
  crearPerfil,
  actualizarPerfil,
  eliminarPerfil,
  entrarAPerfil
};
