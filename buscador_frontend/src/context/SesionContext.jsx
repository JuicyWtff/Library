import { useCallback, useEffect, useState } from 'react';
import ContextoSesion from './contextoSesion';
import {
  cerrarSesion,
  entrarAPerfil,
  iniciarSesion,
  listarPerfiles,
  obtenerYo,
  registrarCuenta,
  registrarManejadorSesionVencida,
  salirDePerfil
} from '../services/librosApi';

function SesionProvider({ children }) {
  const [cargando, setCargando] = useState(true);
  const [cuenta, setCuenta] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [gestionando, setGestionando] = useState(false);
  const [aviso, setAviso] = useState('');

  const limpiarSesion = useCallback(() => {
    setCuenta(null);
    setPerfil(null);
    setPerfiles([]);
    setGestionando(false);
  }, []);

  const refrescarPerfiles = useCallback(async () => {
    const lista = await listarPerfiles();
    setPerfiles(lista);
    return lista;
  }, []);

  useEffect(() => {
    let activo = true;
    obtenerYo()
      .then(async (datos) => {
        const lista = await listarPerfiles();
        if (!activo) return;
        setCuenta(datos.cuenta);
        setPerfil(datos.perfil);
        setPerfiles(lista);
        setCargando(false);
      })
      .catch(() => {
        if (!activo) return;
        limpiarSesion();
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [limpiarSesion]);

  useEffect(() => {
    registrarManejadorSesionVencida((motivo) => {
      if (motivo === 'sesion') {
        limpiarSesion();
        setAviso('Tu sesión venció. Inicia sesión de nuevo.');
        return;
      }
      setPerfil(null);
      setGestionando(false);
      listarPerfiles().then(setPerfiles).catch(() => {});
    });
    return () => registrarManejadorSesionVencida(null);
  }, [limpiarSesion]);

  async function registrar(datos) {
    const respuesta = await registrarCuenta(datos);
    setAviso('');
    setCuenta(respuesta.cuenta);
    setPerfiles(respuesta.perfiles);
    setPerfil(null);
  }

  async function entrar(datos) {
    const respuesta = await iniciarSesion(datos);
    setAviso('');
    setCuenta(respuesta.cuenta);
    setPerfiles(respuesta.perfiles);
    setPerfil(null);
  }

  async function salir() {
    try {
      await cerrarSesion();
    } finally {
      limpiarSesion();
      setAviso('');
    }
  }

  async function elegirPerfil(id, pin) {
    const respuesta = await entrarAPerfil(id, pin);
    setPerfil(respuesta.perfil);
    return respuesta.perfil;
  }

  async function cambiarDePerfil() {
    await salirDePerfil();
    setPerfil(null);
    setGestionando(false);
    await refrescarPerfiles();
  }

  function reemplazarPerfil(actualizado) {
    setPerfiles((anteriores) => anteriores.map((p) => (p.id === actualizado.id ? actualizado : p)));
    setPerfil((activo) => (activo && activo.id === actualizado.id ? actualizado : activo));
  }

  const valor = {
    cargando,
    cuenta,
    perfil,
    perfiles,
    gestionando,
    aviso,
    registrar,
    entrar,
    salir,
    elegirPerfil,
    cambiarDePerfil,
    refrescarPerfiles,
    reemplazarPerfil,
    abrirGestion: () => setGestionando(true),
    cerrarGestion: () => setGestionando(false)
  };

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

export { SesionProvider };
