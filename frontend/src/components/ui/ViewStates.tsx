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
  `flex flex-col items-center px-6 py-16 text-center ${
    variant === 'panel' ? 'rounded-xl border border-dashed border-line-strong bg-surface' : ''
  }`;

const TITLE = 'text-[15px] font-semibold tracking-[-0.01em] text-ink';
const BODY = 'mt-1 max-w-sm text-[13px] leading-relaxed text-ink-muted';

export function Loading({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className={container('plain')} role="status" aria-live="polite">
      <span
        className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-brand"
        aria-hidden="true"
      />
      <p className="text-[13px] text-ink-muted">{message}</p>
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
        className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-critical-soft text-critical ring-1 ring-critical/15"
        aria-hidden="true"
      >
        <TriangleAlert size={19} />
      </span>
      <p className={TITLE}>No se han podido cargar los datos</p>
      <p className={BODY}>{error.message}</p>
      {/* Un error sin salida deja al usuario atrapado: siempre hay reintento. */}
      {(onRetry || children) && (
        <div className="mt-4 flex gap-2">
          {onRetry && (
            <Button type="button" variant="secondary" onClick={onRetry}>
              <RotateCw size={15} aria-hidden="true" />
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
        className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-sunken text-ink-subtle ring-1 ring-line-strong"
        aria-hidden="true"
      >
        <Icon size={19} />
      </span>
      <p className={TITLE}>{title}</p>
      {description && <p className={BODY}>{description}</p>}
      {children && <div className="mt-4 flex gap-2">{children}</div>}
    </div>
  );
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="mb-5 flex items-start gap-2.5 rounded-lg border border-critical/20 bg-critical-soft px-3.5 py-3 text-[13px] leading-relaxed text-critical"
      role="alert"
    >
      <CircleAlert size={16} className="mt-px shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
