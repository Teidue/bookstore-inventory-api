import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RateSource } from '../books/dto/price-calculation-response.dto';
import { ExchangeRateService } from './exchange-rate.service';

/** Configuración mínima del servicio, con la tasa de respaldo como parámetro. */
function configuration(fallbackRate?: number): ConfigService {
  const values: Record<string, unknown> = {
    EXCHANGE_API_URL: 'https://api.exchangerate-api.com/v4/latest/USD',
    EXCHANGE_TIMEOUT_MS: 5000,
    EXCHANGE_CACHE_TTL_SECONDS: 600,
    EXCHANGE_FALLBACK_RATE: fallbackRate,
  };

  return {
    getOrThrow: (clave: string) => values[clave],
    get: (clave: string) => values[clave],
  } as unknown as ConfigService;
}

function respuestaApi(rates: Record<string, number>) {
  return of({ data: { rates } });
}

describe('ExchangeRateService', () => {
  it('devuelve la tasa de la API y la marca como tal', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ EUR: 0.85 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuration());

    const result = await servicio.getRate('EUR');

    expect(result.rate).toBe(0.85);
    expect(result.source).toBe(RateSource.Api);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('reutiliza la caché en la segunda consulta, sin volver a llamar a la API', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ EUR: 0.85 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuration());

    await servicio.getRate('EUR');
    const segunda = await servicio.getRate('EUR');

    expect(segunda.source).toBe(RateSource.Cache);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('comparte una única petición entre llamadas simultáneas', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ EUR: 0.85 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuration());

    await Promise.all([servicio.getRate('EUR'), servicio.getRate('EUR'), servicio.getRate('EUR')]);

    // Sin la protección contra avalancha habría tres llamadas al tercero.
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('usa la tasa de respaldo cuando la API falla', async () => {
    const http = { get: jest.fn().mockReturnValue(throwError(() => new Error('ETIMEDOUT'))) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuration(0.92));

    const result = await servicio.getRate('EUR');

    expect(result.rate).toBe(0.92);
    expect(result.source).toBe(RateSource.Respaldo);
  });

  it('responde 503 si la API falla y no hay respaldo configurado', async () => {
    const http = { get: jest.fn().mockReturnValue(throwError(() => new Error('ECONNREFUSED'))) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuration());

    await expect(servicio.getRate('EUR')).rejects.toMatchObject({
      status: 503,
      response: { code: 'EXCHANGE_RATE_UNAVAILABLE' },
    });
  });

  it('trata una respuesta sin la moneda pedida como un fallo del tercero', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ MXN: 18.19 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuration(0.92));

    const result = await servicio.getRate('EUR');

    expect(result.source).toBe(RateSource.Respaldo);
  });

  it('rechaza una respuesta con un formato inesperado', async () => {
    const http = { get: jest.fn().mockReturnValue(of({ data: { algo: 'otra cosa' } })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuration(0.92));

    const result = await servicio.getRate('EUR');

    expect(result.source).toBe(RateSource.Respaldo);
  });
});
