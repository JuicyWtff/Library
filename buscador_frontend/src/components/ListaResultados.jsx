function ListaResultados({ resultados }) {
  if (resultados.length === 0) {
    return null;
  }

  return (
    <div className="cuadricula-libros">
      {resultados.map((libro) => (
        <div key={libro.isbn} className="tarjeta-libro">
          <span className="etiqueta-categoria">{libro.categoria}</span>
          <img src={libro.imagen} alt={libro.titulo} className="portada-libro" />
          <p className="titulo-libro">{libro.titulo}</p>
          <p className="autor-libro">{libro.autor}</p>
        </div>
      ))}
    </div>
  );
}

export default ListaResultados;