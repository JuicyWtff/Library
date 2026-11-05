import { useEffect, useState } from 'react';
import {
  obtenerEntrada,
  guardarEntrada,
  eliminarEntrada,
  obtenerResenas,
  obtenerResumenes
} from '../services/librosApi';
import Estrellas from './Estrellas';
import './Calificaciones.css';

const ESTADOS = [
  { valor: 'leido', texto: 'Leído' },
  { valor: 'leyendo', texto: 'Leyendo' },
  { valor: 'pendiente', texto: 'Pendiente' }
];

function PanelLibro({ libro, onCerrar, onGuardado }) {
  const [estado, setEstado] = useState('leido');
  const [estrellas, setEstrellas] = useState(0);
  const [resena, setResena] = useState('');
  const [enBiblioteca, setEnBiblioteca] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    function alPresionar(evento) {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    Promise.all([
      obtenerEntrada(libro.isbn),
      obtenerResenas(libro.isbn),
      obtenerResumenes([libro.isbn])
    ])
      .then(([entrada, lista, resumenes]) => {
        if (!activo) return;
        if (entrada) {
          setEnBiblioteca(true);
          setEstado(entrada.estado);
          setEstrellas(entrada.estrellas || 0);
          setResena(entrada.resena || '');
        }
        setResenas(lista);
        setResumen(resumenes[libro.isbn] || null);
        setCargando(false);
      })
      .catch(() => {
        if (!activo) return;
        setMensaje('No se pudo cargar la información del libro');
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [libro.isbn]);

  function cambiarEstrellas(n) {
    setEstrellas(n);
    if (n > 0 && estado === 'pendiente') {
      setEstado('leido');
    }
  }

  async function guardar() {
    setGuardando(true);
    setMensaje('');
    try {
      await guardarEntrada(libro.isbn, {
        estado,
        estrellas: estrellas || null,
        resena
      });
      setEnBiblioteca(true);
      const [lista, resumenes] = await Promise.all([
        obtenerResenas(libro.isbn),
        obtenerResumenes([libro.isbn])
      ]);
      setResenas(lista);
      setResumen(resumenes[libro.isbn] || null);
      setMensaje('Guardado');
      if (onGuardado) onGuardado(libro.isbn);
    } catch (err) {
      setMensaje(err.message);
    }
    setGuardando(false);
  }

  async function quitar() {
    setGuardando(true);
    setMensaje('');
    try {
      await eliminarEntrada(libro.isbn);
      if (onGuardado) onGuardado(libro.isbn);
      onCerrar();
    } catch (err) {
      setMensaje(err.message);
      setGuardando(false);
    }
  }

  return (
    <div className="panel-fondo" onClick={onCerrar}>
      <div
        className="panel-libro"
        role="dialog"
        aria-modal="true"
        onClick={(evento) => evento.stopPropagation()}
      >
        <button type="button" className="panel-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        <div className="panel-cabecera">
          <img src={libro.imagen} alt={libro.titulo} className="panel-portada" />
          <div className="panel-datos">
            <h2 className="panel-titulo">{libro.titulo}</h2>
            <p className="panel-autor">{libro.autor}</p>
            {libro.categoria && libro.categoria !== 'Unclassified' && <span className="panel-categoria">{libro.categoria}</span>}
            <div className="panel-promedio">
              {resumen && resumen.total > 0 ? (
                <>
                  <Estrellas valor={resumen.promedio} />
                  <span className="texto-calificacion">
                    {resumen.promedio} ({resumen.total})
                  </span>
                </>
              ) : (
                <span className="texto-calificacion">Sin calificaciones todavía</span>
              )}
            </div>
          </div>
        </div>

        {cargando ? (
          <p className="texto-calificacion">Cargando...</p>
        ) : (
          <>
            <div className="panel-seccion">
              <p className="panel-etiqueta">Estado</p>
              <div className="panel-estados">
                {ESTADOS.map((e) => (
                  <button
                    key={e.valor}
                    type="button"
                    className={`panel-estado ${estado === e.valor ? 'activo' : ''}`}
                    onClick={() => setEstado(e.valor)}
                  >
                    {e.texto}
                  </button>
                ))}
              </div>
            </div>

            <div className="panel-seccion">
              <p className="panel-etiqueta">Tu calificación</p>
              <Estrellas valor={estrellas} onCambiar={cambiarEstrellas} tamano="1.8rem" />
            </div>

            <div className="panel-seccion">
              <p className="panel-etiqueta">Tu reseña</p>
              <textarea
                className="panel-resena"
                value={resena}
                onChange={(evento) => setResena(evento.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="¿Qué te pareció?"
              />
            </div>

            <div className="panel-acciones">
              <button
                type="button"
                className="panel-guardar"
                onClick={guardar}
                disabled={guardando}
              >
                {enBiblioteca ? 'Actualizar' : 'Agregar a mi biblioteca'}
              </button>
              {enBiblioteca && (
                <button
                  type="button"
                  className="panel-quitar"
                  onClick={quitar}
                  disabled={guardando}
                >
                  Quitar
                </button>
              )}
              {mensaje && <span className="texto-calificacion">{mensaje}</span>}
            </div>

            {resenas.length > 0 && (
              <div className="panel-seccion">
                <p className="panel-etiqueta">Reseñas</p>
                {resenas.map((r, indice) => (
                  <div key={indice} className="panel-resena-item">
                    <div className="panel-resena-cabecera">
                      <span className="panel-resena-autor">{r.esMia ? 'Tú' : 'Lector'}</span>
                      {r.estrellas && <Estrellas valor={r.estrellas} tamano="0.95rem" />}
                    </div>
                    <p className="panel-resena-texto">{r.resena}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PanelLibro;