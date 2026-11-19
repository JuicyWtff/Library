import useSesion from './context/useSesion';
import Login from './components/Login';
import SelectorPerfiles from './components/SelectorPerfiles';
import GestionPerfiles from './components/GestionPerfiles';
import Principal from './components/Principal';
import './App.css';

function App() {
  const { cargando, cuenta, perfil, gestionando } = useSesion();

  if (cargando) {
    return (
      <main className="pantalla-sesion">
        <p className="lema-sesion">Cargando...</p>
      </main>
    );
  }

  if (!cuenta) return <Login />;
  if (!perfil) return <SelectorPerfiles />;
  if (gestionando) return <GestionPerfiles />;
  return <Principal key={perfil.id} />;
}

export default App;
