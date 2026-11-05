import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { obtenerEstadisticas } from '../services/librosApi';

const formato = (valor) => Number(valor).toLocaleString('es-MX');

function Estadisticas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    obtenerEstadisticas().then(setDatos).catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <p className="mensaje-estadisticas">
        No se pudieron cargar las estadísticas. Revisa que el backend esté corriendo y que hayas ejecutado estadisticas.py.
      </p>
    );
  }

  if (!datos) {
    return <p className="mensaje-estadisticas">Cargando...</p>;
  }

  const { totales, zipf, heaps } = datos;
  const reduccion = ((1 - totales.vocabulario_con / totales.vocabulario_sin) * 100).toFixed(1);

  return (
    <div>
      <div className="resumen-estadisticas">
        <div className="dato-resumen">
          <span>{formato(totales.libros)}</span>
          <p>libros</p>
        </div>
        <div className="dato-resumen">
          <span>{formato(totales.tokens)}</span>
          <p>palabras totales</p>
        </div>
        <div className="dato-resumen">
          <span>{formato(totales.vocabulario_sin)}</span>
          <p>vocabulario original</p>
        </div>
        <div className="dato-resumen">
          <span>{formato(totales.vocabulario_con)}</span>
          <p>vocabulario reducido ({reduccion}%)</p>
        </div>
      </div>

      <div className="tarjeta-grafica">
        <h2>Ley de Zipf</h2>
        <p>Ranking contra frecuencia en escala logarítmica. Exponente estimado: {zipf.exponente}</p>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={zipf.puntos} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="rank"
              type="number"
              scale="log"
              domain={[1, 'dataMax']}
              tickFormatter={formato}
              label={{ value: 'Ranking', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              scale="log"
              domain={[1, 'dataMax']}
              allowDataOverflow
              tickFormatter={formato}
              label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip formatter={formato} labelFormatter={(r) => `Ranking ${formato(r)}`} />
            <Legend verticalAlign="top" />
            <Line type="monotone" dataKey="sin" name="Sin reducción" stroke="#d98e5f" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="con" name="Con stopwords y lematización" stroke="#2b2320" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="ideal" name="Zipf ideal" stroke="#8a7d70" dot={false} strokeDasharray="6 4" />
          </LineChart>
        </ResponsiveContainer>

        <h3>Palabras más frecuentes</h3>
        <table className="tabla-top">
          <thead>
            <tr>
              <th>#</th>
              <th>Palabra</th>
              <th>Frecuencia</th>
            </tr>
          </thead>
          <tbody>
            {zipf.top.map((fila, indice) => (
              <tr key={fila.palabra}>
                <td>{indice + 1}</td>
                <td>{fila.palabra}</td>
                <td>{formato(fila.frecuencia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tarjeta-grafica">
        <h2>Ley de Heaps</h2>
        <p>Palabras totales contra vocabulario. K = {heaps.k}, β = {heaps.beta}</p>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={heaps.puntos} margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="n"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formato}
              label={{ value: 'Palabras totales', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              tickFormatter={formato}
              label={{ value: 'Vocabulario', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip formatter={formato} labelFormatter={(n) => `${formato(n)} palabras`} />
            <Legend verticalAlign="top" />
            <Line type="monotone" dataKey="real" name="Vocabulario real" stroke="#d98e5f" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="ajuste" name="Ajuste K·n^β" stroke="#2b2320" dot={false} strokeDasharray="6 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Estadisticas;