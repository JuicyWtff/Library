import { useState } from 'react';
import './Calificaciones.css';

function Estrellas({ valor, onCambiar, tamano = '1.2rem' }) {
  const [sobre, setSobre] = useState(0);
  const actual = valor || 0;

  if (!onCambiar) {
    return (
      <span
        className="estrellas"
        style={{ fontSize: tamano }}
        aria-label={`${actual} de 5 estrellas`}
      >
        <span className="estrellas-fondo">★★★★★</span>
        <span className="estrellas-relleno" style={{ width: `${(actual / 5) * 100}%` }}>
          ★★★★★
        </span>
      </span>
    );
  }

  const mostrado = sobre || actual;

  return (
    <span className="estrellas-editables" style={{ fontSize: tamano }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`estrella-boton ${n <= mostrado ? 'llena' : ''}`}
          onMouseEnter={() => setSobre(n)}
          onMouseLeave={() => setSobre(0)}
          onClick={() => onCambiar(n === actual ? 0 : n)}
          aria-label={`${n} estrellas`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export default Estrellas;