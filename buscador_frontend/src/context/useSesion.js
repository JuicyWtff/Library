import { useContext } from 'react';
import ContextoSesion from './contextoSesion';

function useSesion() {
  return useContext(ContextoSesion);
}

export default useSesion;
