import type { ReactNode } from 'react';

/** Superficie base de la aplicación: todo el contenido vive dentro de una. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface shadow-card ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  icon,
  description,
  action,
}: {
  title: string;
  icon?: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.01em] text-ink">
          {icon && <span className="text-ink-subtle">{icon}</span>}
          {title}
        </h2>
        {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t border-line bg-sunken px-5 py-3">{children}</div>;
}
