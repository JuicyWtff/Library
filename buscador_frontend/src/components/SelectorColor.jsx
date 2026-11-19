const COLORES = [
  { valor: '#d98e5f', nombre: 'Durazno' },
  { valor: '#b5533c', nombre: 'Terracota' },
  { valor: '#c9a227', nombre: 'Ocre' },
  { valor: '#7d8f4e', nombre: 'Oliva' },
  { valor: '#4f8a6b', nombre: 'Verde' },
  { valor: '#4a7a9b', nombre: 'Azul' },
  { valor: '#8a5a83', nombre: 'Ciruela' },
  { valor: '#6b4f3f', nombre: 'Café' }
];

function SelectorColor({ valor, onCambio }) {
  return (
    <div className="selector-color" role="radiogroup" aria-label="Color del perfil">
      {COLORES.map((color) => (
        <button
          key={color.valor}
          type="button"
          role="radio"
          aria-checked={valor === color.valor}
          aria-label={color.nombre}
          title={color.nombre}
          className={`muestra-color ${valor === color.valor ? 'elegida' : ''}`}
          style={{ backgroundColor: color.valor }}
          onClick={() => onCambio(color.valor)}
        />
      ))}
    </div>
  );
}

export { COLORES };
export default SelectorColor;
