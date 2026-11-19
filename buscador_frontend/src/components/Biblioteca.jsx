import { useEffect, useState } from 'react';
import { obtenerBiblioteca } from '../services/librosApi';
import Estrellas from './Estrellas';
import PanelLibro from './PanelLibro';
import EsqueletoLibros from './EsqueletoLibros';
import './Calificaciones.css';

const FILTROS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'leido', texto: 'Leído' },
  { valor: 'leyendo', texto: 'Leyendo' },
  { valor: 'pendiente', texto: 'Pendiente' }
];

const TEXTO_ESTADO = {
  leido: 'Leído',
  leyendo: 'Leyendo',
  pendiente: 'Pendiente'
};

function Biblioteca() {
  const [libros, setLibros] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [libroAbierto, setLibroAbierto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  function cargar() {
    obtenerBiblioteca()
      .then((datos) => {
        setLibros(datos);
        setError('');
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudo cargar tu biblioteca');
        setCargando(false);
      });
  }

  useEffect(() => {
    cargar();
  }, []);

  const visibles = libros.filter((l) => filtro === 'todos' || l.estado === filtro);

  function contar(valor) {
    if (valor === 'todos') return libros.length;
    return libros.filter((l) => l.estado === valor).length;
  }

  if (cargando) {
    return <EsqueletoLibros cantidad={5} />;
  }

  return (
    <div>
      <div className="filtros-biblioteca">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            className={`filtro-biblioteca ${filtro === f.valor ? 'activo' : ''}`}
            onClick={() => setFiltro(f.valor)}
          >
            {f.texto} ({contar(f.valor)})
          </button>
        ))}
      </div>

      {error && <p className="mensaje-busqueda error">{error}. Recarga la página e inténtalo de nuevo.</p>}

      {!error && visibles.length === 0 && (
        <p className="mensaje-busqueda">
          {libros.length === 0
            ? 'Aún no tienes libros. Busca uno, ábrelo y márcalo como leído, leyendo o pendiente.'
            : 'No tienes libros con este estado. Prueba con otro filtro.'}
        </p>
      )}

      <div className="cuadricula-libros">
        {visibles.map((libro) => (
          <div
            key={libro.isbn}
            className="tarjeta-libro tarjeta-clicable"
            role="button"
            tabIndex={0}
            onClick={() => setLibroAbierto(libro)}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter') setLibroAbierto(libro);
            }}
          >
            <span className="etiqueta-categoria">{TEXTO_ESTADO[libro.estado]}</span>
            <img src={libro.imagen} alt={libro.titulo} className="portada-libro" />
            <p className="titulo-libro">{libro.titulo}</p>
            <p className="autor-libro">{libro.autor}</p>
            <div className="calificacion-tarjeta">
              {libro.estrellas ? (
                <Estrellas valor={libro.estrellas} tamano="0.95rem" />
              ) : (
                <span className="texto-calificacion">Sin calificar</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {libroAbierto && (
        <PanelLibro
          key={libroAbierto.isbn}
          libro={libroAbierto}
          onCerrar={() => setLibroAbierto(null)}
          onGuardado={cargar}
        />
      )}
    </div>
  );
}

export default Biblioteca;