import type { ReactNode } from 'react';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONES: Record<BadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  neutral: 'bg-slate-50 text-slate-600 ring-slate-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
};

interface BadgeProps {
  tone?: BadgeTone;
  withDot?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', withDot = false, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}
    >
      {withDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
