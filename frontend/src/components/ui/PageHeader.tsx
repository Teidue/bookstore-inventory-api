import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
}

/** Cabecera común: título, contexto y acción principal. */
export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  return (
    <>
      {back && (
        <Link
          className="mb-4 -ml-1 inline-flex items-center gap-1.5 rounded px-1 py-0.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
          to={back.to}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-[1.65rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
            {title}
          </h1>
          {subtitle && <div className="mt-1.5 text-[13px] text-ink-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
    </>
  );
}
