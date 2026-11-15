import { describe, it, expect } from 'vitest';
import {
  parseSidraValue,
  parseAggregateSeries,
  calculatePerCapita,
  mergeStateData,
} from '../src/utils/transform.js';

// Monta uma resposta no mesmo formato aninhado do SIDRA
function sidraResponse(values) {
  return [
    {
      resultados: [
        {
          series: Object.entries(values).map(([id, value]) => ({
            localidade: { id, nome: `Estado ${id}` },
            serie: { 2022: value },
          })),
        },
      ],
    },
  ];
}

const states = [
  { id: 11, sigla: 'RO', nome: 'Rondônia', regiao: { id: 1, sigla: 'N', nome: 'Norte' } },
  { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul', regiao: { id: 4, sigla: 'S', nome: 'Sul' } },
];

describe('parseSidraValue', () => {
  it('converte texto numérico em número', () => {
    expect(parseSidraValue('1581196')).toBe(1581196);
  });

  it.each(['...', '-', 'X', '', undefined])('devolve null para dado ausente (%s)', (value) => {
    expect(parseSidraValue(value)).toBeNull();
  });
});

describe('parseAggregateSeries', () => {
  it('desaninha a resposta em um Map com id numérico', () => {
    const result = parseAggregateSeries(sidraResponse({ 11: '100', 43: '200' }));

    expect(result.get(11)).toBe(100);
    expect(result.get(43)).toBe(200);
    expect(result.size).toBe(2);
  });

  it('devolve um Map vazio para resposta vazia ou inválida', () => {
    expect(parseAggregateSeries([]).size).toBe(0);
    expect(parseAggregateSeries(undefined).size).toBe(0);
  });
});

describe('calculatePerCapita', () => {
  it('divide o PIB pela população', () => {
    expect(calculatePerCapita(1000, 4)).toBe(250);
  });

  it('devolve null quando falta PIB ou população', () => {
    expect(calculatePerCapita(null, 4)).toBeNull();
    expect(calculatePerCapita(1000, null)).toBeNull();
    expect(calculatePerCapita(1000, 0)).toBeNull();
  });
});

describe('mergeStateData', () => {
  it('junta estados, população e PIB e converte o PIB para reais', () => {
    const result = mergeStateData(
      states,
      sidraResponse({ 11: '1000', 43: '2000' }),
      sidraResponse({ 11: '50', 43: '300' }),
    );

    expect(result[0]).toEqual({
      id: 11,
      acronym: 'RO',
      name: 'Rondônia',
      regionAcronym: 'N',
      regionName: 'Norte',
      population: 1000,
      gdp: 50000,
      gdpPerCapita: 50,
    });
    expect(result[1].gdpPerCapita).toBe(150);
  });

  it('mantém o estado com null quando falta dado na API', () => {
    const result = mergeStateData(
      states,
      sidraResponse({ 11: '1000' }),
      sidraResponse({ 11: '...' }),
    );

    expect(result[0].gdp).toBeNull();
    expect(result[0].gdpPerCapita).toBeNull();
    expect(result[1].population).toBeNull();
  });
});
