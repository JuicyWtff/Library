import { useEffect, useRef, useState } from 'react';
import useSesion from '../context/useSesion';
import AvatarPerfil from './AvatarPerfil';
import './Sesion.css';

function CabeceraPerfil() {
  const { perfil, cambiarDePerfil, abrirGestion, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    function cerrarAlHacerClicFuera(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) {
        setAbierto(false);
      }
    }
    function cerrarConEscape(evento) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', cerrarAlHacerClicFuera);
    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.removeEventListener('mousedown', cerrarAlHacerClicFuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [abierto]);

  function elegir(accion) {
    setAbierto(false);
    accion().catch(() => {});
  }

  return (
    <div className="cabecera-perfil" ref={contenedor}>
      <button
        type="button"
        className="boton-avatar"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Perfil de ${perfil.nombre}`}
        onClick={() => setAbierto((valor) => !valor)}
      >
        <AvatarPerfil perfil={perfil} tamano="chico" />
        <span className="nombre-cabecera">{perfil.nombre}</span>
      </button>

      {abierto && (
        <div className="menu-perfil" role="menu">
          <button
            type="button"
            role="menuitem"
            className="opcion-menu"
            onClick={() => elegir(cambiarDePerfil)}
          >
            Cambiar de perfil
          </button>
          {perfil.es_dueno && (
            <button
              type="button"
              role="menuitem"
              className="opcion-menu"
              onClick={() => elegir(async () => abrirGestion())}
            >
              Administrar perfiles
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className="opcion-menu"
            onClick={() => elegir(salir)}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default CabeceraPerfil;
