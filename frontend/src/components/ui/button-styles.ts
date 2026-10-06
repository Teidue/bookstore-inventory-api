/**
 * Estilos de botón en un solo sitio.
 *
 * Es una función y no un componente porque los enlaces de React Router también
 * deben poder parecer botones sin dejar de ser `<a>`: así el aspecto vive en un
 * único lugar y no se duplica una lista larga de utilidades por cada enlace.
 *
 * La acción principal es tinta, no azul. El azul queda libre para señalar lo
 * que está activo o enfocado, que es información; un botón azul en cada
 * pantalla sólo es decoración y compite con esa señal.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft';
export type ButtonSize = 'sm' | 'md' | 'icon' | 'iconSm';

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,box-shadow] duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-1 ' +
  'focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white shadow-card hover:bg-ink/88 active:bg-ink',
  secondary:
    'border border-line-strong bg-surface text-ink shadow-card hover:border-ink-subtle/60 hover:bg-sunken',
  ghost: 'text-ink-muted hover:bg-ink/5 hover:text-ink',
  danger: 'bg-critical text-white shadow-card hover:bg-critical/90',
  dangerSoft: 'border border-transparent text-ink-subtle hover:border-critical/25 hover:bg-critical-soft hover:text-critical',
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
