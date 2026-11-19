import { useState } from 'react';
import { actualizarPerfil, eliminarPerfil } from '../services/librosApi';
import AvatarPerfil from './AvatarPerfil';
import SelectorColor from './SelectorColor';

function soloDigitos(texto) {
  return texto.replace(/\D/g, '').slice(0, 4);
}

function FilaGestionPerfil({ perfil, puedeEliminar, onActualizado, onEliminado }) {
  const [abierta, setAbierta] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre);
  const [color, setColor] = useState(perfil.color);
  const [pin, setPin] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [esError, setEsError] = useState(false);
  const [ocupada, setOcupada] = useState(false);

  const hayCambios = nombre.trim() !== perfil.nombre || color !== perfil.color;

  function avisar(texto, error) {
    setMensaje(texto);
    setEsError(error);
  }

  async function aplicar(datos, textoExito) {
    setOcupada(true);
    avisar('', false);
    try {
      const actualizado = await actualizarPerfil(perfil.id, datos);
      onActualizado(actualizado);
      setNombre(actualizado.nombre);
      setColor(actualizado.color);
      avisar(textoExito, false);
      return true;
    } catch (err) {
      avisar(err.message, true);
      return false;
    } finally {
      setOcupada(false);
    }
  }

  function guardarCambios(evento) {
    evento.preventDefault();
    aplicar({ nombre, color }, 'Cambios guardados');
  }

  async function guardarPin(evento) {
    evento.preventDefault();
    const guardado = await aplicar({ pin }, perfil.tiene_pin ? 'PIN cambiado' : 'PIN activado');
    if (guardado) setPin('');
  }

  function quitarPin() {
    aplicar({ pin: null }, 'PIN quitado');
  }

  async function eliminar() {
    setOcupada(true);
    avisar('', false);
    try {
      await eliminarPerfil(perfil.id);
      onEliminado(perfil.id);
    } catch (err) {
      avisar(err.message, true);
      setConfirmando(false);
      setOcupada(false);
    }
  }

  return (
    <li className="fila-gestion">
      <div className="cabecera-gestion">
        <AvatarPerfil perfil={perfil} tamano="chico" />
        <div className="datos-gestion">
          <span className="nombre-perfil">{perfil.nombre}</span>
          <span className="detalle-perfil">
            {perfil.es_dueno ? 'Dueño de la cuenta' : 'Perfil adicional'}
            {perfil.tiene_pin ? ', con PIN' : ''}
          </span>
        </div>
        <button
          type="button"
          className="boton-secundario"
          aria-expanded={abierta}
          onClick={() => setAbierta((valor) => !valor)}
        >
          {abierta ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {abierta && (
        <div className="cuerpo-gestion">
          <form className="formulario-gestion" onSubmit={guardarCambios}>
            <label className="campo-sesion">
              <span>Nombre</span>
              <input
                type="text"
                value={nombre}
                maxLength={40}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>
            <div className="campo-sesion">
              <span>Color</span>
              <SelectorColor valor={color} onCambio={setColor} />
            </div>
            <button type="submit" className="boton-principal" disabled={ocupada || !hayCambios}>
              Guardar cambios
            </button>
          </form>

          <form className="formulario-gestion" onSubmit={guardarPin}>
            <label className="campo-sesion">
              <span>{perfil.tiene_pin ? 'Nuevo PIN' : 'PIN de 4 dígitos'}</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(soloDigitos(e.target.value))}
                placeholder="••••"
              />
            </label>
            <div className="acciones-gestion">
              <button
                type="submit"
                className="boton-secundario"
                disabled={ocupada || pin.length !== 4}
              >
                {perfil.tiene_pin ? 'Cambiar PIN' : 'Poner PIN'}
              </button>
              {perfil.tiene_pin && (
                <button
                  type="button"
                  className="boton-texto"
                  disabled={ocupada}
                  onClick={quitarPin}
                >
                  Quitar PIN
                </button>
              )}
            </div>
          </form>

          {puedeEliminar && (
            <div className="zona-eliminar">
              {confirmando ? (
                <>
                  <p>
                    ¿Eliminar el perfil de {perfil.nombre}? Se borra también su biblioteca.
                  </p>
                  <div className="acciones-gestion">
                    <button
                      type="button"
                      className="boton-peligro"
                      disabled={ocupada}
                      onClick={eliminar}
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      className="boton-texto"
                      onClick={() => setConfirmando(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="boton-texto peligro"
                  onClick={() => setConfirmando(true)}
                >
                  Eliminar perfil
                </button>
              )}
            </div>
          )}

          {mensaje && (
            <p className={`mensaje-sesion ${esError ? 'error' : 'exito'}`} role="alert">
              {mensaje}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default FilaGestionPerfil;
