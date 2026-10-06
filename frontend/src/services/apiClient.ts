import type { ApiError } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const TIMEOUT_MS = 15_000;

/**
 * Error de la API ya normalizado.
 *
 * Transporta el `code` del backend para que los componentes decidan sobre un
 * identificador estable (`DUPLICATE_ISBN`, `EXCHANGE_RATE_UNAVAILABLE`) en
 * lugar de sobre el texto del mensaje.
 */
export class RequestError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: string[];

  constructor(statusCode: number, code: string, message: string, details?: string[]) {
    super(message);
    this.name = 'RequestError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  /** El servicio de tasas no respondió: merece un mensaje distinto al genérico. */
  get isServiceUnavailable(): boolean {
    return this.statusCode === 503;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, signal } = options;

  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      // Los filtros vacíos no se envían: `?category=` sería un filtro por
      // cadena vacía, no "sin filtro".
      if (value === undefined || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  // Una petición sin límite de tiempo deja la interfaz cargando para siempre
  // si el servidor deja de responder a medias.
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const controller = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller,
    });
  } catch (error) {
    // Cancelación deliberada del componente: no es un error que mostrar.
    if (signal?.aborted) throw error;

    throw new RequestError(
      0,
      'NETWORK_ERROR',
      'No se pudo contactar con el servidor. Comprueba que la API está en marcha.',
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (data ?? {}) as Partial<ApiError>;
    throw new RequestError(
      response.status,
      error.code ?? 'UNKNOWN_ERROR',
      error.message ?? 'Ha ocurrido un error inesperado.',
      error.details,
    );
  }

  return data as T;
}
