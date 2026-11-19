function AvatarPerfil({ perfil, tamano = 'mediano' }) {
  return (
    <span
      className={`avatar-perfil avatar-${tamano}`}
      style={{ backgroundColor: perfil.color }}
      aria-hidden="true"
    >
      {perfil.nombre.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default AvatarPerfil;
