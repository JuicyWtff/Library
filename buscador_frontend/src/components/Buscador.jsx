import './Buscador.css';

const categorias = [
  'Fantasy',
  'Mystery',
  'Romance',
  'Horror',
  'Science Fiction',
  'Children',
  'Biography/Non-fiction',
  'Adventure'
];

function Buscador({ texto, categoriaActiva, onTexto, onCategoria, onLimpiar }) {
  const hayBusqueda = texto.length > 0 || categoriaActiva !== null;

  return (
    <div className="buscador-superior">
      <div className="campo-busqueda">
        <svg
          className="icono-busqueda"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={texto}
          placeholder="Busca un libro"
          onChange={(evento) => onTexto(evento.target.value)}
        />
        {hayBusqueda && (
          <button className="boton-limpiar" onClick={onLimpiar} aria-label="Limpiar búsqueda">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="fila-categorias">
        {categorias.map((categoria) => (
          <button
            key={categoria}
            className={`pildora-categoria ${categoriaActiva === categoria ? 'activa' : ''}`}
            onClick={() => onCategoria(categoria)}
          >
            {categoria}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Buscador;