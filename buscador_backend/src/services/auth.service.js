const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db/conexion');

const COSTO_BCRYPT = 10;
const DIAS_SESION = 7;
const COLOR_POR_DEFECTO = '#d98e5f';
const MIN_CONTRASENA = 6;
const MAX_NOMBRE = 40;
const HASH_FALSO = bcrypt.hashSync('contrasena-inexistente', COSTO_BCRYPT);

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

function validarCorreo(correo) {
  const limpio = String(correo || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    throw error(400, 'El correo no tiene un formato válido');
  }
  return limpio;
}

function validarContrasena(contrasena) {
  if (typeof contrasena !== 'string' || contrasena.length < MIN_CONTRASENA) {
    throw error(400, `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres`);
  }
  return contrasena;
}

function validarNombre(nombre) {
  const limpio = String(nombre || '').trim();
  if (limpio.length === 0 || limpio.length > MAX_NOMBRE) {
    throw error(400, `El nombre del perfil debe tener entre 1 y ${MAX_NOMBRE} caracteres`);
  }
  return limpio;
}

function validarColor(color) {
  if (color === undefined || color === null) return COLOR_POR_DEFECTO;
  if (!/^#[0-9a-fA-F]{6}$/.test(String(color))) {
    throw error(400, 'El color debe tener la forma #rrggbb');
  }
  return String(color).toLowerCase();
}

function validarPin(pin) {
  if (!/^\d{4}$/.test(String(pin))) {
    throw error(400, 'El PIN debe tener 4 dígitos');
  }
  return String(pin);
}

function perfilPublico(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    color: fila.color,
    es_dueno: fila.es_dueno === 1,
    tiene_pin: fila.pin_hash !== null,
    creado: fila.creado
  };
}

function obtenerPerfilDeCuenta(perfilId, cuentaId) {
  const fila = db
    .prepare('SELECT * FROM perfiles WHERE id = ? AND cuenta_id = ?')
    .get(perfilId, cuentaId);
  if (!fila) throw error(403, 'Ese perfil no pertenece a tu cuenta');
  return fila;
}

const registrarCuenta = db.transaction(({ correo, contrasena, nombrePerfil, color }) => {
  const correoLimpio = validarCorreo(correo);
  validarContrasena(contrasena);
  const nombre = validarNombre(nombrePerfil);
  const colorValido = validarColor(color);

  const existente = db.prepare('SELECT 1 FROM cuentas WHERE correo = ?').get(correoLimpio);
  if (existente) throw error(409, 'Ya existe una cuenta con ese correo');

  const ahora = new Date().toISOString();
  const cuentaId = Number(
    db
      .prepare('INSERT INTO cuentas (correo, hash, creada) VALUES (?, ?, ?)')
      .run(correoLimpio, bcrypt.hashSync(contrasena, COSTO_BCRYPT), ahora).lastInsertRowid
  );
  const perfilId = Number(
    db
      .prepare(
        `INSERT INTO perfiles (cuenta_id, nombre, color, pin_hash, es_dueno, creado)
         VALUES (?, ?, ?, NULL, 1, ?)`
      )
      .run(cuentaId, nombre, colorValido, ahora).lastInsertRowid
  );

  return {
    cuenta: { id: cuentaId, correo: correoLimpio },
    perfil: perfilPublico(db.prepare('SELECT * FROM perfiles WHERE id = ?').get(perfilId))
  };
});

function iniciarSesion({ correo, contrasena }) {
  const correoLimpio = String(correo || '').trim().toLowerCase();
  const fila = db.prepare('SELECT id, correo, hash FROM cuentas WHERE correo = ?').get(correoLimpio);
  const coincide = bcrypt.compareSync(String(contrasena || ''), fila ? fila.hash : HASH_FALSO);
  if (!fila || !coincide) throw error(401, 'Correo o contraseña incorrectos');
  return { id: fila.id, correo: fila.correo };
}

function crearTokenSesion(cuentaId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sesiones (token, cuenta_id, perfil_id, expira) VALUES (?, ?, NULL, ?)').run(
    token,
    cuentaId,
    expira
  );
  return { token, expira };
}

function validarToken(token) {
  if (typeof token !== 'string' || token.length === 0) return null;
  const sesion = db
    .prepare(
      `SELECT s.token, s.perfil_id, s.expira, c.id AS cuenta_id, c.correo
       FROM sesiones s JOIN cuentas c ON c.id = s.cuenta_id
       WHERE s.token = ?`
    )
    .get(token);
  if (!sesion) return null;
  if (new Date(sesion.expira).getTime() <= Date.now()) {
    db.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
    return null;
  }
  return {
    cuenta: { id: sesion.cuenta_id, correo: sesion.correo },
    perfil_id: sesion.perfil_id
  };
}

