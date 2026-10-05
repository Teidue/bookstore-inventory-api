import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CodigoError } from '../../common/constants/codigos-error';
import { ExcepcionDominio } from '../../common/exceptions/excepcion-dominio';
import { OrigenTasa } from '../books/dto/calculo-precio-respuesta.dto';
import { ResultadoTasa } from './interfaces/resultado-tasa.interface';

/** Forma mínima que debe tener la respuesta de la API para ser utilizable. */
interface RespuestaTasas {
  rates: Record<string, number>;
}

interface TasasCacheadas {
  rates: Record<string, number>;
  obtenidaEn: Date;
  expiraEn: number;
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
  private readonly tasaRespaldo?: number;

  private cache: TasasCacheadas | null = null;
  /**
   * Petición en vuelo compartida.
   *
   * Si llegan diez cálculos a la vez con la caché vencida, se hace UNA
   * consulta y las diez esperan a la misma promesa, en lugar de diez
   * llamadas idénticas contra un servicio ajeno con cuota.
   */
  private peticionEnCurso: Promise<TasasCacheadas> | null = null;

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
    const respaldo = configService.get<string | number>('EXCHANGE_FALLBACK_RATE');
    const respaldoNumerico = respaldo === undefined || respaldo === '' ? NaN : Number(respaldo);
    this.tasaRespaldo =
      Number.isFinite(respaldoNumerico) && respaldoNumerico > 0 ? respaldoNumerico : undefined;
  }

  /**
   * Devuelve la tasa USD -> `moneda`.
   *
   * Nunca lanza por un fallo del tercero si hay tasa de respaldo configurada:
   * el enunciado pide que el cálculo siga funcionando. Si no la hay, responde
   * 503, que es más honesto que inventar un precio de venta.
   */
  async obtenerTasa(moneda: string): Promise<ResultadoTasa> {
    const codigo = moneda.toUpperCase();

    const cacheVigente = this.cacheVigente();
    if (cacheVigente) {
      const tasa = cacheVigente.rates[codigo];
      if (typeof tasa === 'number') {
        return { tasa, origen: OrigenTasa.Cache, obtenidaEn: cacheVigente.obtenidaEn };
      }
    }

    try {
      const tasas = await this.consultarConPeticionCompartida();
      const tasa = tasas.rates[codigo];

      if (typeof tasa !== 'number' || !Number.isFinite(tasa) || tasa <= 0) {
        throw new Error(`La API no devuelve una tasa válida para ${codigo}.`);
      }

      return { tasa, origen: OrigenTasa.Api, obtenidaEn: tasas.obtenidaEn };
    } catch (error) {
      return this.recurrirAlRespaldo(codigo, error);
    }
  }

  private cacheVigente(): TasasCacheadas | null {
    if (this.cache && this.cache.expiraEn > Date.now()) return this.cache;
    return null;
  }

  private async consultarConPeticionCompartida(): Promise<TasasCacheadas> {
    this.peticionEnCurso ??= this.consultar().finally(() => {
      this.peticionEnCurso = null;
    });

    return this.peticionEnCurso;
  }

  private async consultar(): Promise<TasasCacheadas> {
    const respuesta = await firstValueFrom(
      this.http.get<RespuestaTasas>(this.url, { timeout: this.timeoutMs }),
    );

    const rates = respuesta.data?.rates;
    if (!rates || typeof rates !== 'object') {
      throw new Error('La respuesta de la API de tasas no tiene el formato esperado.');
    }

    const tasas: TasasCacheadas = {
      rates,
      obtenidaEn: new Date(),
      expiraEn: Date.now() + this.ttlMs,
    };

    this.cache = tasas;
    return tasas;
  }

  private recurrirAlRespaldo(codigo: string, error: unknown): ResultadoTasa {
    const motivo = error instanceof Error ? error.message : String(error);

    if (this.tasaRespaldo === undefined) {
      this.logger.error(`Sin tasa para ${codigo} y sin respaldo configurado: ${motivo}`);
      throw ExcepcionDominio.servicioNoDisponible(
        CodigoError.TASA_CAMBIO_NO_DISPONIBLE,
        'El servicio de tasas de cambio no está disponible. Inténtalo de nuevo más tarde.',
      );
    }

    this.logger.warn(`Tasa de respaldo para ${codigo} (${this.tasaRespaldo}): ${motivo}`);
    return { tasa: this.tasaRespaldo, origen: OrigenTasa.Respaldo, obtenidaEn: new Date() };
  }
}
