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
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900"
          to={back.to}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
    </>
  );
}
