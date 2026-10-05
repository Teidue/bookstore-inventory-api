import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PropsEncabezadoPagina {
  titulo: string;
  subtitulo?: ReactNode;
  volver?: { a: string; texto: string };
  acciones?: ReactNode;
}

/** Cabecera común: título, contexto y acción principal. */
export function EncabezadoPagina({ titulo, subtitulo, volver, acciones }: PropsEncabezadoPagina) {
  return (
    <>
      {volver && (
        <Link className="enlace-volver" to={volver.a}>
          <ArrowLeft size={14} aria-hidden="true" />
          {volver.texto}
        </Link>
      )}
      <header className="encabezado-pagina">
        <div className="encabezado-pagina__titulo">
          <h1>{titulo}</h1>
          {subtitulo && <div className="encabezado-pagina__subtitulo">{subtitulo}</div>}
        </div>
        {acciones && <div className="encabezado-pagina__acciones">{acciones}</div>}
      </header>
    </>
  );
}
