/**
 * Estilos de botón en un solo sitio.
 *
 * Es una función y no un componente porque los enlaces de React Router también
 * deben poder parecer botones sin dejar de ser `<a>`: así el aspecto vive en un
 * único lugar y no se duplica una lista larga de utilidades por cada enlace.
 *
 * La acción principal lleva el color de marca con un degradado casi
 * imperceptible y un reflejo superior de un píxel: es lo que le da relieve y
 * hace que parezca pulsable sin recurrir a un borde o a una sombra pesada.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft';
export type ButtonSize = 'sm' | 'md' | 'icon' | 'iconSm';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ' +
  'active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-linear-to-b from-brand to-brand-strong text-white shadow-brand hover:brightness-110',
  secondary:
    'border border-line-strong bg-surface text-ink shadow-card hover:border-accent/40 hover:bg-accent-soft hover:text-accent-strong',
  ghost: 'text-ink-muted hover:bg-accent-soft hover:text-accent-strong',
  danger:
    'bg-linear-to-b from-critical to-critical/85 text-white shadow-card hover:brightness-110',
  dangerSoft:
    'border border-transparent text-ink-subtle hover:border-critical/25 hover:bg-critical-soft hover:text-critical',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-9.5 px-3.5 text-[14px]',
  icon: 'h-9.5 w-9.5 p-0',
  iconSm: 'h-8 w-8 p-0',
};

export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}
