const servicio = require('../services/auth.service');

const DURACION_COOKIE = 7 * 24 * 60 * 60 * 1000;

const opcionesCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: DURACION_COOKIE
};

function responderError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno' });
}

function abrirSesion(res, cuentaId) {
  const { token } = servicio.crearTokenSesion(cuentaId);
  res.cookie('sesion', token, opcionesCookie);
}

function registro(req, res) {
  try {
    const cuerpo = req.body || {};
    const { cuenta, perfil } = servicio.registrarCuenta({
      correo: cuerpo.correo,
      contrasena: cuerpo.contrasena,
      nombrePerfil: cuerpo.nombre_perfil,
      color: cuerpo.color
    });
    abrirSesion(res, cuenta.id);
    res.status(201).json({ cuenta, perfiles: [perfil] });
  } catch (err) {
    responderError(res, err);
  }
}

function login(req, res) {
  try {
    const cuerpo = req.body || {};
    const cuenta = servicio.iniciarSesion({
      correo: cuerpo.correo,
      contrasena: cuerpo.contrasena
    });
    abrirSesion(res, cuenta.id);
    res.json({ cuenta, perfiles: servicio.listarPerfiles(cuenta.id) });
  } catch (err) {
    responderError(res, err);
  }
}

function logout(req, res) {
  try {
    const token = req.cookies ? req.cookies.sesion : undefined;
    if (token) servicio.cerrarSesion(token);
    res.clearCookie('sesion', { httpOnly: true, sameSite: 'lax' });
    res.json({ ok: true });
  } catch (err) {
    responderError(res, err);
  }
}

function yo(req, res) {
  try {
    const fila = servicio.obtenerPerfilActivo(req.perfilIdSesion, req.cuenta.id);
    res.json({
      cuenta: req.cuenta,
      perfil: fila ? servicio.perfilPublico(fila) : null
    });
  } catch (err) {
    responderError(res, err);
  }
}

function listarPerfiles(req, res) {
  try {
    res.json(servicio.listarPerfiles(req.cuenta.id));
  } catch (err) {
    responderError(res, err);
  }
}

function crearPerfil(req, res) {
  try {
    if (req.perfil.es_dueno !== 1) {
      return res.status(403).json({ error: 'Solo el dueño puede crear perfiles' });
    }
    const cuerpo = req.body || {};
    const perfil = servicio.crearPerfil(req.cuenta.id, {
      nombre: cuerpo.nombre,
      color: cuerpo.color,
      pin: cuerpo.pin
    });
    res.status(201).json(perfil);
  } catch (err) {
    responderError(res, err);
  }
}

function actualizarPerfil(req, res) {
  try {
    const cuerpo = req.body || {};
    const datos = {};
    if ('nombre' in cuerpo) datos.nombre = cuerpo.nombre;
    if ('color' in cuerpo) datos.color = cuerpo.color;
    if ('pin' in cuerpo) datos.pin = cuerpo.pin;
    res.json(
      servicio.actualizarPerfil(req.cuenta.id, req.perfil, Number(req.params.id), datos)
    );
  } catch (err) {
    responderError(res, err);
  }
}

function eliminarPerfil(req, res) {
  try {
    if (req.perfil.es_dueno !== 1) {
      return res.status(403).json({ error: 'Solo el dueño puede eliminar perfiles' });
    }
    servicio.eliminarPerfil(req.cuenta.id, Number(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    responderError(res, err);
  }
}

function entrarAPerfil(req, res) {
  try {
    const cuerpo = req.body || {};
    const perfil = servicio.elegirPerfil(
      req.token,
      req.cuenta.id,
      Number(req.params.id),
      cuerpo.pin
    );
    res.json({ cuenta: req.cuenta, perfil });
  } catch (err) {
    responderError(res, err);
  }
}

function salirDePerfil(req, res) {
  try {
    servicio.salirDePerfil(req.token);
    res.json({ ok: true });
  } catch (err) {
    responderError(res, err);
  }
}

module.exports = {
  registro,
  salirDePerfil,
  login,
  logout,
  yo,
  listarPerfiles,
  crearPerfil,
  actualizarPerfil,
  eliminarPerfil,
  entrarAPerfil
};
