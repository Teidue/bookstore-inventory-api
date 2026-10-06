import 'reflect-metadata';
import { validateEnvironment } from './env.validation';

/** Entorno mínimo válido: sólo las variables obligatorias. */
const base = { DB_HOST: 'localhost', DB_USER: 'user', DB_PASSWORD: 'secret', DB_NAME: 'bookstore' };

describe('validación del entorno', () => {
  it('aplica los valores por defecto cuando sólo están las obligatorias', () => {
    const env = validateEnvironment(base);

    expect(env.LOCAL_CURRENCY).toBe('EUR');
    expect(env.PROFIT_MARGIN_PERCENTAGE).toBe(40);
    expect(env.EXCHANGE_FALLBACK_RATE).toBeUndefined();
  });

  it.each([
    ['sin definir', undefined],
    ['vacía', ''],
    ['sólo espacios', '   '],
  ])(
    'EXCHANGE_FALLBACK_RATE %s significa «sin tasa de respaldo» y no impide arrancar',
    (_, value) => {
      // Es la forma documentada de pedir un 503 en lugar de un precio inventado.
      const configuration = value === undefined ? base : { ...base, EXCHANGE_FALLBACK_RATE: value };

      expect(validateEnvironment(configuration).EXCHANGE_FALLBACK_RATE).toBeUndefined();
    },
  );

  it('acepta una tasa de respaldo positiva y la convierte a número', () => {
    expect(
      validateEnvironment({ ...base, EXCHANGE_FALLBACK_RATE: '0.92' }).EXCHANGE_FALLBACK_RATE,
    ).toBe(0.92);
  });

  it.each(['0', '-1', 'abc'])('rechaza una tasa de respaldo inválida (%s)', (value) => {
    expect(() => validateEnvironment({ ...base, EXCHANGE_FALLBACK_RATE: value })).toThrow(
      /EXCHANGE_FALLBACK_RATE/,
    );
  });

  it('indica qué variable obligatoria falta', () => {
    expect(() => validateEnvironment({ DB_USER: 'user', DB_PASSWORD: 'x', DB_NAME: 'n' })).toThrow(
      /DB_HOST/,
    );
  });
});
