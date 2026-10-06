import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ErrorCode } from '../../common/constants/error-codes';
import { DomainException } from '../../common/exceptions/domain-exception';
import { RateSource } from '../books/dto/price-calculation-response.dto';
import { RateResult } from './interfaces/rate-result.interface';

/** Forma mínima que debe tener la respuesta de la API para ser utilizable. */
interface RatesResponse {
  rates: Record<string, number>;
}

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: Date;
  expiresAt: number;
}

/**
 * Acceso a la API de tasas de cambio.
 *
 * Toda la fragilidad de depender de un tercero vive aquí: tiempo de espera
 * acotado, caché, protección contra peticiones simultáneas y tasa de respaldo.
 * El resto de la aplicación sólo pide una tasa y recibe, además, de dónde
 * salió.
 */
@Injectable()
export class ExchangeRateService {
  private readonly logger = new Logger(ExchangeRateService.name);
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly ttlMs: number;
  private readonly fallbackRate?: number;

  private cache: CachedRates | null = null;
  /**
   * Petición en vuelo compartida.
   *
   * Si llegan diez cálculos a la vez con la caché vencida, se hace UNA
   * consulta y las diez esperan a la misma promesa, en lugar de diez
   * llamadas idénticas contra un servicio ajeno con cuota.
   */
  private inFlightRequest: Promise<CachedRates> | null = null;

  constructor(
    private readonly http: HttpService,
    configService: ConfigService,
  ) {
    this.url = configService.getOrThrow<string>('EXCHANGE_API_URL');
    this.timeoutMs = configService.getOrThrow<number>('EXCHANGE_TIMEOUT_MS');
    this.ttlMs = configService.getOrThrow<number>('EXCHANGE_CACHE_TTL_SECONDS') * 1000;
    // Una variable vacía en el entorno llega como cadena vacía, no como
    // `undefined`: sin esta normalización, "sin respaldo" se interpretaría
    // como una tasa válida y el precio saldría NaN en lugar de un 503.
    const fallback = configService.get<string | number>('EXCHANGE_FALLBACK_RATE');
    const numericFallback = fallback === undefined || fallback === '' ? NaN : Number(fallback);
    this.fallbackRate =
      Number.isFinite(numericFallback) && numericFallback > 0 ? numericFallback : undefined;
  }

  /**
   * Devuelve la tasa USD -> `moneda`.
   *
   * Nunca lanza por un fallo del tercero si hay tasa de respaldo configurada:
   * el enunciado pide que el cálculo siga funcionando. Si no la hay, responde
   * 503, que es más honesto que inventar un precio de venta.
   */
  async getRate(currency: string): Promise<RateResult> {
    const code = currency.toUpperCase();

    const validCache = this.validCache();
    if (validCache) {
      const rate = validCache.rates[code];
      if (typeof rate === 'number') {
        return { rate, source: RateSource.Cache, fetchedAt: validCache.fetchedAt };
      }
    }

    try {
      const rates = await this.fetchRatesOnce();
      const rate = rates.rates[code];

      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
        throw new Error(`La API no devuelve una tasa válida para ${code}.`);
      }

      return { rate, source: RateSource.Api, fetchedAt: rates.fetchedAt };
    } catch (error) {
      return this.useFallbackRate(code, error);
    }
  }

  private validCache(): CachedRates | null {
    if (this.cache && this.cache.expiresAt > Date.now()) return this.cache;
    return null;
  }

  private async fetchRatesOnce(): Promise<CachedRates> {
    this.inFlightRequest ??= this.fetchRates().finally(() => {
      this.inFlightRequest = null;
    });

    return this.inFlightRequest;
  }

  private async fetchRates(): Promise<CachedRates> {
    const response = await firstValueFrom(
      this.http.get<RatesResponse>(this.url, { timeout: this.timeoutMs }),
    );

    const rates = response.data?.rates;
    if (!rates || typeof rates !== 'object') {
      throw new Error('La respuesta de la API de tasas no tiene el formato esperado.');
    }

    const cached: CachedRates = {
      rates,
      fetchedAt: new Date(),
      expiresAt: Date.now() + this.ttlMs,
    };

    this.cache = cached;
    return cached;
  }

  private useFallbackRate(code: string, error: unknown): RateResult {
    const reason = error instanceof Error ? error.message : String(error);

    if (this.fallbackRate === undefined) {
      this.logger.error(`Sin tasa para ${code} y sin respaldo configurado: ${reason}`);
      throw DomainException.serviceUnavailable(
        ErrorCode.EXCHANGE_RATE_UNAVAILABLE,
        'El servicio de tasas de cambio no está disponible. Inténtalo de nuevo más tarde.',
      );
    }

    this.logger.warn(`Tasa de respaldo para ${code} (${this.fallbackRate}): ${reason}`);
    return { rate: this.fallbackRate, source: RateSource.Respaldo, fetchedAt: new Date() };
  }
}
