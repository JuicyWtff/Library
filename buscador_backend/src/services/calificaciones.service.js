const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', '..', 'books.db'));

const USUARIO_ACTUAL = 999999;
const ESTADOS = ['leido', 'leyendo', 'pendiente'];
const MAX_RESENA = 2000;
const MAX_ISBNS = 100;

db.exec(`
  CREATE TABLE IF NOT EXISTS biblioteca (
    user_id INTEGER NOT NULL,
    isbn TEXT NOT NULL,
    estado TEXT NOT NULL,
    resena TEXT,
    fecha TEXT NOT NULL,
    PRIMARY KEY (user_id, isbn)
  );
  CREATE INDEX IF NOT EXISTS idx_biblioteca_isbn ON biblioteca(isbn);
`);

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

function aEstrellas(calificacion) {
  if (calificacion === null || calificacion === undefined || calificacion <= 0) {
    return null;
  }
  return calificacion / 2;
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
      `SELECT isbn, AVG(calificacion) / 2.0 AS promedio, COUNT(*) AS total
       FROM calificaciones
       WHERE calificacion > 0 AND isbn IN (${marcas})
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

function obtenerEntrada(isbn) {
  const fila = db
    .prepare(
      `SELECT b.isbn, b.estado, b.resena, b.fecha, c.calificacion
       FROM biblioteca b
       LEFT JOIN calificaciones c ON c.user_id = b.user_id AND c.isbn = b.isbn
       WHERE b.user_id = ? AND b.isbn = ?`
    )
    .get(USUARIO_ACTUAL, isbn);

  if (!fila) return null;
  return {
    isbn: fila.isbn,
    estado: fila.estado,
    estrellas: aEstrellas(fila.calificacion),
    resena: fila.resena,
    fecha: fila.fecha
  };
}

function guardarEntrada(isbn, datos) {
  const libro = db.prepare('SELECT isbn FROM libros WHERE isbn = ?').get(isbn);
  if (!libro) throw error(404, 'El libro no existe');

  const actual = obtenerEntrada(isbn);

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
      `INSERT OR REPLACE INTO biblioteca (user_id, isbn, estado, resena, fecha)
       VALUES (?, ?, ?, ?, ?)`
    ).run(USUARIO_ACTUAL, isbn, estado, resena, fecha);

    if (estrellas !== null) {
      db.prepare(
        `INSERT OR REPLACE INTO calificaciones (user_id, isbn, calificacion)
         VALUES (?, ?, ?)`
      ).run(USUARIO_ACTUAL, isbn, estrellas * 2);
    } else if (estado === 'leido') {
      db.prepare(
        `INSERT OR REPLACE INTO calificaciones (user_id, isbn, calificacion)
         VALUES (?, ?, 0)`
      ).run(USUARIO_ACTUAL, isbn);
    } else {
      db.prepare(
        'DELETE FROM calificaciones WHERE user_id = ? AND isbn = ?'
      ).run(USUARIO_ACTUAL, isbn);
    }
  });
  guardar();

  return obtenerEntrada(isbn);
}

function eliminarEntrada(isbn) {
  const borrar = db.transaction(() => {
    db.prepare('DELETE FROM biblioteca WHERE user_id = ? AND isbn = ?').run(
      USUARIO_ACTUAL,
      isbn
    );
    db.prepare('DELETE FROM calificaciones WHERE user_id = ? AND isbn = ?').run(
      USUARIO_ACTUAL,
      isbn
    );
  });
  borrar();
}

function listarBiblioteca() {
  const filas = db
    .prepare(
      `SELECT b.isbn, l.titulo, l.autor, l.imagen, l.categoria,
              b.estado, b.resena, b.fecha, c.calificacion
       FROM biblioteca b
       JOIN libros l ON l.isbn = b.isbn
       LEFT JOIN calificaciones c ON c.user_id = b.user_id AND c.isbn = b.isbn
       WHERE b.user_id = ?
       ORDER BY b.fecha DESC`
    )
    .all(USUARIO_ACTUAL);

  return filas.map((f) => ({
    isbn: f.isbn,
    titulo: f.titulo,
    autor: f.autor,
    imagen: f.imagen,
    categoria: f.categoria,
    estado: f.estado,
    estrellas: aEstrellas(f.calificacion),
    resena: f.resena,
    fecha: f.fecha
  }));
}

function listarResenas(isbn) {
  const filas = db
    .prepare(
      `SELECT b.user_id, b.resena, b.fecha, c.calificacion
       FROM biblioteca b
       LEFT JOIN calificaciones c ON c.user_id = b.user_id AND c.isbn = b.isbn
       WHERE b.isbn = ? AND b.resena IS NOT NULL
       ORDER BY b.fecha DESC
       LIMIT 20`
    )
    .all(isbn);

  return filas.map((f) => ({
    resena: f.resena,
    estrellas: aEstrellas(f.calificacion),
    fecha: f.fecha,
    esMia: f.user_id === USUARIO_ACTUAL
  }));
}

module.exports = {
  obtenerResumenes,
  obtenerEntrada,
  guardarEntrada,
  eliminarEntrada,
  listarBiblioteca,
  listarResenas
};