function cerrarSesion(token) {
  db.prepare('DELETE FROM sesiones WHERE token = ?').run(token);
}

function obtenerPerfilActivo(perfilId, cuentaId) {
  if (perfilId === null || perfilId === undefined) return null;
  const fila = db
    .prepare('SELECT * FROM perfiles WHERE id = ? AND cuenta_id = ?')
    .get(perfilId, cuentaId);
  return fila || null;
}

function elegirPerfil(token, cuentaId, perfilId, pin) {
  const perfil = obtenerPerfilDeCuenta(perfilId, cuentaId);
  if (perfil.pin_hash !== null) {
    if (typeof pin !== 'string' || !bcrypt.compareSync(pin, perfil.pin_hash)) {
      throw error(401, 'PIN incorrecto');
    }
  }
  db.prepare('UPDATE sesiones SET perfil_id = ? WHERE token = ?').run(perfil.id, token);
  return perfilPublico(perfil);
}

function salirDePerfil(token) {
  db.prepare('UPDATE sesiones SET perfil_id = NULL WHERE token = ?').run(token);
}

function listarPerfiles(cuentaId) {
  return db
    .prepare('SELECT * FROM perfiles WHERE cuenta_id = ? ORDER BY id')
    .all(cuentaId)
    .map(perfilPublico);
}

function crearPerfil(cuentaId, { nombre, color, pin }) {
  const nombreValido = validarNombre(nombre);
  const colorValido = validarColor(color);
  const pinHash =
    pin === undefined || pin === null ? null : bcrypt.hashSync(validarPin(pin), COSTO_BCRYPT);

  const id = Number(
    db
      .prepare(
        `INSERT INTO perfiles (cuenta_id, nombre, color, pin_hash, es_dueno, creado)
         VALUES (?, ?, ?, ?, 0, ?)`
      )
      .run(cuentaId, nombreValido, colorValido, pinHash, new Date().toISOString()).lastInsertRowid
  );
  return perfilPublico(db.prepare('SELECT * FROM perfiles WHERE id = ?').get(id));
}

function actualizarPerfil(cuentaId, perfilActivo, perfilId, datos) {
  const objetivo = obtenerPerfilDeCuenta(perfilId, cuentaId);
  const esElMismo = objetivo.id === perfilActivo.id;
  if (!esElMismo && perfilActivo.es_dueno !== 1) {
    throw error(403, 'Solo el dueño puede editar a otros perfiles');
  }

  const nombre = 'nombre' in datos ? validarNombre(datos.nombre) : objetivo.nombre;
  const color = 'color' in datos ? validarColor(datos.color) : objetivo.color;
  let pinHash = objetivo.pin_hash;
  if ('pin' in datos) {
    pinHash =
      datos.pin === null ? null : bcrypt.hashSync(validarPin(datos.pin), COSTO_BCRYPT);
  }

  db.prepare('UPDATE perfiles SET nombre = ?, color = ?, pin_hash = ? WHERE id = ?').run(
    nombre,
    color,
    pinHash,
    objetivo.id
  );
  return perfilPublico(db.prepare('SELECT * FROM perfiles WHERE id = ?').get(objetivo.id));
}

const eliminarPerfil = db.transaction((cuentaId, perfilId) => {
  const objetivo = obtenerPerfilDeCuenta(perfilId, cuentaId);
  if (objetivo.es_dueno === 1) {
    throw error(409, 'No se puede eliminar al perfil dueño de la cuenta');
  }
  const { total } = db
    .prepare('SELECT COUNT(*) AS total FROM perfiles WHERE cuenta_id = ?')
    .get(cuentaId);
  if (total <= 1) {
    throw error(409, 'La cuenta no puede quedarse sin perfiles');
  }
  db.prepare('DELETE FROM perfiles WHERE id = ?').run(objetivo.id);
});

module.exports = {
  registrarCuenta,
  iniciarSesion,
  crearTokenSesion,
  validarToken,
  cerrarSesion,
  obtenerPerfilActivo,
  elegirPerfil,
  salirDePerfil,
  listarPerfiles,
  crearPerfil,
  actualizarPerfil,
  eliminarPerfil,
  perfilPublico
};
