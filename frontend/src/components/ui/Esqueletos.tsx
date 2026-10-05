/**
 * Marcadores de carga con la forma del contenido que va a llegar: anticipan
 * la estructura de la tabla y evitan el salto de diseño al pintar los datos.
 */
export function EsqueletoFilas({ cantidad = 5, mensaje = 'Cargando...' }) {
  return (
    <div role="status" aria-live="polite">
      <span className="solo-lectores">{mensaje}</span>
      <div aria-hidden="true">
        {Array.from({ length: cantidad }, (_, indice) => (
          <div key={indice} className="fila-esqueleto">
            <div className="esqueleto esqueleto--linea esqueleto--ancho-30" />
            <div className="esqueleto esqueleto--linea esqueleto--ancho-15" />
            <div className="esqueleto esqueleto--linea esqueleto--ancho-15" />
            <div className="esqueleto esqueleto--linea esqueleto--ancho-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
