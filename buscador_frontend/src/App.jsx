import { useRef, useState } from 'react';
import Explorar from './components/Explorar';
import Buscador from './components/Buscador';
import ListaResultados from './components/ListaResultados';
import Biblioteca from './components/Biblioteca';
import Estadisticas from './components/Estadisticas';
import { buscarLibros, buscarPorCategoria } from './services/librosApi';
import './App.css';

function App() {
  const [pestana, setPestana] = useState('explorar');
  const [texto, setTexto] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const solicitud = useRef(0);

  const busquedaActiva = texto.trim() !== '' || categoriaActiva !== null;

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
      setError('No se pudo completar la búsqueda');
    }
    setCargando(false);
  }

  function limpiar() {
    solicitud.current += 1;
    setTexto('');
    setCategoriaActiva(null);
    setResultados([]);
    setCargando(false);
    setError('');
  }

  function cambiarTexto(valor) {
    setTexto(valor);
    setCategoriaActiva(null);
    if (valor.trim() === '') {
      limpiar();
      setTexto(valor);
      return;
    }
    ejecutar(() => buscarLibros(encodeURIComponent(valor)));
  }

  function cambiarCategoria(categoria) {
    if (categoria === categoriaActiva) {
      limpiar();
      return;
    }
    setTexto('');
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

  return (
    <div className="contenedor-principal">
      <h1 className="titulo-books">BOOKS</h1>

      <Buscador
        texto={texto}
        categoriaActiva={categoriaActiva}
        onTexto={cambiarTexto}
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
        <div>
          <h2 className="encabezado-resultados">
            {categoriaActiva ? categoriaActiva : `Resultados para “${texto.trim()}”`}{' '}
            {!cargando && resultados.length > 0 && <span>({resultados.length})</span>}
          </h2>

          {cargando && resultados.length === 0 && (
            <p className="mensaje-busqueda">Buscando...</p>
          )}
          {error && <p className="mensaje-busqueda">{error}</p>}
          {!cargando && !error && resultados.length === 0 && (
            <p className="mensaje-busqueda">No encontré libros con esa búsqueda.</p>
          )}

          <ListaResultados resultados={resultados} />
        </div>
      )}

      <div hidden={busquedaActiva || pestana !== 'explorar'}>
        <Explorar />
      </div>

      {!busquedaActiva && pestana === 'biblioteca' && <Biblioteca />}
      {!busquedaActiva && pestana === 'estadisticas' && <Estadisticas />}
    </div>
  );
}

export default App;