const db = require('../db/conexion');
const categorias = require('../data/categorias');
const diccionarioIdiomas = require('../data/idiomas');
const lematizar = require('../utils/lematizar');
const tokenizar = require('../utils/tokenizar');
const { obtenerResumenes } = require('./calificaciones.service');

const TOLERANCIA_EMPATE = 1e9;
const LOTE_VOTOS = 100;

function encontrarCategoriaPorPalabra(texto) {
  const textoLower = texto.toLowerCase();
  for (const [categoria, palabras] of Object.entries(categorias)) {
    if (palabras.includes(textoLower)) {
      return categoria;
    }
  }
  return null;
}

function obtenerTerminosBusqueda(texto) {
  const textoLower = texto.toLowerCase();
  if (diccionarioIdiomas[textoLower]) {
    return diccionarioIdiomas[textoLower];
  }
  return [texto];
}

function buscarIsbnsPorPrefijo(prefijo) {
  const lema = lematizar(prefijo.toLowerCase());
  const stmt = db.prepare(`
    SELECT DISTINCT isbn FROM indice WHERE palabra LIKE ? LIMIT 50
  `);
  return stmt.all(lema + '%').map((fila) => fila.isbn);
}

function buscarIsbnsPorPalabraExacta(palabra) {
  const lema = lematizar(palabra.toLowerCase());
  const stmt = db.prepare(`
    SELECT DISTINCT isbn FROM indice WHERE palabra = ? LIMIT 50
  `);
  return stmt.all(lema).map((fila) => fila.isbn);
}

function buscarIsbnsPorFrase(frase, esOriginal) {
  const palabras = frase.trim().split(/\s+/).filter((p) => p.length > 0);

  if (palabras.length === 0) {
    return [];
  }

  let conjuntos = palabras.map((palabra) =>
    esOriginal
      ? new Set(buscarIsbnsPorPrefijo(palabra))
      : new Set(buscarIsbnsPorPalabraExacta(palabra))
  );

  let interseccion = conjuntos[0];
  for (let i = 1; i < conjuntos.length; i++) {
    interseccion = new Set([...interseccion].filter((isbn) => conjuntos[i].has(isbn)));
  }

  return [...interseccion];
}

function obtenerLibrosPorIsbns(isbns) {
  if (isbns.length === 0) {
    return [];
  }
  const placeholders = isbns.map(() => '?').join(',');
  const stmt = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE isbn IN (${placeholders})
  `);
  return stmt.all(...isbns);
}

function buscarPorTitulo(texto) {
  const textoLower = texto.toLowerCase();
  const esOriginal = !diccionarioIdiomas[textoLower];
  const terminos = obtenerTerminosBusqueda(texto);

  const isbnsExistentes = new Set();
  let combinados = [];

  for (const termino of terminos) {
    const isbns = buscarIsbnsPorFrase(termino, esOriginal);
    const libros = obtenerLibrosPorIsbns(isbns);

    for (const libro of libros) {
      if (!isbnsExistentes.has(libro.isbn)) {
        isbnsExistentes.add(libro.isbn);
        combinados.push(libro);
      }
    }

    const categoriaEncontrada = encontrarCategoriaPorPalabra(termino);
    if (categoriaEncontrada) {
      const stmtCategoria = db.prepare(`
        SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
        FROM libros
        WHERE categoria = ?
        LIMIT 50
      `);
      const resultadosCategoria = stmtCategoria.all(categoriaEncontrada);
      for (const libro of resultadosCategoria) {
        if (!isbnsExistentes.has(libro.isbn)) {
          isbnsExistentes.add(libro.isbn);
          combinados.push(libro);
        }
      }
    }
  }

  return combinados;
}

function traducirConsulta(texto) {
  const palabras = texto.toLowerCase().split(/\s+/).filter((p) => p.length > 0);
  return palabras
    .flatMap((palabra) => diccionarioIdiomas[palabra] || [palabra])
    .join(' ');
}

function obtenerIdfDeTerminos(terminos) {
  if (terminos.length === 0) {
    return new Map();
  }
  const placeholders = terminos.map(() => '?').join(',');
  const filas = db
    .prepare(`SELECT palabra, idf FROM vsm_idf WHERE palabra IN (${placeholders})`)
    .all(...terminos);
  return new Map(filas.map((fila) => [fila.palabra, fila.idf]));
}

function obtenerNormasPorIsbns(isbns) {
  const normas = new Map();
  const stmt = db.prepare('SELECT norma FROM vsm_norma WHERE isbn = ?');
  for (const isbn of isbns) {
    const fila = stmt.get(isbn);
    if (fila) {
      normas.set(isbn, fila.norma);
    }
  }
  return normas;
}

function obtenerVotosPorIsbn(isbns) {
  const votos = new Map();
  for (let i = 0; i < isbns.length; i += LOTE_VOTOS) {
    const resumenes = obtenerResumenes(isbns.slice(i, i + LOTE_VOTOS));
    for (const [isbn, resumen] of Object.entries(resumenes)) {
      votos.set(isbn, resumen.total);
    }
  }
  return votos;
}

function buscarPorCoseno(texto) {
  const terminos = tokenizar(traducirConsulta(texto));
  const idfs = obtenerIdfDeTerminos(terminos);

  let sumaCuadradosConsulta = 0;
  for (const idf of idfs.values()) {
    sumaCuadradosConsulta += idf * idf;
  }
  const normaConsulta = Math.sqrt(sumaCuadradosConsulta);
  if (normaConsulta === 0) {
    return [];
  }

  const productos = new Map();
  const stmtIsbns = db.prepare('SELECT isbn FROM indice WHERE palabra = ?');
  for (const [palabra, idf] of idfs) {
    for (const { isbn } of stmtIsbns.all(palabra)) {
      productos.set(isbn, (productos.get(isbn) || 0) + idf * idf);
    }
  }

  const normas = obtenerNormasPorIsbns([...productos.keys()]);

  const ranking = [];
  for (const [isbn, producto] of productos) {
    const normaLibro = normas.get(isbn);
    if (!normaLibro) {
      continue;
    }
    ranking.push({ isbn, similitud: producto / (normaLibro * normaConsulta) });
  }
  for (const entrada of ranking) {
    entrada.clave = Math.round(entrada.similitud * TOLERANCIA_EMPATE);
  }
  ranking.sort((a, b) => b.clave - a.clave);
  if (ranking.length === 0) {
    return [];
  }

  const claveDeCorte = ranking[Math.min(49, ranking.length - 1)].clave;
  const candidatos = ranking.filter((r) => r.clave >= claveDeCorte);
  const votos = obtenerVotosPorIsbn(candidatos.map((r) => r.isbn));
  candidatos.sort((a, b) => b.clave - a.clave || votos.get(b.isbn) - votos.get(a.isbn));
  const mejores = candidatos.slice(0, 50);

  const librosPorIsbn = new Map(
    obtenerLibrosPorIsbns(mejores.map((r) => r.isbn)).map((libro) => [libro.isbn, libro])
  );

  return mejores
    .filter((r) => librosPorIsbn.has(r.isbn))
    .map((r) => ({ ...librosPorIsbn.get(r.isbn), similitud: r.similitud }));
}

function buscarPorCategoria(categoria) {
  const stmt = db.prepare(`
    SELECT isbn, titulo, autor, anio, editorial, categoria, imagen
    FROM libros
    WHERE categoria = ?
    LIMIT 50
  `);
  return stmt.all(categoria);
}

module.exports = { buscarPorTitulo, buscarPorCoseno, buscarPorCategoria };