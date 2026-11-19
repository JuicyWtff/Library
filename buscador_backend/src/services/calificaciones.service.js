const db = require('../db/conexion');
const { USUARIO_PRUEBA_MIGRADO } = require('../data/usuarioPruebaMigrado');

const ESTADOS = ['leido', 'leyendo', 'pendiente'];
const MAX_RESENA = 2000;
const MAX_ISBNS = 100;

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

function consultaVotos() {
  return `SELECT isbn,
                 CASE WHEN calificacion > 0 THEN calificacion / 2.0 END AS estrellas,
                 1 AS lectura
          FROM calificaciones
          WHERE user_id != ${USUARIO_PRUEBA_MIGRADO}
          UNION ALL
          SELECT isbn,
                 estrellas,
                 CASE WHEN estado = 'leido' THEN 1 ELSE 0 END AS lectura
          FROM perfil_biblioteca
          WHERE estado = 'leido' OR estrellas IS NOT NULL`;
}

function obtenerResumenes(isbns) {
  const lista = [...new Set(isbns)].filter((i) => i.length > 0).slice(0, MAX_ISBNS);
  const resultado = {};
  if (lista.length === 0) return resultado;

  for (const isbn of lista) {
    resultado[isbn] = { promedio: null, total: 0 };
  }

  const marcas = lista.map(() => '?').join(',');
  const filas = db
    .prepare(
      `SELECT isbn, AVG(estrellas) AS promedio, COUNT(estrellas) AS total
       FROM (${consultaVotos()})
       WHERE estrellas IS NOT NULL AND isbn IN (${marcas})
       GROUP BY isbn`
    )
    .all(...lista);

  for (const fila of filas) {
    resultado[fila.isbn] = {
      promedio: Math.round(fila.promedio * 10) / 10,
      total: fila.total
    };
  }
  return resultado;
}

function obtenerEntrada(perfilId, isbn) {
  const fila = db
    .prepare(
      `SELECT isbn, estado, estrellas, resena, fecha
       FROM perfil_biblioteca
       WHERE perfil_id = ? AND isbn = ?`
    )
    .get(perfilId, isbn);

  return fila || null;
}

function guardarEntrada(perfilId, isbn, datos) {
  const libro = db.prepare('SELECT isbn FROM libros WHERE isbn = ?').get(isbn);
  if (!libro) throw error(404, 'El libro no existe');

  const actual = obtenerEntrada(perfilId, isbn);

  let estado = actual ? actual.estado : null;
  let estrellas = actual ? actual.estrellas : null;
  let resena = actual ? actual.resena : null;

  if (datos.estado !== undefined) {
    if (!ESTADOS.includes(datos.estado)) throw error(400, 'Estado invalido');
    estado = datos.estado;
  }

  if (datos.estrellas !== undefined) {
    if (datos.estrellas === null || datos.estrellas === 0) {
      estrellas = null;
    } else {
      const n = Number(datos.estrellas);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        throw error(400, 'Las estrellas deben ser de 1 a 5');
      }
      estrellas = n;
    }
  }

  if (datos.resena !== undefined) {
    const texto = datos.resena === null ? '' : String(datos.resena).trim();
    if (texto.length > MAX_RESENA) throw error(400, 'La resena es muy larga');
    resena = texto.length > 0 ? texto : null;
  }

  if (estado === null) {
    estado = 'leido';
  }

  const fecha = new Date().toISOString();

  const guardar = db.transaction(() => {
    db.prepare(
      `INSERT OR REPLACE INTO perfil_biblioteca (perfil_id, isbn, estado, estrellas, resena, fecha)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(perfilId, isbn, estado, estrellas, resena, fecha);
  });
  guardar();

  return obtenerEntrada(perfilId, isbn);
}

function eliminarEntrada(perfilId, isbn) {
  db.prepare('DELETE FROM perfil_biblioteca WHERE perfil_id = ? AND isbn = ?').run(
    perfilId,
    isbn
  );
}

function listarBiblioteca(perfilId) {
  return db
    .prepare(
      `SELECT b.isbn, l.titulo, l.autor, l.imagen, l.categoria,
              b.estado, b.estrellas, b.resena, b.fecha
       FROM perfil_biblioteca b
       JOIN libros l ON l.isbn = b.isbn
       WHERE b.perfil_id = ?
       ORDER BY b.fecha DESC`
    )
    .all(perfilId);
}

function listarResenas(perfilId, isbn) {
  const filas = db
    .prepare(
      `SELECT perfil_id, resena, estrellas, fecha
       FROM perfil_biblioteca
       WHERE isbn = ? AND resena IS NOT NULL
       ORDER BY fecha DESC
       LIMIT 20`
    )
    .all(isbn);

  return filas.map((f) => ({
    resena: f.resena,
    estrellas: f.estrellas,
    fecha: f.fecha,
    esMia: f.perfil_id === perfilId
  }));
}

module.exports = {
  consultaVotos,
  obtenerResumenes,
  obtenerEntrada,
  guardarEntrada,
  eliminarEntrada,
  listarBiblioteca,
  listarResenas
};
