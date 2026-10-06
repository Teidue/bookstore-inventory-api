import { LOW_STOCK_THRESHOLD } from '../../config';
import { Badge } from './Badge';

interface StockBadgeProps {
  quantity: number;
  threshold?: number;
}

/**
 * Estado del inventario de un libro.
 *
 * El enunciado pide "visualizar rápidamente los libros con inventario bajo": el
 * color hace ese trabajo, y el texto lo explica para quien no distinga colores.
 */
export function StockBadge({ quantity, threshold = LOW_STOCK_THRESHOLD }: StockBadgeProps) {
  if (quantity === 0) {
    return (
      <Badge tone="danger" withDot>
        Agotado
      </Badge>
    );
  }

  if (quantity <= threshold) {
    return (
      <Badge tone="warning" withDot>
        {quantity} · stock bajo
      </Badge>
    );
  }

  return (
    <Badge tone="success" withDot>
      {quantity} en stock
    </Badge>
  );
}
