import { useState } from 'react';
import Buscador from './components/Buscador';
import Biblioteca from './components/Biblioteca';
import Estadisticas from './components/Estadisticas';
import './App.css';

function App() {
  const [pestana, setPestana] = useState('buscador');

  return (
    <div className="contenedor-principal">
      <h1 className="titulo-books">BOOKS</h1>

      <div className="pestanas">
        <button
          className={`pestana ${pestana === 'buscador' ? 'activa' : ''}`}
          onClick={() => setPestana('buscador')}
        >
          Buscador
        </button>
        <button
          className={`pestana ${pestana === 'biblioteca' ? 'activa' : ''}`}
          onClick={() => setPestana('biblioteca')}
        >
          Mi biblioteca
        </button>
        <button
          className={`pestana ${pestana === 'estadisticas' ? 'activa' : ''}`}
          onClick={() => setPestana('estadisticas')}
        >
          Estadísticas
        </button>
      </div>

      <div hidden={pestana !== 'buscador'}>
        <Buscador />
      </div>

      {pestana === 'biblioteca' && <Biblioteca />}
      {pestana === 'estadisticas' && <Estadisticas />}
    </div>
  );
}

export default App;