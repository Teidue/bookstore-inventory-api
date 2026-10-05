import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { OrigenTasa } from '../books/dto/calculo-precio-respuesta.dto';
import { ExchangeRateService } from './exchange-rate.service';

/** Configuración mínima del servicio, con la tasa de respaldo como parámetro. */
function configuracion(tasaRespaldo?: number): ConfigService {
  const valores: Record<string, unknown> = {
    EXCHANGE_API_URL: 'https://api.exchangerate-api.com/v4/latest/USD',
    EXCHANGE_TIMEOUT_MS: 5000,
    EXCHANGE_CACHE_TTL_SECONDS: 600,
    EXCHANGE_FALLBACK_RATE: tasaRespaldo,
  };

  return {
    getOrThrow: (clave: string) => valores[clave],
    get: (clave: string) => valores[clave],
  } as unknown as ConfigService;
}

function respuestaApi(rates: Record<string, number>) {
  return of({ data: { rates } });
}

describe('ExchangeRateService', () => {
  it('devuelve la tasa de la API y la marca como tal', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ EUR: 0.85 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuracion());

    const resultado = await servicio.obtenerTasa('EUR');

    expect(resultado.tasa).toBe(0.85);
    expect(resultado.origen).toBe(OrigenTasa.Api);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('reutiliza la caché en la segunda consulta, sin volver a llamar a la API', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ EUR: 0.85 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuracion());

    await servicio.obtenerTasa('EUR');
    const segunda = await servicio.obtenerTasa('EUR');

    expect(segunda.origen).toBe(OrigenTasa.Cache);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('comparte una única petición entre llamadas simultáneas', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ EUR: 0.85 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuracion());

    await Promise.all([
      servicio.obtenerTasa('EUR'),
      servicio.obtenerTasa('EUR'),
      servicio.obtenerTasa('EUR'),
    ]);

    // Sin la protección contra avalancha habría tres llamadas al tercero.
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('usa la tasa de respaldo cuando la API falla', async () => {
    const http = { get: jest.fn().mockReturnValue(throwError(() => new Error('ETIMEDOUT'))) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuracion(0.92));

    const resultado = await servicio.obtenerTasa('EUR');

    expect(resultado.tasa).toBe(0.92);
    expect(resultado.origen).toBe(OrigenTasa.Respaldo);
  });

  it('responde 503 si la API falla y no hay respaldo configurado', async () => {
    const http = { get: jest.fn().mockReturnValue(throwError(() => new Error('ECONNREFUSED'))) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuracion());

    await expect(servicio.obtenerTasa('EUR')).rejects.toMatchObject({
      status: 503,
      response: { code: 'TASA_CAMBIO_NO_DISPONIBLE' },
    });
  });

  it('trata una respuesta sin la moneda pedida como un fallo del tercero', async () => {
    const http = { get: jest.fn().mockReturnValue(respuestaApi({ MXN: 18.19 })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuracion(0.92));

    const resultado = await servicio.obtenerTasa('EUR');

    expect(resultado.origen).toBe(OrigenTasa.Respaldo);
  });

  it('rechaza una respuesta con un formato inesperado', async () => {
    const http = { get: jest.fn().mockReturnValue(of({ data: { algo: 'otra cosa' } })) };
    const servicio = new ExchangeRateService(http as unknown as HttpService, configuracion(0.92));

    const resultado = await servicio.obtenerTasa('EUR');

    expect(resultado.origen).toBe(OrigenTasa.Respaldo);
  });
});
