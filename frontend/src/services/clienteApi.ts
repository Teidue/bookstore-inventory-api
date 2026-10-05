import type { ErrorApi } from '../types/api';

const URL_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TIEMPO_MAXIMO_MS = 15_000;

/**
 * Error de la API ya normalizado.
 *
 * Transporta el `code` del backend para que los componentes decidan sobre un
 * identificador estable (`ISBN_DUPLICADO`, `TASA_CAMBIO_NO_DISPONIBLE`) en
 * lugar de sobre el texto del mensaje.
 */
export class ErrorPeticion extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: string[];

  constructor(statusCode: number, code: string, message: string, details?: string[]) {
    super(message);
    this.name = 'ErrorPeticion';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  /** El servicio de tasas no respondió: merece un mensaje distinto al genérico. */
  get esServicioNoDisponible(): boolean {
    return this.statusCode === 503;
  }
}

interface OpcionesPeticion {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  parametros?: Record<string, string | number | boolean | undefined>;
  señal?: AbortSignal;
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, parametros, señal } = opciones;

  const url = new URL(ruta, URL_BASE);
  if (parametros) {
    for (const [clave, valor] of Object.entries(parametros)) {
      // Los filtros vacíos no se envían: `?category=` sería un filtro por
      // cadena vacía, no "sin filtro".
      if (valor === undefined || valor === '') continue;
      url.searchParams.set(clave, String(valor));
    }
  }

  // Una petición sin límite de tiempo deja la interfaz cargando para siempre
  // si el servidor deja de responder a medias.
  const limite = AbortSignal.timeout(TIEMPO_MAXIMO_MS);
  const control = señal ? AbortSignal.any([señal, limite]) : limite;

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: control,
    });
  } catch (error) {
    // Cancelación deliberada del componente: no es un error que mostrar.
    if (señal?.aborted) throw error;

    throw new ErrorPeticion(
      0,
      'SIN_CONEXION',
      'No se pudo contactar con el servidor. Comprueba que la API está en marcha.',
    );
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const datos: unknown = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = (datos ?? {}) as Partial<ErrorApi>;
    throw new ErrorPeticion(
      respuesta.status,
      error.code ?? 'ERROR_DESCONOCIDO',
      error.message ?? 'Ha ocurrido un error inesperado.',
      error.details,
    );
  }

  return datos as T;
}
