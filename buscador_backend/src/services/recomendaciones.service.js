const path = require('path');
const Database = require('better-sqlite3');
const { USUARIO_PRUEBA_MIGRADO } = require('../data/usuarioPruebaMigrado');
const tokenizar = require('../utils/tokenizar');
const { obtenerArbol, SIN_CLASIFICAR } = require('./arbol.service');
const { obtenerFichas } = require('./explorar.service');
const { obtenerVotosPorIsbn } = require('./libros.service');

const db = new Database(path.join(__dirname, '..', '..', 'books.db'));

const LIMITE_FILA = 20;
const MIN_LIBROS_FILA = 3;
const MAX_SEMILLAS = 3;
const ESTRELLAS_ME_GUSTO = 4;
const CALIFICACION_AFIN = 7;
const ESTRELLAS_SIN_NOTA = 3;
const PUNTO_NEUTRO = 2.5;
const TERMINOS_CONSULTA = 30;
const TERMINOS_DETALLE = 5;
const MIN_LEIDOS_PARA_TI = 3;
const VENTANA_CANDIDATOS = LIMITE_FILA * 5;
const TOLERANCIA_EMPATE = 1e9;
const TAMANO_LOTE = 500;
const IDF_MINIMO_ENTRADA = 4.69;
const SOLO_DIGITOS = /^\d+$/;

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

const consultaIdf = db.prepare('SELECT idf FROM vsm_idf WHERE palabra = ?');
const consultaIsbnsDePalabra = db.prepare('SELECT isbn FROM indice WHERE palabra = ?');

function leerBiblioteca(perfilId) {
  return consultaBiblioteca.all(perfilId);
}

function esLeido(fila) {
  return fila.estado === 'leido';
}

function enLotes(lista) {
  const lotes = [];
  for (let i = 0; i < lista.length; i += TAMANO_LOTE) {
    lotes.push(lista.slice(i, i + TAMANO_LOTE));
  }
  return lotes;
}

function obtenerIdf(palabra) {
  const fila = consultaIdf.get(palabra);
  return fila ? fila.idf : null;
}

function vectorDeLeidos(leidos) {
  const vector = new Map();
  for (const libro of leidos) {
    const estrellas = libro.estrellas === null ? ESTRELLAS_SIN_NOTA : libro.estrellas;
    const peso = estrellas - PUNTO_NEUTRO;
    for (const palabra of tokenizar(libro.titulo || '')) {
      if (SOLO_DIGITOS.test(palabra)) continue;
      const idf = obtenerIdf(palabra);
      if (idf === null) continue;
      vector.set(palabra, (vector.get(palabra) || 0) + peso * idf);
    }
  }
  return vector;
}

function construirVectorPerfil(perfilId) {
  return vectorDeLeidos(leerBiblioteca(perfilId).filter(esLeido));
}

function terminosDeMayorPeso(vector, cantidad) {
  return [...vector]
    .filter(([, peso]) => peso > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, cantidad);
}

function normaDelVector(vector) {
  let suma = 0;
  for (const peso of vector.values()) {
    suma += peso * peso;
  }
  return Math.sqrt(suma);
}

function terminosDeEntrada(vector) {
  return terminosDeMayorPeso(vector, vector.size)
    .filter(([palabra]) => obtenerIdf(palabra) >= IDF_MINIMO_ENTRADA)
    .slice(0, TERMINOS_CONSULTA);
}

function reunirCandidatos(vector) {
  const candidatos = new Set();
  for (const [palabra] of terminosDeEntrada(vector)) {
    for (const { isbn } of consultaIsbnsDePalabra.all(palabra)) {
      candidatos.add(isbn);
    }
  }
  return [...candidatos];
}

function leerTitulosYNormas(isbns) {
  const filas = [];
  for (const lote of enLotes(isbns)) {
    const marcas = lote.map(() => '?').join(',');
    filas.push(
      ...db
        .prepare(
          `SELECT l.isbn, l.titulo, n.norma
           FROM libros l
           JOIN vsm_norma n ON n.isbn = l.isbn
           WHERE l.isbn IN (${marcas})`
        )
        .all(...lote)
    );
  }
  return filas;
}

