import { calculateSellingPrice } from './price-calculation';

describe('cálculo del precio de venta', () => {
  it('reproduce exactamente el ejemplo del enunciado', () => {
    // 15.99 USD a 0.85 son 13.59 EUR; con un 40% de margen, 19.03 EUR.
    const result = calculateSellingPrice({ costUsd: '15.99', rate: 0.85, marginPercentage: 40 });

    expect(result.localCost).toBe('13.59');
    expect(result.sellingPrice).toBe('19.03');
  });

  it('no arrastra el error del punto flotante', () => {
    // 0.1 * 3 en coma flotante da 0.30000000000000004.
    const result = calculateSellingPrice({ costUsd: '0.10', rate: 3, marginPercentage: 0 });

    expect(result.localCost).toBe('0.30');
    expect(result.sellingPrice).toBe('0.30');
  });

  it('redondea a 2 decimales hacia arriba en el empate', () => {
    // 10 * 1.005 = 10.05 exactos; con HALF_UP el .005 sube.
    const result = calculateSellingPrice({ costUsd: '10.00', rate: 1.005, marginPercentage: 0 });

    expect(result.localCost).toBe('10.05');
  });

  it('aplica el margen sobre el coste local ya redondeado', () => {
    const result = calculateSellingPrice({ costUsd: '44.99', rate: 0.889, marginPercentage: 40 });

    // 44.99 * 0.889 = 39.996... -> 40.00; 40.00 * 1.4 = 56.00
    expect(result.localCost).toBe('40.00');
    expect(result.sellingPrice).toBe('56.00');
  });

  it('admite un margen de 0 y deja el precio igual al coste local', () => {
    const result = calculateSellingPrice({ costUsd: '20.00', rate: 1, marginPercentage: 0 });

    expect(result.sellingPrice).toBe('20.00');
  });

  it('funciona con tasas muy grandes sin perder precisión', () => {
    const result = calculateSellingPrice({
      costUsd: '15.99',
      rate: 871.37,
      marginPercentage: 40,
    });

    expect(result.localCost).toBe('13933.21');
    expect(result.sellingPrice).toBe('19506.49');
  });
});
