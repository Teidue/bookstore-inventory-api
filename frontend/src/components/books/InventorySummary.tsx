import { Boxes, CircleSlash, TriangleAlert, type LucideIcon } from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '../../config';
import type { InventoryCounts } from '../../types/api';

interface InventorySummaryProps {
  counts: InventoryCounts | null;
  /** Filtro activo de stock bajo, para marcar la tarjeta correspondiente. */
  activeThreshold: string;
  onFilterLowStock: (threshold: string) => void;
}

type Tone = 'accent' | 'caution' | 'critical';

interface CardProps {
  label: string;
  hint: string;
  value: number | null;
  icon: LucideIcon;
  tone: Tone;
  active: boolean;
  delay: number;
  onClick?: () => void;
}

/** Cada tarjeta tiene su color: el icono tintado se asocia al estado de un vistazo. */
const CHIP: Record<Tone, string> = {
  accent: 'bg-accent-soft text-accent',
  caution: 'bg-caution-soft text-caution',
  critical: 'bg-critical-soft text-critical',
};

const ACTIVE: Record<Tone, string> = {
  accent: 'border-accent/50 ring-accent/25',
  caution: 'border-caution/50 ring-caution/25',
  critical: 'border-critical/50 ring-critical/25',
};

function SummaryCard({ label, hint, value, icon: Icon, tone, active, delay, onClick }: CardProps) {
  const interactive = onClick !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? active : undefined}
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-rise group flex items-center gap-4 rounded-xl border bg-surface px-4 py-4 text-left shadow-card transition-[border-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        active ? `${ACTIVE[tone]} ring-2` : 'border-line'
      } ${
        interactive
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-raised'
          : 'cursor-default'
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 ${CHIP[tone]} ${
          interactive ? 'group-hover:scale-105' : ''
        }`}
        aria-hidden="true"
      >
        <Icon size={20} strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-ink-muted">{label}</p>
        <p className="mt-1 text-[1.65rem] leading-none font-semibold tabular tracking-[-0.025em] text-ink">
          {/* El guion ocupa el mismo sitio que la cifra: al llegar el dato no
              se mueve nada de lo que hay debajo. */}
          {value === null ? <span className="text-ink-subtle">—</span> : value}
        </p>
        <p className="mt-1.5 truncate text-[11px] text-ink-subtle">{hint}</p>
      </div>
    </button>
  );
}

/**
 * Cifras de cabecera del inventario.
 *
 * El enunciado pide poder "visualizar rápidamente los libros con inventario
 * bajo". Una tabla paginada no responde a eso: hay que recorrerla. Estas tres
 * cifras sí, y además las dos de aviso son el propio filtro, así que la
 * respuesta a "¿cuántos?" lleva directa a "¿cuáles?".
 */
export function InventorySummary({
  counts,
  activeThreshold,
  onFilterLowStock,
}: InventorySummaryProps) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3" data-testid="inventory-summary">
      <SummaryCard
        label="Libros en catálogo"
        hint="Títulos distintos dados de alta"
        value={counts?.total ?? null}
        icon={Boxes}
        tone="accent"
        active={false}
        delay={0}
      />
      <SummaryCard
        label="Inventario bajo"
        hint={`Stock igual o menor que ${LOW_STOCK_THRESHOLD}`}
        value={counts?.lowStock ?? null}
        icon={TriangleAlert}
        tone="caution"
        active={activeThreshold === String(LOW_STOCK_THRESHOLD)}
        delay={60}
        onClick={() => onFilterLowStock(String(LOW_STOCK_THRESHOLD))}
      />
      <SummaryCard
        label="Agotados"
        hint="Sin unidades disponibles"
        value={counts?.outOfStock ?? null}
        icon={CircleSlash}
        tone="critical"
        active={activeThreshold === '0'}
        delay={120}
        onClick={() => onFilterLowStock('0')}
      />
    </div>
  );
}
