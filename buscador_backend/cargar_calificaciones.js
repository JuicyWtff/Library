const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');

const db = new Database('books.db');

db.exec(`
  DROP TABLE IF EXISTS calificaciones;
  DROP TABLE IF EXISTS usuarios;
  CREATE TABLE usuarios (
    user_id INTEGER PRIMARY KEY,
    ubicacion TEXT,
    edad INTEGER
  );
  CREATE TABLE calificaciones (
    user_id INTEGER,
    isbn TEXT,
    calificacion INTEGER,
    PRIMARY KEY (user_id, isbn)
  );
`);

const isbnsValidos = new Set(
  db.prepare('SELECT isbn FROM libros').all().map((fila) => fila.isbn)
);

const insertarUsuario = db.prepare(
  'INSERT OR IGNORE INTO usuarios (user_id, ubicacion, edad) VALUES (?, ?, ?)'
);
const insertarCalificacion = db.prepare(
  'INSERT OR IGNORE INTO calificaciones (user_id, isbn, calificacion) VALUES (?, ?, ?)'
);

function limpiar(texto) {
  return texto.trim().replace(/^"/, '').replace(/"$/, '');
}

async function leerLineas(archivo, alLinea) {
  const lector = readline.createInterface({
    input: fs.createReadStream(path.join('data', archivo), 'utf8'),
    crlfDelay: Infinity
  });
  let primera = true;
  for await (const linea of lector) {
    if (primera) {
      primera = false;
      continue;
    }
    if (linea.trim().length === 0) continue;
    alLinea(linea.split(';'));
  }
}

async function cargarUsuarios() {
  const filas = [];
  await leerLineas('users.csv', (partes) => {
    if (partes.length < 3) return;
    const id = parseInt(limpiar(partes[0]), 10);
    if (Number.isNaN(id)) return;
    const ubicacion = limpiar(partes.slice(1, -1).join(';'));
    const edad = parseInt(limpiar(partes[partes.length - 1]), 10);
    filas.push([id, ubicacion || null, Number.isNaN(edad) ? null : edad]);
  });
  const insertar = db.transaction((lote) => {
    for (const f of lote) insertarUsuario.run(f[0], f[1], f[2]);
  });
  insertar(filas);
  return filas.length;
}

async function cargarCalificaciones() {
  const filas = [];
  let descartadas = 0;
  await leerLineas('ratings.csv', (partes) => {
    if (partes.length < 3) {
      descartadas++;
      return;
    }
    const id = parseInt(limpiar(partes[0]), 10);
    const isbn = limpiar(partes.slice(1, -1).join(';'));
    const nota = parseInt(limpiar(partes[partes.length - 1]), 10);
    if (Number.isNaN(id) || Number.isNaN(nota) || !isbnsValidos.has(isbn)) {
      descartadas++;
      return;
    }
    filas.push([id, isbn, nota]);
  });
  const insertar = db.transaction((lote) => {
    for (const f of lote) insertarCalificacion.run(f[0], f[1], f[2]);
  });
  insertar(filas);
  return { guardadas: filas.length, descartadas };
}

async function main() {
  const usuarios = await cargarUsuarios();
  console.log('Usuarios leidos:', usuarios);

  const { guardadas, descartadas } = await cargarCalificaciones();
  console.log('Calificaciones guardadas:', guardadas);
  console.log('Calificaciones descartadas (ISBN que no esta en libros):', descartadas);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_calif_usuario ON calificaciones(user_id);
    CREATE INDEX IF NOT EXISTS idx_calif_isbn ON calificaciones(isbn);
  `);

  const resumen = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN calificacion = 0 THEN 1 ELSE 0 END) AS sin_calificar,
         COUNT(DISTINCT user_id) AS usuarios,
         COUNT(DISTINCT isbn) AS libros
       FROM calificaciones`
    )
    .get();
  console.log('Resumen:', resumen);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});