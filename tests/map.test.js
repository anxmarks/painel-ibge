import { describe, it, expect } from 'vitest';
import { geoArea } from 'd3-geo';
import { classify, computeQuantileBreaks, mapIndicatorFor, rewindForD3 } from '../src/utils/map.js';

describe('mapIndicatorFor', () => {
  it('troca totais pela taxa correspondente', () => {
    expect(mapIndicatorFor('population')).toBe('density');
    expect(mapIndicatorFor('gdp')).toBe('gdpPerCapita');
  });

  it('mantém indicadores que já são taxas', () => {
    expect(mapIndicatorFor('density')).toBe('density');
    expect(mapIndicatorFor('gdpPerCapita')).toBe('gdpPerCapita');
  });
});

describe('computeQuantileBreaks', () => {
  it('divide os valores em faixas com o mesmo número de itens', () => {
    // 0..10 em 5 faixas: limites nos quantis 20%, 40%, 60% e 80%
    const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(computeQuantileBreaks(values, 5)).toEqual([2, 4, 6, 8]);
  });

  it('não depende da ordem dos valores', () => {
    expect(computeQuantileBreaks([10, 0, 5], 2)).toEqual([5]);
  });

  it('interpola entre dois valores vizinhos', () => {
    expect(computeQuantileBreaks([0, 10], 2)).toEqual([5]);
  });

  it('ignora valores ausentes', () => {
    expect(computeQuantileBreaks([null, 0, 10, NaN], 2)).toEqual([5]);
  });

  it('devolve lista vazia quando não há valores', () => {
    expect(computeQuantileBreaks([null], 5)).toEqual([]);
  });

  it('acompanha dados assimétricos, como a densidade', () => {
    // Muitos valores baixos e poucos altos: os limites ficam perto dos valores baixos
    const breaks = computeQuantileBreaks([2, 3, 4, 5, 6, 7, 8, 9, 400, 500], 2);
    expect(breaks).toEqual([6.5]);
  });
});

describe('classify', () => {
  const breaks = [10, 20, 30];

  it('devolve o índice da faixa (0 é a mais baixa)', () => {
    expect(classify(5, breaks)).toBe(0);
    expect(classify(15, breaks)).toBe(1);
    expect(classify(35, breaks)).toBe(3);
  });

  it('valor igual ao limite fica na faixa de baixo', () => {
    expect(classify(10, breaks)).toBe(0);
    expect(classify(20, breaks)).toBe(1);
  });

  it('devolve null para valor ausente', () => {
    expect(classify(null, breaks)).toBeNull();
    expect(classify(NaN, breaks)).toBeNull();
  });
});

describe('rewindForD3', () => {
  // Um quadrado de 1° x 1° perto de Brasília
  const ring = [
    [-48, -16],
    [-47, -16],
    [-47, -15],
    [-48, -15],
    [-48, -16],
  ];
  const polygon = (coordinates) => ({
    type: 'Feature',
    properties: { codarea: '53' },
    geometry: { type: 'Polygon', coordinates: [coordinates] },
  });

  it('inverte o polígono no sentido do padrão GeoJSON (que o d3 lê como o globo inteiro)', () => {
    const feature = polygon(ring); // anti-horário, como vem da API do IBGE
    expect(geoArea(feature)).toBeGreaterThan(2 * Math.PI);

    const rewound = rewindForD3(feature);
    expect(geoArea(rewound)).toBeLessThan(0.001); // agora é só o quadradinho
    expect(rewound.properties).toEqual(feature.properties);
  });

  it('não mexe no polígono que já está no sentido do d3', () => {
    const feature = polygon([...ring].reverse());
    expect(rewindForD3(feature)).toBe(feature);
  });

  it('também funciona com MultiPolygon (estados com ilhas)', () => {
    const feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'MultiPolygon', coordinates: [[ring], [ring]] },
    };
    expect(geoArea(rewindForD3(feature))).toBeLessThan(0.001);
  });

  it('não altera o objeto original', () => {
    const feature = polygon(ring);
    rewindForD3(feature);
    expect(feature.geometry.coordinates[0][1]).toEqual([-47, -16]);
  });
});
