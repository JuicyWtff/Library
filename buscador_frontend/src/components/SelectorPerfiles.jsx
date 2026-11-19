import { useState } from 'react';
import useSesion from '../context/useSesion';
import AvatarPerfil from './AvatarPerfil';
import EntradaPin from './EntradaPin';
import './Sesion.css';

function SelectorPerfiles() {
  const { cuenta, perfiles, elegirPerfil, abrirGestion, salir } = useSesion();
  const [pendiente, setPendiente] = useState(null);
  const [intento, setIntento] = useState(0);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const dueno = perfiles.find((p) => p.es_dueno);

  async function entrarA(perfil, pin, paraGestionar) {
    setOcupado(true);
    setError('');
    try {
      await elegirPerfil(perfil.id, pin);
      if (paraGestionar) abrirGestion();
    } catch (err) {
      setError(err.message);
      setIntento((n) => n + 1);
      setOcupado(false);
    }
  }

  function seleccionar(perfil, paraGestionar = false) {
    setError('');
    if (perfil.tiene_pin) {
      setPendiente({ perfil, paraGestionar });
      return;
    }
    entrarA(perfil, undefined, paraGestionar);
  }

  function cancelarPin() {
    setPendiente(null);
    setError('');
  }

  if (pendiente) {
    return (
      <main className="pantalla-sesion">
        <section className="bloque-pin">
          <AvatarPerfil perfil={pendiente.perfil} tamano="grande" />
          <h1 className="titulo-selector">PIN de {pendiente.perfil.nombre}</h1>
          <p className="lema-sesion">
            {pendiente.paraGestionar
              ? 'Para administrar perfiles entras como el dueño de la cuenta.'
              : 'Escribe los 4 dígitos para entrar.'}
          </p>
          <EntradaPin
            key={intento}
            deshabilitado={ocupado}
            onCompleto={(pin) => entrarA(pendiente.perfil, pin, pendiente.paraGestionar)}
          />
          {error && (
            <p className="mensaje-sesion error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="boton-texto" onClick={cancelarPin}>
            Elegir otro perfil
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="pantalla-sesion">
      <section className="bloque-selector">
        <h1 className="titulo-selector">¿Quién está leyendo?</h1>
        <p className="lema-sesion">{cuenta.correo}</p>

        <ul className="rejilla-perfiles">
          {perfiles.map((perfil) => (
            <li key={perfil.id}>
              <button
                type="button"
                className="tarjeta-perfil"
                disabled={ocupado}
                onClick={() => seleccionar(perfil)}
              >
                <AvatarPerfil perfil={perfil} tamano="grande" />
                <span className="nombre-perfil">{perfil.nombre}</span>
                {perfil.es_dueno && <span className="detalle-perfil">Dueño</span>}
                {perfil.tiene_pin && <span className="detalle-perfil">Protegido con PIN</span>}
              </button>
            </li>
          ))}
        </ul>

        {error && (
          <p className="mensaje-sesion error" role="alert">
            {error}
          </p>
        )}

        <div className="acciones-selector">
          {dueno && (
            <button
              type="button"
              className="boton-secundario"
              disabled={ocupado}
              onClick={() => seleccionar(dueno, true)}
            >
              Administrar perfiles
            </button>
          )}
          <button type="button" className="boton-texto" onClick={salir}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}

export default SelectorPerfiles;
