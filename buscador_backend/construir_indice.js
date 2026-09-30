const Database = require('better-sqlite3');

const db = new Database('books.db');

db.exec("DROP TABLE IF EXISTS indice");
db.exec("CREATE TABLE indice (palabra TEXT, isbn TEXT)");

const libros = db.prepare("SELECT isbn, titulo FROM libros").all();
console.log(`Indexando ${libros.length} libros...`);

const insertar = db.prepare("INSERT INTO indice (palabra, isbn) VALUES (?, ?)");

function tokenizar(titulo) {
  const limpio = titulo.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const palabras = limpio.split(/\s+/).filter((p) => p.length > 0);
  return [...new Set(palabras)];
}

const indexarTodos = db.transaction((libros) => {
  for (const libro of libros) {
    const palabras = tokenizar(libro.titulo || '');
    for (const palabra of palabras) {
      insertar.run(palabra, libro.isbn);
    }
  }
});

indexarTodos(libros);

db.exec("CREATE INDEX idx_palabra ON indice(palabra)");

console.log("¡Listo! Índice construido.");

const totalPalabras = db.prepare("SELECT COUNT(DISTINCT palabra) as total FROM indice").get();
console.log(`Palabras únicas en el vocabulario: ${totalPalabras.total}`);