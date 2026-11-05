import { useEffect, useState } from 'react';
import { obtenerResumenes } from '../services/librosApi';
import Estrellas from './Estrellas';
import PanelLibro from './PanelLibro';
import './Calificaciones.css';

function ListaResultados({ resultados }) {
  const [resumenes, setResumenes] = useState({});
  const [libroAbierto, setLibroAbierto] = useState(null);

  useEffect(() => {
    if (resultados.length === 0) return;
    let activo = true;
    obtenerResumenes(resultados.map((libro) => libro.isbn))
      .then((datos) => {
        if (activo) setResumenes((previos) => ({ ...previos, ...datos }));
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [resultados]);

  function refrescarResumen(isbn) {
    obtenerResumenes([isbn])
      .then((datos) => setResumenes((previos) => ({ ...previos, ...datos })))
      .catch(() => {});
  }

  if (resultados.length === 0) {
    return null;
  }

  return (
    <>
      <div className="cuadricula-libros">
        {resultados.map((libro) => {
          const resumen = resumenes[libro.isbn];
          return (
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
              <span className="etiqueta-categoria">{libro.categoria}</span>
              <img src={libro.imagen} alt={libro.titulo} className="portada-libro" />
              <p className="titulo-libro">{libro.titulo}</p>
              <p className="autor-libro">{libro.autor}</p>
              <div className="calificacion-tarjeta">
                {resumen && resumen.total > 0 ? (
                  <>
                    <Estrellas valor={resumen.promedio} tamano="0.95rem" />
                    <span className="texto-calificacion">
                      {resumen.promedio} ({resumen.total})
                    </span>
                  </>
                ) : (
                  <span className="texto-calificacion">Sin calificaciones</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {libroAbierto && (
        <PanelLibro
          key={libroAbierto.isbn}
          libro={libroAbierto}
          onCerrar={() => setLibroAbierto(null)}
          onGuardado={refrescarResumen}
        />
      )}
    </>
  );
}

export default ListaResultados;