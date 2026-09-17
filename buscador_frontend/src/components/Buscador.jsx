import { useState } from 'react';
import { buscarLibros, buscarPorCategoria } from '../services/librosApi';
import ListaResultados from './ListaResultados';

const categorias = [
  "Fantasy", "Mystery", "Romance", "Horror",
  "Science Fiction", "Children", "Biography/Non-fiction", "Adventure"
];

function Buscador() {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);

  const manejarCambio = async (valor) => {
    setTexto(valor);
    setCategoriaActiva(null);

    if (valor.trim() === '') {
      setResultados([]);
      return;
    }

    const datos = await buscarLibros(valor);
    setResultados(datos);
  };

  const manejarCategoria = async (categoria) => {
    setTexto('');
    setCategoriaActiva(categoria);
    const datos = await buscarPorCategoria(categoria);
    setResultados(datos);
  };

  const limpiar = () => {
    setTexto('');
    setCategoriaActiva(null);
    setResultados([]);
  };

  return (
    <div>
      <div className="barra-busqueda">
        <input
          type="text"
          className="input-busqueda"
          placeholder="Escribe el título de un libro..."
          value={texto}
          onChange={(e) => manejarCambio(e.target.value)}
        />
        <button className="boton-limpiar" onClick={limpiar} aria-label="Limpiar búsqueda">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="fila-categorias">
        {categorias.map((categoria) => (
          <button
            key={categoria}
            className={`pildora-categoria ${categoriaActiva === categoria ? 'activa' : ''}`}
            onClick={() => manejarCategoria(categoria)}
          >
            {categoria}
          </button>
        ))}
      </div>

      <ListaResultados resultados={resultados} />
    </div>
  );
}

export default Buscador;