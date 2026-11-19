import { useEffect, useState } from 'react';
import { obtenerExplorar, obtenerParaTi } from '../services/librosApi';
import FilaLibros from './FilaLibros';
import PanelLibro from './PanelLibro';
import EsqueletoLibros from './EsqueletoLibros';
import './Explorar.css';

function Explorar() {
  const [secciones, setSecciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [libroAbierto, setLibroAbierto] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([obtenerParaTi().catch(() => ({ secciones: [] })), obtenerExplorar()])
      .then(([paraTi, explorar]) => {
        if (!activo) return;
        setSecciones([...paraTi.secciones, ...explorar.secciones]);
        setCargando(false);
      })
      .catch(() => {
        if (!activo) return;
        setError('No se pudo cargar la pantalla de explorar');
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  if (cargando) {
    return <EsqueletoLibros cantidad={5} />;
  }

  if (error) {
    return <p className="mensaje-busqueda error">{error}. Recarga la página e inténtalo de nuevo.</p>;
  }

  if (secciones.length === 0) {
    return (
      <p className="mensaje-busqueda">
        Aún no hay libros para mostrar. Usa el buscador o elige un género para empezar.
      </p>
    );
  }

  return (
    <div>
      {secciones.map((seccion) => (
        <FilaLibros
          key={seccion.id}
          titulo={seccion.titulo}
          libros={seccion.libros}
          onAbrir={setLibroAbierto}
        />
      ))}

      {libroAbierto && (
        <PanelLibro
          key={libroAbierto.isbn}
          libro={libroAbierto}
          onCerrar={() => setLibroAbierto(null)}
        />
      )}
    </div>
  );
}

export default Explorar;