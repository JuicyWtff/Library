import { useRef, useState } from 'react';

const LARGO_PIN = 4;

function EntradaPin({ onCompleto, deshabilitado }) {
  const [digitos, setDigitos] = useState(Array(LARGO_PIN).fill(''));
  const casillas = useRef([]);

  function escribir(posicion, texto) {
    const limpio = texto.replace(/\D/g, '');
    if (limpio === '') {
      actualizar(posicion, '');
      return;
    }
    const nuevos = [...digitos];
    let indice = posicion;
    for (const caracter of limpio) {
      if (indice >= LARGO_PIN) break;
      nuevos[indice] = caracter;
      indice += 1;
    }
    setDigitos(nuevos);
    if (nuevos.every((d) => d !== '')) {
      onCompleto(nuevos.join(''));
      return;
    }
    const siguiente = Math.min(indice, LARGO_PIN - 1);
    casillas.current[siguiente]?.focus();
  }

  function actualizar(posicion, valor) {
    const nuevos = [...digitos];
    nuevos[posicion] = valor;
    setDigitos(nuevos);
  }

  function alPresionar(evento, posicion) {
    if (evento.key === 'Backspace' && digitos[posicion] === '' && posicion > 0) {
      actualizar(posicion - 1, '');
      casillas.current[posicion - 1]?.focus();
    }
  }

  return (
    <div className="entrada-pin" role="group" aria-label="PIN de 4 dígitos">
      {digitos.map((digito, posicion) => (
        <input
          key={posicion}
          ref={(elemento) => {
            casillas.current[posicion] = elemento;
          }}
          className="casilla-pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={LARGO_PIN}
          value={digito}
          disabled={deshabilitado}
          autoFocus={posicion === 0}
          aria-label={`Dígito ${posicion + 1}`}
          onChange={(evento) => escribir(posicion, evento.target.value)}
          onKeyDown={(evento) => alPresionar(evento, posicion)}
        />
      ))}
    </div>
  );
}

export default EntradaPin;
