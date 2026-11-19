const path = require('path');
const Database = require('better-sqlite3');
const { USUARIO_PRUEBA_MIGRADO } = require('../data/usuarioPruebaMigrado');
const { obtenerArbol, SIN_CLASIFICAR } = require('./arbol.service');
const { obtenerPuntajes, obtenerFichas } = require('./explorar.service');

const db = new Database(path.join(__dirname, '..', '..', 'books.db'));

const LIMITE_FILA = 20;
const MIN_LIBROS_FILA = 3;
const MAX_SEMILLAS = 3;
const ESTRELLAS_ME_GUSTO = 4;
const CALIFICACION_AFIN = 7;
const ESTRELLAS_SIN_NOTA = 3;

const consultaAfines = db.prepare(
  `SELECT c2.isbn AS isbn
   FROM calificaciones c1
   JOIN calificaciones c2 ON c2.user_id = c1.user_id AND c2.isbn != c1.isbn
   WHERE c1.isbn = ?
     AND c1.user_id != ${USUARIO_PRUEBA_MIGRADO}
     AND c2.user_id != ${USUARIO_PRUEBA_MIGRADO}
     AND c1.calificacion >= ${CALIFICACION_AFIN}
     AND c2.calificacion >= ${CALIFICACION_AFIN}
   GROUP BY c2.isbn
   ORDER BY COUNT(*) DESC
   LIMIT 60`
);

const consultaBiblioteca = db.prepare(
  `SELECT b.isbn, b.estado, b.estrellas, l.titulo
   FROM perfil_biblioteca b
   JOIN libros l ON l.isbn = b.isbn
   WHERE b.perfil_id = ?
   ORDER BY b.fecha DESC`
);

function leerBiblioteca(perfilId) {
  return consultaBiblioteca.all(perfilId);
}

function ordenarPorPuntaje(isbns, puntajes) {
  return isbns.slice().sort((a, b) => (puntajes.get(b) || 0) - (puntajes.get(a) || 0));
}

function clavesDe(isbns, arbol) {
  const claves = new Set();
  for (const isbn of isbns) {
    const ubicacion = arbol.ubicar(isbn);
    if (ubicacion && ubicacion.clave) {
      claves.add(ubicacion.clave);
    }
  }
  return claves;
}

function esRepetido(isbn, vistos, clavesVistas, arbol) {
  if (vistos.has(isbn)) return true;
  const ubicacion = arbol.ubicar(isbn);
  return Boolean(ubicacion && ubicacion.clave && clavesVistas.has(ubicacion.clave));
}

function recomendarDesdeLibro(semilla, excluidos, arbol, puntajes) {
  const vistos = new Set(excluidos);
  vistos.add(semilla.isbn);
  const clavesVistas = clavesDe(vistos, arbol);
  const lista = [];
  const pasos = [];

  function agregar(isbns, etiqueta) {
    let agregados = 0;
    for (const isbn of isbns) {
      if (lista.length >= LIMITE_FILA) break;
      if (esRepetido(isbn, vistos, clavesVistas, arbol)) continue;
      vistos.add(isbn);
      const ubicacion = arbol.ubicar(isbn);
      if (ubicacion && ubicacion.clave) {
        clavesVistas.add(ubicacion.clave);
      }
      lista.push(isbn);
      agregados += 1;
    }
    if (agregados > 0) {
      pasos.push(`${etiqueta} (${agregados})`);
    }
  }

  const ubicacion = arbol.ubicar(semilla.isbn);

  if (ubicacion && !ubicacion.autor.desconocido) {
    agregar(ordenarPorPuntaje(ubicacion.autor.isbns, puntajes), `Rama del autor: ${ubicacion.autor.nombre}`);
  }

  agregar(consultaAfines.all(semilla.isbn).map((fila) => fila.isbn), 'Lectores afines');

  if (ubicacion && ubicacion.genero.nombre !== SIN_CLASIFICAR) {
    const delGenero = arbol.librosDeGenero(ubicacion.genero);
    agregar(ordenarPorPuntaje(delGenero, puntajes), `Género ${ubicacion.genero.nombre}`);
  }

  return { lista, pasos };
}

