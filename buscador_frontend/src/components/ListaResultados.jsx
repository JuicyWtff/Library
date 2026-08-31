function ListaResultados({ resultados }) {
  if (resultados.length === 0) {
    return null;
  }

  return (
    <ul>
      {resultados.map((libro) => (
        <li key={libro.isbn}>
          <strong>{libro.titulo}</strong> — {libro.autor} ({libro.anio})
        </li>
      ))}
    </ul>
  );
}

export default ListaResultados;