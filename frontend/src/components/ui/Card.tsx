import type { ReactNode } from 'react';

/** Superficie base de la aplicación: todo el contenido vive dentro de una. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        {icon && <span className="text-slate-400">{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-slate-200 px-5 py-3">{children}</div>;
}
