function EsqueletoLibros({ cantidad = 8 }) {
  return (
    <div className="cuadricula-resultados" aria-busy="true" aria-label="Cargando libros">
      {Array.from({ length: cantidad }, (_, indice) => (
        <div key={indice} className="esqueleto-tarjeta">
          <div className="esqueleto-portada" />
          <div className="esqueleto-linea" />
          <div className="esqueleto-linea corta" />
        </div>
      ))}
    </div>
  );
}

export default EsqueletoLibros;
