/**
 * Marcadores de carga con la forma del contenido que va a llegar: anticipan la
 * estructura de la tabla y evitan el salto de diseño al pintar los datos.
 */
const WIDTHS = ['w-[38%]', 'w-[12%]', 'w-[14%]', 'w-[10%]', 'w-[12%]'];

export function SkeletonRows({ count = 6, message = 'Cargando...' }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{message}</span>
      <div aria-hidden="true">
        {Array.from({ length: count }, (_, row) => (
          <div
            key={row}
            className="flex items-center gap-5 border-b border-line px-5 py-4 last:border-b-0"
          >
            {WIDTHS.map((width, cell) => (
              <div
                key={cell}
                className={`h-2.5 animate-pulse rounded-full bg-line-strong/70 ${width}`}
                /* Un desfase por fila evita el pulso sincronizado, que parece
                   una pantalla parpadeando más que algo cargando. */
                style={{ animationDelay: `${row * 90}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
