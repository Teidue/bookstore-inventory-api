/**
 * Estilos de botón en un solo sitio.
 *
 * Es una función y no un componente porque los enlaces de React Router también
 * deben poder parecer botones sin dejar de ser `<a>`: así el aspecto vive en un
 * único lugar y no se duplica una lista larga de utilidades por cada enlace.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSoft';
export type ButtonSize = 'sm' | 'md' | 'icon';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap ' +
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
  secondary: 'border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  dangerSoft: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  icon: 'h-8 w-8 p-0',
};

export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}
