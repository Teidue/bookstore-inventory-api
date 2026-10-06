import { Boxes, CircleSlash, TriangleAlert, type LucideIcon } from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '../../config';
import type { InventoryCounts } from '../../types/api';

interface InventorySummaryProps {
  counts: InventoryCounts | null;
  /** Filtro activo de stock bajo, para marcar la tarjeta correspondiente. */
  activeThreshold: string;
  onFilterLowStock: (threshold: string) => void;
}

interface CardProps {
  label: string;
  hint: string;
  value: number | null;
  icon: LucideIcon;
  tone: 'neutral' | 'caution' | 'critical';
  active: boolean;
  onClick?: () => void;
}

const TONES = {
  neutral: 'text-ink-subtle',
  caution: 'text-caution',
  critical: 'text-critical',
} as const;

function SummaryCard({ label, hint, value, icon: Icon, tone, active, onClick }: CardProps) {
  const interactive = onClick !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? active : undefined}
      className={`flex items-start justify-between gap-3 rounded-xl border bg-surface px-4 py-3.5 text-left shadow-card transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 ${
        active ? 'border-accent ring-1 ring-accent/20' : 'border-line'
      } ${interactive ? 'cursor-pointer hover:border-ink-subtle/50 hover:shadow-raised' : 'cursor-default'}`}
    >
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-ink-muted">{label}</p>
        <p className="mt-1.5 text-[1.6rem] leading-none font-semibold tabular tracking-[-0.02em] text-ink">
          {/* El guion ocupa el mismo sitio que la cifra: al llegar el dato no
              se mueve nada de lo que hay debajo. */}
          {value === null ? <span className="text-ink-subtle">—</span> : value}
        </p>
        <p className="mt-1.5 text-[11px] text-ink-subtle">{hint}</p>
      </div>
      <Icon size={17} className={`shrink-0 ${TONES[tone]}`} aria-hidden="true" />
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
        tone="neutral"
        active={false}
      />
      <SummaryCard
        label="Inventario bajo"
        hint={`Stock igual o menor que ${LOW_STOCK_THRESHOLD}`}
        value={counts?.lowStock ?? null}
        icon={TriangleAlert}
        tone="caution"
        active={activeThreshold === String(LOW_STOCK_THRESHOLD)}
        onClick={() => onFilterLowStock(String(LOW_STOCK_THRESHOLD))}
      />
      <SummaryCard
        label="Agotados"
        hint="Sin unidades disponibles"
        value={counts?.outOfStock ?? null}
        icon={CircleSlash}
        tone="critical"
        active={activeThreshold === '0'}
        onClick={() => onFilterLowStock('0')}
      />
    </div>
  );
}
