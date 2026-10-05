import { Info, TriangleAlert } from 'lucide-react';
import type { CalculoPrecio } from '../../types/api';
import { formatearFechaHora, formatearMoneda, formatearUsd } from '../../utils/formato';

/**
 * Desglose del cálculo de precio.
 *
 * El enunciado pide mostrar al usuario el coste original, la tasa aplicada, el
 * margen y el precio final, no sólo el resultado: así se puede comprobar de
 * dónde sale la cifra.
 */
export function DesglosePrecio({ calculo }: { calculo: CalculoPrecio }) {
  return (
    <div>
      <div className="desglose">
        <div className="desglose__linea">
          <span className="desglose__etiqueta">Coste de importación</span>
          <span className="desglose__valor">{formatearUsd(calculo.cost_usd)}</span>
        </div>
        <div className="desglose__linea">
          <span className="desglose__etiqueta">Tasa de cambio aplicada</span>
          <span className="desglose__valor">
            1 USD = {calculo.exchange_rate} {calculo.currency}
          </span>
        </div>
        <div className="desglose__linea">
          <span className="desglose__etiqueta">Coste en moneda local</span>
          <span className="desglose__valor">
            {formatearMoneda(calculo.cost_local, calculo.currency)}
          </span>
        </div>
        <div className="desglose__linea">
          <span className="desglose__etiqueta">Margen de ganancia</span>
          <span className="desglose__valor">+{calculo.margin_percentage}%</span>
        </div>
        <div className="desglose__linea desglose__linea--total">
          <span className="desglose__etiqueta">Precio de venta sugerido</span>
          <span className="desglose__valor">
            {formatearMoneda(calculo.selling_price_local, calculo.currency)}
          </span>
        </div>
      </div>

      {calculo.rate_source === 'fallback' ? (
        <p className="nota nota--aviso" style={{ marginTop: 16 }}>
          <TriangleAlert size={14} aria-hidden="true" />
          <span>
            La API de tasas no respondió, así que se ha usado la tasa de respaldo configurada.
            Vuelve a calcular más tarde para obtener la tasa real.
          </span>
        </p>
      ) : (
        <p className="nota" style={{ marginTop: 16 }}>
          <Info size={14} aria-hidden="true" />
          <span>
            {calculo.rate_source === 'cache'
              ? 'Tasa reutilizada de una consulta reciente.'
              : 'Tasa obtenida en vivo de la API de cambio.'}{' '}
            Calculado el {formatearFechaHora(calculo.calculation_timestamp)}.
          </span>
        </p>
      )}
    </div>
  );
}
