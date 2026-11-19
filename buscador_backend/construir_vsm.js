const Database = require('better-sqlite3');

const db = new Database('books.db');

const totalLibros = db.prepare("SELECT COUNT(*) AS total FROM libros").get().total;
console.log(`Total de libros (N): ${totalLibros}`);

const construir = db.transaction(() => {
  db.exec("DROP TABLE IF EXISTS vsm_idf");
  db.exec("DROP TABLE IF EXISTS vsm_norma");
  db.exec("CREATE TABLE vsm_idf (palabra TEXT PRIMARY KEY, idf REAL NOT NULL)");
  db.exec("CREATE TABLE vsm_norma (isbn TEXT PRIMARY KEY, norma REAL NOT NULL)");

  db.prepare(`
    INSERT INTO vsm_idf (palabra, idf)
    SELECT palabra, ln(? * 1.0 / COUNT(DISTINCT isbn))
    FROM indice
    GROUP BY palabra
  `).run(totalLibros);

  db.exec(`
    INSERT INTO vsm_norma (isbn, norma)
    SELECT i.isbn, sqrt(SUM(v.idf * v.idf))
    FROM indice i
    JOIN vsm_idf v ON v.palabra = i.palabra
    GROUP BY i.isbn
  `);
});

construir();

const totalPalabras = db.prepare("SELECT COUNT(*) AS total FROM vsm_idf").get().total;
const totalNormas = db.prepare("SELECT COUNT(*) AS total FROM vsm_norma").get().total;
console.log(`Palabras en vsm_idf: ${totalPalabras}`);
console.log(`Libros en vsm_norma: ${totalNormas}`);

console.log("\n10 términos con idf más bajo:");
for (const fila of db.prepare("SELECT palabra, idf FROM vsm_idf ORDER BY idf ASC, palabra LIMIT 10").all()) {
  console.log(`  ${fila.palabra.padEnd(15)} ${fila.idf.toFixed(4)}`);
}

console.log("\n10 términos con idf más alto:");
for (const fila of db.prepare("SELECT palabra, idf FROM vsm_idf ORDER BY idf DESC, palabra LIMIT 10").all()) {
  console.log(`  ${fila.palabra.padEnd(15)} ${fila.idf.toFixed(4)}`);
}
