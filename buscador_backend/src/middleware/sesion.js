const servicio = require('../services/auth.service');

function requiereSesion(req, res, next) {
  const token = req.cookies ? req.cookies.sesion : undefined;
  const sesion = servicio.validarToken(token);
  if (!sesion) {
    return res.status(401).json({ error: 'Necesitas iniciar sesión' });
  }
  req.token = token;
  req.cuenta = sesion.cuenta;
  req.perfilIdSesion = sesion.perfil_id;
  next();
}

function requierePerfil(req, res, next) {
  requiereSesion(req, res, () => {
    const perfil = servicio.obtenerPerfilActivo(req.perfilIdSesion, req.cuenta.id);
    if (!perfil) {
      return res.status(403).json({ error: 'Debes elegir un perfil de tu cuenta' });
    }
    req.perfil = perfil;
    next();
  });
}

module.exports = { requiereSesion, requierePerfil };
