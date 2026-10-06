/**
 * Marcadores de carga con la forma del contenido que va a llegar: anticipan la
 * estructura de la tabla y evitan el salto de diseño al pintar los datos.
 */
export function SkeletonRows({ count = 5, message = 'Cargando...' }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{message}</span>
      <div aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-slate-200 px-5 py-4 last:border-b-0"
          >
            <div className="h-3 w-[30%] animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-[15%] animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-[15%] animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-[20%] animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
