import { useEffect, useState } from 'react';
import AvatarPerfil from './AvatarPerfil';
import { obtenerEstadisticasPerfiles } from '../services/librosApi';

const ETIQUETAS_ESTADO = [
  { clave: 'leido', texto: 'Leídos' },
  { clave: 'leyendo', texto: 'Leyendo' },
  { clave: 'pendiente', texto: 'Pendientes' }
];

function TablaTerminos({ terminos }) {
  if (terminos.length === 0) {
    return (
      <p className="mensaje-perfil-cuenta">
        Todavía no hay libros leídos con calificación positiva para formar su vector de gustos.
      </p>
    );
  }

  return (
    <table className="tabla-top">
      <thead>
        <tr>
          <th>#</th>
          <th>Término</th>
          <th>Peso</th>
        </tr>
      </thead>
      <tbody>
        {terminos.map((termino, indice) => (
          <tr key={termino.palabra}>
            <td>{indice + 1}</td>
            <td>{termino.palabra}</td>
            <td>{termino.peso}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TarjetaPerfilCuenta({ perfil }) {
  return (
    <div className="tarjeta-grafica tarjeta-perfil-cuenta" style={{ borderLeftColor: perfil.color }}>
      <div className="cabecera-perfil-cuenta">
        <AvatarPerfil perfil={perfil} />
        <h3 style={{ color: perfil.color }}>{perfil.nombre}</h3>
      </div>

      {perfil.total_libros === 0 ? (
        <p className="mensaje-perfil-cuenta">Este perfil todavía no tiene libros.</p>
      ) : (
        <div className="cuerpo-perfil-cuenta">
          <div>
            <h4>Términos de mayor peso</h4>
            <TablaTerminos terminos={perfil.terminos} />
          </div>

          <div>
            <h4>Libros por estado</h4>
            <table className="tabla-top">
              <tbody>
                {ETIQUETAS_ESTADO.map(({ clave, texto }) => (
                  <tr key={clave}>
                    <td>{texto}</td>
                    <td>{perfil.por_estado[clave]}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Libros por género</h4>
            <table className="tabla-top">
              <tbody>
                {perfil.por_genero.map((fila) => (
                  <tr key={fila.genero}>
                    <td>{fila.genero}</td>
                    <td>{fila.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Calificación promedio</h4>
            <p className="promedio-perfil-cuenta">
              {perfil.promedio === null ? 'Sin calificaciones' : `${perfil.promedio} ★`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function PerfilesCuenta() {
  const [perfiles, setPerfiles] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    obtenerEstadisticasPerfiles().then(setPerfiles).catch(() => setError(true));
  }, []);

  return (
    <section className="seccion-perfiles-cuenta">
      <h2>Perfiles de la cuenta</h2>
      {error && <p className="mensaje-estadisticas">No se pudieron cargar las estadísticas de los perfiles.</p>}
      {!error && !perfiles && <p className="mensaje-estadisticas">Cargando...</p>}
      {perfiles && perfiles.map((perfil) => <TarjetaPerfilCuenta key={perfil.id} perfil={perfil} />)}
    </section>
  );
}

export default PerfilesCuenta;
