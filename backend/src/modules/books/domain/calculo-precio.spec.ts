import { calcularPrecioVenta } from './calculo-precio';

describe('cálculo del precio de venta', () => {
  it('reproduce exactamente el ejemplo del enunciado', () => {
    // 15.99 USD a 0.85 son 13.59 EUR; con un 40% de margen, 19.03 EUR.
    const resultado = calcularPrecioVenta({ costeUsd: '15.99', tasa: 0.85, margenPorcentaje: 40 });

    expect(resultado.costeLocal).toBe('13.59');
    expect(resultado.precioVenta).toBe('19.03');
  });

  it('no arrastra el error del punto flotante', () => {
    // 0.1 * 3 en coma flotante da 0.30000000000000004.
    const resultado = calcularPrecioVenta({ costeUsd: '0.10', tasa: 3, margenPorcentaje: 0 });

    expect(resultado.costeLocal).toBe('0.30');
    expect(resultado.precioVenta).toBe('0.30');
  });

  it('redondea a 2 decimales hacia arriba en el empate', () => {
    // 10 * 1.005 = 10.05 exactos; con HALF_UP el .005 sube.
    const resultado = calcularPrecioVenta({ costeUsd: '10.00', tasa: 1.005, margenPorcentaje: 0 });

    expect(resultado.costeLocal).toBe('10.05');
  });

  it('aplica el margen sobre el coste local ya redondeado', () => {
    const resultado = calcularPrecioVenta({ costeUsd: '44.99', tasa: 0.889, margenPorcentaje: 40 });

    // 44.99 * 0.889 = 39.996... -> 40.00; 40.00 * 1.4 = 56.00
    expect(resultado.costeLocal).toBe('40.00');
    expect(resultado.precioVenta).toBe('56.00');
  });

  it('admite un margen de 0 y deja el precio igual al coste local', () => {
    const resultado = calcularPrecioVenta({ costeUsd: '20.00', tasa: 1, margenPorcentaje: 0 });

    expect(resultado.precioVenta).toBe('20.00');
  });

  it('funciona con tasas muy grandes sin perder precisión', () => {
    const resultado = calcularPrecioVenta({
      costeUsd: '15.99',
      tasa: 871.37,
      margenPorcentaje: 40,
    });

    expect(resultado.costeLocal).toBe('13933.21');
    expect(resultado.precioVenta).toBe('19506.49');
  });
});
