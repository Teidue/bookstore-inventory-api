import type { ReactNode } from 'react';

export type BadgeTone = 'positive' | 'caution' | 'critical' | 'neutral' | 'accent';

const TONES: Record<BadgeTone, string> = {
  positive: 'bg-positive-soft text-positive ring-positive/15',
  caution: 'bg-caution-soft text-caution ring-caution/15',
  critical: 'bg-critical-soft text-critical ring-critical/15',
  neutral: 'bg-sunken text-ink-muted ring-line-strong',
  accent: 'bg-accent-soft text-accent-strong ring-accent/15',
};

interface BadgeProps {
  tone?: BadgeTone;
  withDot?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', withDot = false, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-medium whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}
    >
      {withDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