function calcularSimilitudes(vector) {
  const similitudes = new Map();
  const normaVector = normaDelVector(vector);
  if (normaVector === 0) {
    return { similitudes, totalCandidatos: 0 };
  }

  const candidatos = reunirCandidatos(vector);
  const idfs = new Map();

  for (const { isbn, titulo, norma } of leerTitulosYNormas(candidatos)) {
    let producto = 0;
    for (const palabra of tokenizar(titulo || '')) {
      const peso = vector.get(palabra);
      if (peso === undefined) continue;
      if (!idfs.has(palabra)) {
        idfs.set(palabra, obtenerIdf(palabra));
      }
      producto += idfs.get(palabra) * peso;
    }
    if (producto > 0) {
      similitudes.set(isbn, producto / (norma * normaVector));
    }
  }

  return { similitudes, totalCandidatos: candidatos.length };
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

function ordenarPorSimilitud(isbns, similitudes) {
  return isbns.slice().sort((a, b) => (similitudes.get(b) || 0) - (similitudes.get(a) || 0));
}

function elegirMejores(similitudes, biblioteca, arbol) {
  const enBiblioteca = new Set(biblioteca.map((fila) => fila.isbn));
  const clavesBiblioteca = clavesDe(enBiblioteca, arbol);

  const ranking = [];
  for (const [isbn, similitud] of similitudes) {
    if (esRepetido(isbn, enBiblioteca, clavesBiblioteca, arbol)) continue;
    const ubicacion = arbol.ubicar(isbn);
    ranking.push({
      isbn,
      similitud,
      clave: Math.round(similitud * TOLERANCIA_EMPATE),
      claveTitulo: ubicacion ? ubicacion.clave : ''
    });
  }
  if (ranking.length === 0) return [];

  ranking.sort((a, b) => b.clave - a.clave);
  const claveDeCorte = ranking[Math.min(VENTANA_CANDIDATOS - 1, ranking.length - 1)].clave;
  const ventana = ranking.filter((r) => r.clave >= claveDeCorte);
  const votos = obtenerVotosPorIsbn(ventana.map((r) => r.isbn));
  ventana.sort((a, b) => b.clave - a.clave || votos.get(b.isbn) - votos.get(a.isbn));

  const mejores = [];
  const titulosVistos = new Set();
  for (const entrada of ventana) {
    if (mejores.length >= LIMITE_FILA) break;
    if (entrada.claveTitulo && titulosVistos.has(entrada.claveTitulo)) continue;
    if (entrada.claveTitulo) {
      titulosVistos.add(entrada.claveTitulo);
    }
    mejores.push({ isbn: entrada.isbn, similitud: entrada.similitud });
  }
  return mejores;
}

function recomendarPorCoseno(perfilId) {
  const biblioteca = leerBiblioteca(perfilId);
  const vector = vectorDeLeidos(biblioteca.filter(esLeido));
  const { similitudes } = calcularSimilitudes(vector);
  return elegirMejores(similitudes, biblioteca, obtenerArbol());
}

function recomendarDesdeLibro(semilla, excluidos, arbol, similitudes, ordenados) {
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
    agregar(ordenarPorSimilitud(ubicacion.autor.isbns, similitudes), `Rama del autor: ${ubicacion.autor.nombre}`);
  }

  agregar(consultaAfines.all(semilla.isbn).map((fila) => fila.isbn), 'Lectores afines');

  if (ubicacion && ubicacion.genero.nombre !== SIN_CLASIFICAR) {
    const delGenero = ordenados.filter((isbn) => {
      const otra = arbol.ubicar(isbn);
      return otra !== null && otra.genero === ubicacion.genero;
    });
    agregar(delGenero, `Género ${ubicacion.genero.nombre}`);
  }

  return { lista, pasos };
}

function elegirSemillas(leidos) {
  const conNota = leidos.filter((l) => l.estrellas !== null && l.estrellas >= ESTRELLAS_ME_GUSTO);
  const base = conNota.length > 0 ? conNota : leidos;
  return base.slice(0, MAX_SEMILLAS);
}

function recomendarPorGenero(leidos, excluidos, arbol, ordenados) {
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
  for (const isbn of ordenados) {
    if (candidatos.length >= LIMITE_FILA) break;
    const ubicacion = arbol.ubicar(isbn);
    if (!ubicacion || ubicacion.genero !== nodo) continue;
    if (esRepetido(isbn, vistos, clavesVistas, arbol)) continue;
    candidatos.push(isbn);
    if (ubicacion.clave) {
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

function armarFilaParaTi(vector, mejores) {
  const similitudPorIsbn = new Map(mejores.map((m) => [m.isbn, m.similitud]));
  const fichas = obtenerFichas(mejores.map((m) => m.isbn)).map((ficha) => ({
    ...ficha,
    similitud: Math.round(similitudPorIsbn.get(ficha.isbn) * 1000) / 1000
  }));
  const terminos = terminosDeMayorPeso(vector, TERMINOS_DETALLE).map(([palabra]) => palabra);
  return {
    id: 'para-ti',
    titulo: 'Para ti',
    detalle: `Términos de mayor peso en tu perfil: ${terminos.join(', ')}`,
    libros: fichas
  };
}

function obtenerParaTi(perfilId) {
  const biblioteca = leerBiblioteca(perfilId);
  if (biblioteca.length === 0) {
    return { secciones: [] };
  }

  const arbol = obtenerArbol();
  const excluidos = new Set(biblioteca.map((fila) => fila.isbn));
  const leidos = biblioteca.filter(esLeido);
  const vector = vectorDeLeidos(leidos);
  const { similitudes } = calcularSimilitudes(vector);
  const ordenados = ordenarPorSimilitud([...similitudes.keys()], similitudes);
  const secciones = [];

  if (leidos.length >= MIN_LEIDOS_PARA_TI) {
    const mejores = elegirMejores(similitudes, biblioteca, arbol);
    if (mejores.length >= MIN_LIBROS_FILA) {
      secciones.push(armarFilaParaTi(vector, mejores));
    }
  }

  const leyendo = biblioteca.filter((fila) => fila.estado === 'leyendo');
  if (leyendo.length > 0) {
    secciones.push({
      id: 'leyendo',
      titulo: 'Sigue leyendo',
      detalle: null,
      libros: obtenerFichas(leyendo.map((fila) => fila.isbn))
    });
  }

  for (const semilla of elegirSemillas(leidos)) {
    const { lista, pasos } = recomendarDesdeLibro(semilla, excluidos, arbol, similitudes, ordenados);
    if (lista.length >= MIN_LIBROS_FILA) {
      secciones.push({
        id: `semilla-${semilla.isbn}`,
        titulo: `Porque leíste ${semilla.titulo}`,
        detalle: pasos.join(' → '),
        libros: obtenerFichas(lista)
      });
    }
  }

  const porGenero = recomendarPorGenero(leidos, excluidos, arbol, ordenados);
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

module.exports = {
  obtenerParaTi,
  construirVectorPerfil,
  recomendarPorCoseno,
  calcularSimilitudes,
  terminosDeMayorPeso
};
