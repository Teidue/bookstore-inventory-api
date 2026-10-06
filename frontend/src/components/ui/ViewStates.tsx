import { CircleAlert, Inbox, RotateCw, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { RequestError } from '../../services/apiClient';
import { Button } from './Button';

/**
 * Los tres estados que toda vista que consume datos debe saber pintar. Viven en
 * un único sitio para que ninguna pantalla se olvide del error o del vacío y
 * acabe mostrando un indicador de carga que no termina nunca.
 */

type Variant = 'panel' | 'plain';

const container = (variant: Variant): string =>
  `flex flex-col items-center gap-1.5 px-6 py-14 text-center text-slate-600 ${
    variant === 'panel' ? 'rounded-xl border border-dashed border-slate-300 bg-white' : ''
  }`;

export function Loading({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className={container('plain')} role="status" aria-live="polite">
      <span
        className="mb-2 h-7 w-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600"
        aria-hidden="true"
      />
      <p>{message}</p>
    </div>
  );
}

interface ErrorViewProps {
  error: RequestError;
  onRetry?: () => void;
  variant?: Variant;
  children?: ReactNode;
}

export function ErrorView({ error, onRetry, variant = 'panel', children }: ErrorViewProps) {
  return (
    <div className={container(variant)} role="alert">
      <span
        className="mb-2.5 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-200"
        aria-hidden="true"
      >
        <TriangleAlert size={22} />
      </span>
      <p className="font-semibold text-slate-900">No se han podido cargar los datos</p>
      <p className="max-w-md">{error.message}</p>
      {/* Un error sin salida deja al usuario atrapado: siempre hay reintento. */}
      {(onRetry || children) && (
        <div className="mt-3.5 flex gap-2">
          {onRetry && (
            <Button type="button" variant="secondary" onClick={onRetry}>
              <RotateCw size={16} aria-hidden="true" />
              Reintentar
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: Variant;
  children?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  variant = 'panel',
  children,
}: EmptyStateProps) {
  return (
    <div className={container(variant)}>
      <span
        className="mb-2.5 grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-200"
        aria-hidden="true"
      >
        <Icon size={22} />
      </span>
      <p className="font-semibold text-slate-900">{title}</p>
      {description && <p className="max-w-md">{description}</p>}
      {children && <div className="mt-3.5 flex gap-2">{children}</div>}
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-800"
      role="alert"
    >
      <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
