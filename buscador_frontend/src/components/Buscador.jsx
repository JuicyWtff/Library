import { useState } from 'react';
import { buscarLibros } from '../services/librosApi';
import ListaResultados from './ListaResultados.jsx';

function Buscador() {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);

  const manejarCambio = async (valor) => {
    setTexto(valor);

    if (valor.trim() === '') {
      setResultados([]);
      return;
    }

    const datos = await buscarLibros(valor);
    setResultados(datos);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Escribe el título de un libro..."
        value={texto}
        onChange={(e) => manejarCambio(e.target.value)}
        style={{ padding: '0.5rem', width: '300px', fontSize: '1rem' }}
      />

      <ListaResultados resultados={resultados} />
    </div>
  );
}

export default Buscador;