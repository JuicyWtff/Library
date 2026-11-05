import { useRef } from 'react';
import Estrellas from './Estrellas';
import './Explorar.css';

function FilaLibros({ titulo, libros, onAbrir }) {
  const carril = useRef(null);

  function desplazar(direccion) {
    const elemento = carril.current;
    if (!elemento) return;
    elemento.scrollBy({ left: direccion * elemento.clientWidth * 0.8, behavior: 'smooth' });
  }

  return (
    <section className="fila-seccion">
      <h2 className="fila-titulo">{titulo}</h2>
      <div className="fila-contenedor">
        <button
          type="button"
          className="fila-flecha izquierda"
          onClick={() => desplazar(-1)}
          aria-label="Anterior"
        >
          ‹
        </button>

        <div className="fila-carril" ref={carril}>
          {libros.map((libro) => (
            <div
              key={libro.isbn}
              className="tarjeta-fila"
              role="button"
              tabIndex={0}
              onClick={() => onAbrir(libro)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') onAbrir(libro);
              }}
            >
              <img src={libro.imagen} alt={libro.titulo} className="portada-fila" />
              <p className="titulo-fila" title={libro.titulo}>
                {libro.titulo}
              </p>
              <p className="autor-fila">{libro.autor}</p>
              <div className="calificacion-tarjeta">
                {libro.promedio !== null ? (
                  <>
                    <Estrellas valor={libro.promedio} tamano="0.85rem" />
                    <span className="texto-calificacion">
                      {libro.promedio} ({libro.votos})
                    </span>
                  </>
                ) : (
                  <span className="texto-calificacion">Sin calificaciones</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="fila-flecha derecha"
          onClick={() => desplazar(1)}
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>
    </section>
  );
}

export default FilaLibros;