const fs = require('fs');
const csv = require('csv-parser');
const Database = require('better-sqlite3');

const db = new Database('books.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS libros (
    isbn TEXT PRIMARY KEY,
    titulo TEXT,
    autor TEXT,
    anio TEXT,
    editorial TEXT,
    imagen_s TEXT,
    imagen_m TEXT,
    imagen_l TEXT
  )
`);

const insertar = db.prepare(`
  INSERT OR IGNORE INTO libros (isbn, titulo, autor, anio, editorial, imagen_s, imagen_m, imagen_l)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let contador = 0;

const insertarMuchos = db.transaction((filas)=>{
    for(const fila of filas){
        insertar.run(fila.isbn, fila.tittle, fila.author, fila.year, fila.publisher, fila.imgurls, fila.imgurlm, fila.imgurll);
    }
});

const filasParaInsertar = [];

fs.createReadStream('data/Books.csv')
  .pipe(csv())
  .on('data', (row) => {
    filasParaInsertar.push({
      isbn: row['ISBN'],
      tittle: row['Book-Title'],
      author: row['Book-Author'],
      year: row['Year-Of-Publication'],
      publisher: row['Publisher'],
      imgurls: row['Image-URL-S'],
      imgurlm: row['Image-URL-M'],
      imgurll: row['Image-URL-L'],
    });
    contador++;
  })
  .on('end', () => {
    console.log(`Leídas ${contador} filas del CSV. Insertando en la base de datos...`);
    insertarMuchos(filasParaInsertar);
    console.log('¡Listo! Datos cargados en database.db');

    // Creamos un índice para que las búsquedas por título sean rápidas
    db.exec('CREATE INDEX IF NOT EXISTS idx_titulo ON libros(titulo)');
    console.log('Índice creado.');
  });