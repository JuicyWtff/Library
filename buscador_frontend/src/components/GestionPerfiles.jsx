import { useState } from 'react';
import useSesion from '../context/useSesion';
import { crearPerfil } from '../services/librosApi';
import FilaGestionPerfil from './FilaGestionPerfil';
import SelectorColor, { COLORES } from './SelectorColor';
import './Sesion.css';

function GestionPerfiles() {
  const { perfil, perfiles, reemplazarPerfil, refrescarPerfiles, cerrarGestion } = useSesion();
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLORES[1].valor);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const esDueno = perfil.es_dueno;

  function cancelarNuevo() {
    setAgregando(false);
    setNombre('');
    setPin('');
    setError('');
  }

  async function crear(evento) {
    evento.preventDefault();
    setOcupado(true);
    setError('');
    try {
      const datos = { nombre, color };
      if (pin !== '') datos.pin = pin;
      await crearPerfil(datos);
      await refrescarPerfiles();
      cancelarNuevo();
    } catch (err) {
      setError(err.message);
    }
    setOcupado(false);
  }

  return (
    <main className="pantalla-sesion">
      <section className="bloque-gestion">
        <header className="encabezado-gestion">
          <h1 className="titulo-selector">Administrar perfiles</h1>
          <button type="button" className="boton-principal" onClick={cerrarGestion}>
            Listo
          </button>
        </header>

        <ul className="lista-gestion">
          {perfiles.map((p) => (
            <FilaGestionPerfil
              key={p.id}
              perfil={p}
              puedeEliminar={esDueno}
              onActualizado={reemplazarPerfil}
              onEliminado={refrescarPerfiles}
            />
          ))}
        </ul>

        {esDueno && !agregando && (
          <button type="button" className="boton-secundario" onClick={() => setAgregando(true)}>
            Agregar perfil
          </button>
        )}

        {esDueno && agregando && (
          <form className="formulario-gestion nuevo-perfil" onSubmit={crear}>
            <h2>Nuevo perfil</h2>
            <label className="campo-sesion">
              <span>Nombre</span>
              <input
                type="text"
                value={nombre}
                maxLength={40}
                onChange={(e) => setNombre(e.target.value)}
                required
                autoFocus
              />
            </label>
            <div className="campo-sesion">
              <span>Color</span>
              <SelectorColor valor={color} onCambio={setColor} />
            </div>
            <label className="campo-sesion">
              <span>PIN (opcional)</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 dígitos"
              />
            </label>
            {error && (
              <p className="mensaje-sesion error" role="alert">
                {error}
              </p>
            )}
            <div className="acciones-gestion">
              <button type="submit" className="boton-principal" disabled={ocupado}>
                Crear perfil
              </button>
              <button type="button" className="boton-texto" onClick={cancelarNuevo}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default GestionPerfiles;
