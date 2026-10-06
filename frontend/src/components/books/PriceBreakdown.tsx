import { Info, TriangleAlert } from 'lucide-react';
import type { PriceCalculation } from '../../types/api';
import { formatCurrency, formatDateTime, formatUsd } from '../../utils/format';

const ROW = 'flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm';
const LABEL = 'text-slate-500';
const VALUE = 'font-semibold tabular-nums text-slate-900';

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
      <div className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
        <div className={`${ROW} bg-blue-50`}>
          <span className="font-semibold text-slate-900">Precio de venta sugerido</span>
          <span className="text-lg font-bold tabular-nums text-blue-700">
            {formatCurrency(calculation.selling_price_local, calculation.currency)}
          </span>
        </div>
      </div>

      {calculation.rate_source === 'fallback' ? (
        <p className="mt-4 flex items-start gap-2 text-xs text-amber-700">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            La API de tasas no respondió, así que se ha usado la tasa de respaldo configurada.
            Vuelve a calcular más tarde para obtener la tasa real.
          </span>
        </p>
      ) : (
        <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
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
