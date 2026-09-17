const Database = require('better-sqlite3');
const categorias = require('./src/data/categorias');

const db = new Database('books.db');

const columnas = db.prepare("PRAGMA table_info(libros)").all();
const yaExisteColumna = columnas.some((col) => col.name === 'categoria');

if (!yaExisteColumna) {
  db.exec("ALTER TABLE libros ADD COLUMN categoria TEXT DEFAULT 'Unclassified'");
  console.log("Columna 'categoria' agregada.");
} else {
  console.log("La columna 'categoria' ya existía, no se vuelve a crear.");
}

function categorizar(titulo) {
  const tituloLower = titulo.toLowerCase();
  for (const [categoria, palabras] of Object.entries(categorias)) {
    if (palabras.some((palabra) => tituloLower.includes(palabra))) {
      return categoria;
    }
  }
  return "Unclassified";
}

const libros = db.prepare("SELECT isbn, titulo FROM libros").all();
console.log(`Clasificando ${libros.length} libros...`);

const actualizar = db.prepare("UPDATE libros SET categoria = ? WHERE isbn = ?");

const actualizarTodos = db.transaction((libros) => {
  for (const libro of libros) {
    const categoria = categorizar(libro.titulo || '');
    actualizar.run(categoria, libro.isbn);
  }
});

actualizarTodos(libros);

console.log("¡Listo! Todos los libros fueron clasificados.");

const resumen = db.prepare("SELECT categoria, COUNT(*) as total FROM libros GROUP BY categoria ORDER BY total DESC").all();
console.log("\nResumen por categoría:");
resumen.forEach((fila) => console.log(`  ${fila.categoria}: ${fila.total}`));