function elegirSemillas(leidos) {
  const conNota = leidos.filter((l) => l.estrellas !== null && l.estrellas >= ESTRELLAS_ME_GUSTO);
  const base = conNota.length > 0 ? conNota : leidos;
  return base.slice(0, MAX_SEMILLAS);
}

function recomendarPorGenero(leidos, excluidos, arbol, puntajes) {
  const pesos = new Map();
  const conteos = new Map();

  for (const libro of leidos) {
    const ubicacion = arbol.ubicar(libro.isbn);
    if (!ubicacion || ubicacion.genero.nombre === SIN_CLASIFICAR) continue;
    const peso = libro.estrellas === null ? ESTRELLAS_SIN_NOTA : libro.estrellas;
    if (peso < ESTRELLAS_SIN_NOTA) continue;
    const nombre = ubicacion.genero.nombre;
    pesos.set(nombre, (pesos.get(nombre) || 0) + peso);
    conteos.set(nombre, (conteos.get(nombre) || 0) + 1);
  }

  if (pesos.size === 0) return null;

  let mejor = null;
  for (const [nombre, peso] of pesos) {
    if (mejor === null || peso > pesos.get(mejor)) {
      mejor = nombre;
    }
  }

  const nodo = arbol.raiz.hijos.get(mejor);
  const vistos = new Set(excluidos);
  const clavesVistas = clavesDe(vistos, arbol);
  const candidatos = [];
  for (const isbn of ordenarPorPuntaje(arbol.librosDeGenero(nodo), puntajes)) {
    if (candidatos.length >= LIMITE_FILA) break;
    if (esRepetido(isbn, vistos, clavesVistas, arbol)) continue;
    candidatos.push(isbn);
    const ubicacion = arbol.ubicar(isbn);
    if (ubicacion && ubicacion.clave) {
      clavesVistas.add(ubicacion.clave);
    }
  }

  if (candidatos.length < MIN_LIBROS_FILA) return null;

  return {
    id: `genero-${mejor}`,
    titulo: `Porque te gusta ${mejor}`,
    detalle: `Tus lecturas en ${mejor}: ${conteos.get(mejor)}`,
    libros: obtenerFichas(candidatos)
  };
}

function obtenerParaTi(perfilId) {
  const biblioteca = leerBiblioteca(perfilId);
  if (biblioteca.length === 0) {
    return { secciones: [] };
  }

  const arbol = obtenerArbol();
  const puntajes = obtenerPuntajes();
  const excluidos = new Set(biblioteca.map((fila) => fila.isbn));
  const secciones = [];

  const leyendo = biblioteca.filter((fila) => fila.estado === 'leyendo');
  if (leyendo.length > 0) {
    secciones.push({
      id: 'leyendo',
      titulo: 'Sigue leyendo',
      detalle: null,
      libros: obtenerFichas(leyendo.map((fila) => fila.isbn))
    });
  }

  const leidos = biblioteca.filter((fila) => fila.estado === 'leido');

  for (const semilla of elegirSemillas(leidos)) {
    const { lista, pasos } = recomendarDesdeLibro(semilla, excluidos, arbol, puntajes);
    if (lista.length >= MIN_LIBROS_FILA) {
      secciones.push({
        id: `semilla-${semilla.isbn}`,
        titulo: `Porque leíste ${semilla.titulo}`,
        detalle: pasos.join(' → '),
        libros: obtenerFichas(lista)
      });
    }
  }

  const porGenero = recomendarPorGenero(leidos, excluidos, arbol, puntajes);
  if (porGenero) {
    secciones.push(porGenero);
  }

  const pendientes = biblioteca.filter((fila) => fila.estado === 'pendiente');
  if (pendientes.length > 0) {
    secciones.push({
      id: 'pendiente',
      titulo: 'Tu lista',
      detalle: null,
      libros: obtenerFichas(pendientes.map((fila) => fila.isbn))
    });
  }

  return { secciones };
}

module.exports = { obtenerParaTi };