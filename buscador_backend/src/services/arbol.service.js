const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', '..', 'books.db'));

const SIN_CLASIFICAR = 'Unclassified';

class Nodo {
  constructor(tipo, nombre) {
    this.tipo = tipo;
    this.nombre = nombre;
    this.hijos = new Map();
    this.isbns = [];
    this.desconocido = false;
  }
}

class ArbolLibros {
  constructor() {
    this.raiz = new Nodo('raiz', 'Catalogo');
    this.ubicaciones = new Map();
  }

  insertar(isbn, genero, autor, titulo) {
    let nodoGenero = this.raiz.hijos.get(genero);
    if (!nodoGenero) {
      nodoGenero = new Nodo('genero', genero);
      this.raiz.hijos.set(genero, nodoGenero);
    }

    const clave = claveAutor(autor);
    const claveNodo = clave || '#desconocido';
    let nodoAutor = nodoGenero.hijos.get(claveNodo);
    if (!nodoAutor) {
      nodoAutor = new Nodo('autor', clave ? autor : 'Desconocido');
      nodoAutor.desconocido = !clave;
      nodoGenero.hijos.set(claveNodo, nodoAutor);
    }

    nodoAutor.isbns.push(isbn);
    this.ubicaciones.set(isbn, {
      genero: nodoGenero,
      autor: nodoAutor,
      clave: claveTitulo(titulo)
    });
  }

  ubicar(isbn) {
    return this.ubicaciones.get(isbn) || null;
  }

  librosDeGenero(nodoGenero) {
    const todos = [];
    for (const nodoAutor of nodoGenero.hijos.values()) {
      for (const isbn of nodoAutor.isbns) {
        todos.push(isbn);
      }
    }
    return todos;
  }

  describir(destacados) {
    const generos = [];
    for (const nodoGenero of this.raiz.hijos.values()) {
      const autores = [...nodoGenero.hijos.values()].filter((a) => !a.desconocido);
      autores.sort((a, b) => b.isbns.length - a.isbns.length);
      let libros = 0;
      for (const nodoAutor of nodoGenero.hijos.values()) {
        libros += nodoAutor.isbns.length;
      }
      generos.push({
        genero: nodoGenero.nombre,
        libros,
        autores: autores.length,
        autoresConMasLibros: autores
          .slice(0, destacados)
          .map((a) => ({ autor: a.nombre, libros: a.isbns.length }))
      });
    }
    generos.sort((a, b) => b.libros - a.libros);
    return generos;
  }
}

function claveTitulo(titulo) {
  if (!titulo) return '';
  return titulo
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9]/g, '');
}

function claveAutor(autor) {
  if (!autor) return '';
  return autor.toLowerCase().replace(/[^a-z0-9]/g, '');
}

let arbol = null;

function obtenerArbol() {
  if (arbol) return arbol;
  const nuevo = new ArbolLibros();
  const filas = db.prepare('SELECT isbn, titulo, autor, categoria FROM libros').iterate();
  for (const fila of filas) {
    nuevo.insertar(fila.isbn, fila.categoria || SIN_CLASIFICAR, fila.autor, fila.titulo);
  }
  arbol = nuevo;
  return arbol;
}

function describirArbol() {
  return { generos: obtenerArbol().describir(5) };
}

module.exports = { obtenerArbol, describirArbol, claveTitulo, SIN_CLASIFICAR };