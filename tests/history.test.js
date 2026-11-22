import { describe, it, expect } from 'vitest';
import { buildRegionShareSeries, parseAggregateTimeSeries } from '../src/utils/transform.js';
import { formatPercentagePoints, formatShare } from '../src/utils/format.js';

// Resposta do SIDRA com vários anos: { id: { ano: valor } }
function sidraTimeSeries(valuesById) {
  return [
    {
      resultados: [
        {
          series: Object.entries(valuesById).map(([id, serie]) => ({
            localidade: { id, nome: `Estado ${id}` },
            serie,
          })),
        },
      ],
    },
  ];
}

// Estados já no formato do mergeStateData (só o que a série usa)
const states = [
  { id: 11, regionAcronym: 'N' },
  { id: 35, regionAcronym: 'SE' },
  { id: 33, regionAcronym: 'SE' },
];

describe('parseAggregateTimeSeries', () => {
  it('devolve um Map por estado com os valores de cada ano', () => {
    const parsed = parseAggregateTimeSeries(sidraTimeSeries({ 11: { 2002: '10', 2003: '...' } }));
    expect(parsed.get(11)).toEqual(
      new Map([
        [2002, 10],
        [2003, null],
      ]),
    );
  });

  it('devolve Map vazio para resposta inesperada', () => {
    expect(parseAggregateTimeSeries(undefined).size).toBe(0);
  });
});

describe('buildRegionShareSeries', () => {
  const response = sidraTimeSeries({
    11: { 2002: '10', 2003: '30' },
    35: { 2002: '60', 2003: '50' },
    33: { 2002: '30', 2003: '20' },
  });

  it('lista os anos em ordem crescente', () => {
    const shuffled = sidraTimeSeries({ 11: { 2003: '1', 2002: '1' } });
    expect(buildRegionShareSeries(states, shuffled).years).toEqual([2002, 2003]);
  });

  it('soma os estados de cada região e divide pelo total do Brasil no mesmo ano', () => {
    const { years, regions } = buildRegionShareSeries(states, response);
    const byAcronym = Object.fromEntries(regions.map((region) => [region.acronym, region.shares]));

    expect(years).toEqual([2002, 2003]);
    expect(byAcronym.N).toEqual([0.1, 0.3]);
    expect(byAcronym.SE).toEqual([0.9, 0.7]);
  });

  it('mantém as cinco regiões na ordem oficial, mesmo sem estados', () => {
    const { regions } = buildRegionShareSeries(states, response);
    expect(regions.map((region) => region.acronym)).toEqual(['N', 'NE', 'CO', 'SE', 'S']);
    expect(regions.find((region) => region.acronym === 'S').shares).toEqual([0, 0]);
  });

  it('as participações de cada ano somam 100%', () => {
    const { regions } = buildRegionShareSeries(states, response);
    const totalOf2003 = regions.reduce((total, region) => total + region.shares[1], 0);
    expect(totalOf2003).toBeCloseTo(1);
  });

  it('ignora estado sem dado no ano (o total usa só quem tem dado)', () => {
    const withGap = sidraTimeSeries({ 11: { 2002: '-' }, 35: { 2002: '75' }, 33: { 2002: '25' } });
    const { regions } = buildRegionShareSeries(states, withGap);
    expect(regions.find((region) => region.acronym === 'N').shares).toEqual([0]);
    expect(regions.find((region) => region.acronym === 'SE').shares).toEqual([1]);
  });

  it('devolve null quando nenhum estado tem dado no ano', () => {
    const empty = sidraTimeSeries({ 11: { 2002: '...' } });
    expect(buildRegionShareSeries(states, empty).regions[0].shares).toEqual([null]);
  });
});

describe('formatPercentagePoints', () => {
  it('mostra a diferença em pontos percentuais, com sinal', () => {
    expect(formatPercentagePoints(0.574 - 0.53)).toBe('+4,4 p.p.');
    expect(formatPercentagePoints(0.53 - 0.574)).toBe('-4,4 p.p.');
  });

  it('não põe sinal quando a diferença arredonda para zero', () => {
    expect(formatPercentagePoints(0)).toBe('0,0 p.p.');
    expect(formatPercentagePoints(-0.0001)).toBe('0,0 p.p.');
  });

  it('mostra o traço para valor ausente', () => {
    expect(formatPercentagePoints(null)).toBe('—');
  });
});

describe('formatShare', () => {
  it('sempre mostra uma casa decimal', () => {
    expect(formatShare(0.53)).toBe('53,0%');
    expect(formatShare(0.5744)).toBe('57,4%');
  });
});
