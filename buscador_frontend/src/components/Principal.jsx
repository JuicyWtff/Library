import { useRef, useState } from 'react';
import Explorar from './Explorar';
import Buscador from './Buscador';
import ListaResultados from './ListaResultados';
import EsqueletoLibros from './EsqueletoLibros';
import Biblioteca from './Biblioteca';
import Estadisticas from './Estadisticas';
import CabeceraPerfil from './CabeceraPerfil';
import {
  buscarLibros,
  buscarPorRelevancia,
  buscarPorCategoria
} from '../services/librosApi';

function Principal() {
  const [pestana, setPestana] = useState('explorar');
  const [texto, setTexto] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [modo, setModo] = useState('prefijo');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const solicitud = useRef(0);

  const busquedaActiva = texto.trim() !== '' || categoriaActiva !== null;
  const porRelevancia = modo === 'relevancia' && categoriaActiva === null;

  async function ejecutar(consulta) {
    solicitud.current += 1;
    const id = solicitud.current;
    setCargando(true);
    setError('');
    try {
      const datos = await consulta();
      if (id !== solicitud.current) return;
      setResultados(datos);
    } catch {
      if (id !== solicitud.current) return;
      setResultados([]);
      setError('No se pudo completar la búsqueda. Revisa que el servidor esté en marcha e inténtalo de nuevo.');
    }
    setCargando(false);
  }

  function limpiar() {
    solicitud.current += 1;
    setTexto('');
    setCategoriaActiva(null);
    setModo('prefijo');
    setResultados([]);
    setCargando(false);
    setError('');
  }

  function cambiarTexto(valor) {
    setTexto(valor);
    setCategoriaActiva(null);
    setModo('prefijo');
    if (valor.trim() === '') {
      limpiar();
      setTexto(valor);
      return;
    }
    ejecutar(() => buscarLibros(encodeURIComponent(valor)));
  }

  function buscarConEnter() {
    const consulta = texto.trim();
    if (consulta === '') return;
    setCategoriaActiva(null);
    setModo('relevancia');
    ejecutar(() => buscarPorRelevancia(encodeURIComponent(consulta)));
  }

  function cambiarCategoria(categoria) {
    if (categoria === categoriaActiva) {
      limpiar();
      return;
    }
    setTexto('');
    setModo('prefijo');
    setCategoriaActiva(categoria);
    ejecutar(() => buscarPorCategoria(encodeURIComponent(categoria)));
  }

  function irAPestana(nombre) {
    limpiar();
    setPestana(nombre);
  }

  const pestanas = [
    { id: 'explorar', texto: 'Explorar' },
    { id: 'biblioteca', texto: 'Mi biblioteca' },
    { id: 'estadisticas', texto: 'Estadísticas' }
  ];

  const sinResultados = !cargando && !error && resultados.length === 0;

  return (
    <div className="contenedor-principal">
      <CabeceraPerfil />
      <h1 className="titulo-books">BOOKS</h1>

      <Buscador
        texto={texto}
        categoriaActiva={categoriaActiva}
        onTexto={cambiarTexto}
        onBuscar={buscarConEnter}
        onCategoria={cambiarCategoria}
        onLimpiar={limpiar}
      />

      <div className="pestanas">
        {pestanas.map((p) => (
          <button
            key={p.id}
            className={`pestana ${!busquedaActiva && pestana === p.id ? 'activa' : ''}`}
            onClick={() => irAPestana(p.id)}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {busquedaActiva && (
        <section aria-live="polite">
          <div className="cabecera-resultados">
            <h2 className="encabezado-resultados">
              {categoriaActiva ? categoriaActiva : `Resultados para “${texto.trim()}”`}{' '}
              {!cargando && resultados.length > 0 && <span>({resultados.length})</span>}
            </h2>
            {!categoriaActiva && (
              <p className={`modo-busqueda ${porRelevancia ? 'relevancia' : ''}`}>
                {porRelevancia
                  ? 'Ordenados por relevancia (similitud coseno)'
                  : 'Coincidencias por prefijo. Presiona Enter para ordenarlas por relevancia.'}
              </p>
            )}
          </div>

          {cargando && resultados.length === 0 && <EsqueletoLibros cantidad={12} />}
          {error && <p className="mensaje-busqueda error">{error}</p>}
          {sinResultados && (
            <p className="mensaje-busqueda">
              {categoriaActiva
                ? 'Todavía no hay libros en este género.'
                : `No encontré libros para “${texto.trim()}”. Prueba con otra palabra del título o elige un género.`}
            </p>
          )}

          <div className={cargando && resultados.length > 0 ? 'resultados-recargando' : ''}>
            <ListaResultados resultados={resultados} mostrarSimilitud={porRelevancia} />
          </div>
        </section>
      )}

      <div hidden={busquedaActiva || pestana !== 'explorar'}>
        <Explorar />
      </div>

      {!busquedaActiva && pestana === 'biblioteca' && <Biblioteca />}
      {!busquedaActiva && pestana === 'estadisticas' && <Estadisticas />}
    </div>
  );
}

export default Principal;
