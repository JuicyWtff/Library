import { useState } from 'react';
import useSesion from '../context/useSesion';
import './Sesion.css';

function traducirError(error, modo) {
  if (modo === 'entrar' && error.estado === 401) return 'Correo o contraseña incorrectos';
  if (modo === 'registro' && error.estado === 409) return 'Ese correo ya está registrado';
  if (error instanceof TypeError) return 'No se pudo conectar con el servidor';
  return error.message;
}

function Login() {
  const { entrar, registrar, aviso } = useSesion();
  const [modo, setModo] = useState('entrar');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [nombrePerfil, setNombrePerfil] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const registrando = modo === 'registro';

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setError('');
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      if (registrando) {
        await registrar({ correo, contrasena, nombre_perfil: nombrePerfil });
      } else {
        await entrar({ correo, contrasena });
      }
    } catch (err) {
      setError(traducirError(err, modo));
      setEnviando(false);
    }
  }

  return (
    <main className="pantalla-sesion">
      <section className="tarjeta-login">
        <h1 className="marca-sesion">BOOKS</h1>
        <p className="lema-sesion">
          {registrando
            ? 'Crea tu cuenta y arma tu primer perfil.'
            : 'Entra para ver tu biblioteca y tus recomendaciones.'}
        </p>

        <div className="selector-modo" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!registrando}
            className={`opcion-modo ${!registrando ? 'activa' : ''}`}
            onClick={() => cambiarModo('entrar')}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={registrando}
            className={`opcion-modo ${registrando ? 'activa' : ''}`}
            onClick={() => cambiarModo('registro')}
          >
            Crear cuenta
          </button>
        </div>

        <form className="formulario-sesion" onSubmit={enviar}>
          <label className="campo-sesion">
            <span>Correo</span>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="campo-sesion">
            <span>Contraseña</span>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete={registrando ? 'new-password' : 'current-password'}
              minLength={registrando ? 6 : undefined}
              required
            />
            {registrando && <small>Mínimo 6 caracteres.</small>}
          </label>

          {registrando && (
            <label className="campo-sesion">
              <span>Nombre de tu primer perfil</span>
              <input
                type="text"
                value={nombrePerfil}
                onChange={(e) => setNombrePerfil(e.target.value)}
                maxLength={40}
                required
              />
              <small>Será el perfil dueño de la cuenta.</small>
            </label>
          )}

          {aviso && !error && <p className="mensaje-sesion aviso">{aviso}</p>}
          {error && (
            <p className="mensaje-sesion error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="boton-principal" disabled={enviando}>
            {enviando ? 'Un momento...' : registrando ? 'Crear cuenta' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
