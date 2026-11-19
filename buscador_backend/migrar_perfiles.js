const path = require('path');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const CORREO_PRUEBA = 'hugobyjavier999@gmail.com';
const NOMBRE_PERFIL = 'Hugo';
const COLOR_PERFIL = '#d98e5f';
const USUARIO_DATASET = 999999;
const COSTO_BCRYPT = 10;

const contrasena = process.argv[2];
if (!contrasena) {
  console.error('Falta la contrasena de la cuenta de prueba.');
  console.error('Uso: node migrar_perfiles.js "<contrasena>"');
  process.exit(1);
}

const db = new Database(path.join(__dirname, 'books.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS cuentas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correo TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL,
    creada TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS perfiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cuenta_id INTEGER NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    color TEXT NOT NULL,
    pin_hash TEXT,
    es_dueno INTEGER NOT NULL DEFAULT 0,
    creado TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sesiones (
    token TEXT PRIMARY KEY,
    cuenta_id INTEGER NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
    perfil_id INTEGER REFERENCES perfiles(id) ON DELETE SET NULL,
    expira TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS perfil_biblioteca (
    perfil_id INTEGER NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    isbn TEXT NOT NULL,
    estado TEXT NOT NULL,
    estrellas INTEGER,
    resena TEXT,
    fecha TEXT NOT NULL,
    PRIMARY KEY (perfil_id, isbn)
  );
`);

function existeTabla(nombre) {
  return (
    db
      .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(nombre) !== undefined
  );
}

function obtenerOCrearCuenta() {
  const existente = db
    .prepare('SELECT id FROM cuentas WHERE correo = ?')
    .get(CORREO_PRUEBA);
  if (existente) return { id: existente.id, creada: false };

  const hash = bcrypt.hashSync(contrasena, COSTO_BCRYPT);
  const resultado = db
    .prepare('INSERT INTO cuentas (correo, hash, creada) VALUES (?, ?, ?)')
    .run(CORREO_PRUEBA, hash, new Date().toISOString());
  return { id: Number(resultado.lastInsertRowid), creada: true };
}

function obtenerOCrearPerfil(cuentaId) {
  const existente = db
    .prepare('SELECT id FROM perfiles WHERE cuenta_id = ? AND nombre = ?')
    .get(cuentaId, NOMBRE_PERFIL);
  if (existente) return { id: existente.id, creado: false };

  const resultado = db
    .prepare(
      `INSERT INTO perfiles (cuenta_id, nombre, color, pin_hash, es_dueno, creado)
       VALUES (?, ?, ?, NULL, 1, ?)`
    )
    .run(cuentaId, NOMBRE_PERFIL, COLOR_PERFIL, new Date().toISOString());
  return { id: Number(resultado.lastInsertRowid), creado: true };
}

function migrarBiblioteca(perfilId) {
  const leidas = db
    .prepare('SELECT COUNT(*) AS total FROM biblioteca WHERE user_id = ?')
    .get(USUARIO_DATASET).total;

  const insertadas = db
    .prepare(
      `INSERT OR IGNORE INTO perfil_biblioteca
         (perfil_id, isbn, estado, estrellas, resena, fecha)
       SELECT ?, b.isbn, b.estado,
              CASE WHEN c.calificacion > 0 THEN c.calificacion / 2 END,
              b.resena, b.fecha
       FROM biblioteca b
       LEFT JOIN calificaciones c ON c.user_id = b.user_id AND c.isbn = b.isbn
       WHERE b.user_id = ?`
    )
    .run(perfilId, USUARIO_DATASET).changes;

  return { leidas, insertadas };
}

const migrar = db.transaction(() => {
  const cuenta = obtenerOCrearCuenta();
  const perfil = obtenerOCrearPerfil(cuenta.id);

  let biblioteca = null;
  if (existeTabla('biblioteca')) {
    biblioteca = migrarBiblioteca(perfil.id);
  }

  return { cuenta, perfil, biblioteca };
});

const { cuenta, perfil, biblioteca } = migrar();

console.log(
  `Cuenta ${CORREO_PRUEBA} (id ${cuenta.id}):`,
  cuenta.creada ? 'creada' : 'ya existia'
);
console.log(
  `Perfil ${NOMBRE_PERFIL} (id ${perfil.id}):`,
  perfil.creado ? 'creado' : 'ya existia'
);

if (biblioteca === null) {
  console.log('La tabla biblioteca no existe: no hay filas que migrar.');
} else {
  console.log('Filas leidas de biblioteca:', biblioteca.leidas);
  console.log('Filas migradas ahora a perfil_biblioteca:', biblioteca.insertadas);
}

const resumen = db
  .prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN estrellas IS NULL THEN 1 ELSE 0 END) AS sin_estrellas
     FROM perfil_biblioteca
     WHERE perfil_id = ?`
  )
  .get(perfil.id);
console.log('Total en perfil_biblioteca del perfil:', resumen.total);
console.log('Sin estrellas:', resumen.sin_estrellas);
