import { Info, TriangleAlert } from 'lucide-react';
import type { PriceCalculation } from '../../types/api';
import { formatCurrency, formatDateTime, formatUsd } from '../../utils/format';

const ROW = 'flex items-baseline justify-between gap-4 py-2 text-[13px]';
const LABEL = 'text-ink-muted';
const VALUE = 'font-medium tabular text-ink';

/**
 * Desglose del cálculo de precio.
 *
 * El enunciado pide mostrar al usuario el coste original, la tasa aplicada, el
 * margen y el precio final, no sólo el resultado: así se puede comprobar de
 * dónde sale la cifra.
 */
export function PriceBreakdown({ calculation }: { calculation: PriceCalculation }) {
  return (
    <div data-testid="price-breakdown">
      <div className="divide-y divide-line">
        <div className={ROW}>
          <span className={LABEL}>Coste de importación</span>
          <span className={VALUE}>{formatUsd(calculation.cost_usd)}</span>
        </div>
        <div className={ROW}>
          <span className={LABEL}>Tasa de cambio aplicada</span>
          <span className={VALUE}>
            1 USD = {calculation.exchange_rate} {calculation.currency}
          </span>
        </div>
        <div className={ROW}>
          <span className={LABEL}>Coste en moneda local</span>
          <span className={VALUE}>
            {formatCurrency(calculation.cost_local, calculation.currency)}
          </span>
        </div>
        <div className={ROW}>
          <span className={LABEL}>Margen de ganancia</span>
          <span className={VALUE}>+{calculation.margin_percentage}%</span>
        </div>
      </div>

      {/* El resultado se separa del desglose: es la cifra que se busca, no un
          renglón más de la lista. */}
      <div className="animate-pop mt-3 flex items-baseline justify-between gap-4 rounded-xl bg-linear-to-br from-accent-soft to-surface px-4 py-3.5 ring-1 ring-accent/20 ring-inset">
        <span className="text-[13px] font-medium text-ink">Precio de venta sugerido</span>
        <span className="text-[1.25rem] leading-none font-semibold tabular tracking-[-0.02em] text-accent-strong">
          {formatCurrency(calculation.selling_price_local, calculation.currency)}
        </span>
      </div>

      {calculation.rate_source === 'fallback' ? (
        <p className="mt-3.5 flex items-start gap-2 text-[12px] leading-relaxed text-caution">
          <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            La API de tasas no respondió, así que se ha usado la tasa de respaldo configurada.
            Vuelve a calcular más tarde para obtener la tasa real.
          </span>
        </p>
      ) : (
        <p className="mt-3.5 flex items-start gap-2 text-[12px] leading-relaxed text-ink-subtle">
          <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            {calculation.rate_source === 'cache'
              ? 'Tasa reutilizada de una consulta reciente.'
              : 'Tasa obtenida en vivo de la API de cambio.'}{' '}
            Calculado el {formatDateTime(calculation.calculation_timestamp)}.
          </span>
        </p>
      )}
    </div>
  );
}
