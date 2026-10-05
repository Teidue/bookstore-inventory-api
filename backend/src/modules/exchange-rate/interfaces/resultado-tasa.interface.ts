import { OrigenTasa } from '../../books/dto/calculo-precio-respuesta.dto';

export interface ResultadoTasa {
  /** Cuántas unidades de la moneda local equivalen a 1 USD. */
  tasa: number;
  /** De dónde salió: API en vivo, caché o tasa de respaldo. */
  origen: OrigenTasa;
  /** Momento en que se obtuvo de la API (no en que se leyó de la caché). */
  obtenidaEn: Date;
}
