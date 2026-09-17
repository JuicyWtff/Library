const fs = require('fs');
const csv = require('csv-parser');
const Database = require('better-sqlite3');

const db = new Database('books.db');

const columnas = db.prepare("PRAGMA table_info(libros)").all();
const yaExisteColumna = columnas.some((col) => col.name === 'imagen');

if (!yaExisteColumna) {
  db.exec("ALTER TABLE libros ADD COLUMN imagen TEXT");
  console.log("Columna 'imagen' agregada.");
} else {
  console.log("La columna 'imagen' ya existía, no se vuelve a crear.");
}

const actualizar = db.prepare("UPDATE libros SET imagen = ? WHERE isbn = ?");

let contador = 0;
const filasParaActualizar = [];

const actualizarTodos = db.transaction((filas) => {
  for (const fila of filas) {
    actualizar.run(fila.imagen, fila.isbn);
  }
});

fs.createReadStream('data/Books.csv')
  .pipe(csv())
  .on('data', (row) => {
    filasParaActualizar.push({
      isbn: row['ISBN'],
      imagen: row['Image-URL-M']
    });
    contador++;
  })
  .on('end', () => {
    console.log(`Leídas ${contador} filas. Actualizando portadas...`);
    actualizarTodos(filasParaActualizar);
    console.log("¡Listo! Portadas agregadas.");
  });