import { describe, it, expect } from 'vitest';
import {
  parseSidraValue,
  parseAggregateSeries,
  calculatePerCapita,
  mergeStateData,
  sumBy,
  summarizeStates,
  rankStates,
  groupByRegion,
  filterByRegion,
  normalizeText,
  searchStates,
  sortStates,
} from '../src/utils/transform.js';
import { ALL_REGIONS } from '../src/config.js';

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

describe('sumBy', () => {
  it('soma a propriedade ignorando valores null', () => {
    expect(sumBy([{ gdp: 10 }, { gdp: null }, { gdp: 5 }], 'gdp')).toBe(15);
  });

  it('devolve 0 para lista vazia', () => {
    expect(sumBy([], 'gdp')).toBe(0);
  });
});

describe('summarizeStates', () => {
  it('calcula o per capita pelo total, e não pela média dos estados', () => {
    const result = summarizeStates([
      { population: 100, gdp: 1000 }, // per capita 10
      { population: 900, gdp: 18000 }, // per capita 20
    ]);

    expect(result).toEqual({ stateCount: 2, population: 1000, gdp: 19000, gdpPerCapita: 19 });
  });

  it('deixa estados sem PIB fora do cálculo do per capita', () => {
    const result = summarizeStates([
      { population: 100, gdp: 1000 },
      { population: 900, gdp: null },
    ]);

    expect(result.population).toBe(1000);
    expect(result.gdpPerCapita).toBe(10);
  });

  it('devolve per capita null para lista vazia', () => {
    expect(summarizeStates([]).gdpPerCapita).toBeNull();
  });
});

describe('rankStates', () => {
  const sample = [
    { acronym: 'AC', gdp: 10 },
    { acronym: 'SP', gdp: 300 },
    { acronym: 'RR', gdp: null },
    { acronym: 'RS', gdp: 50 },
  ];

  it('ordena do maior para o menor e tira os valores null', () => {
    expect(rankStates(sample, 'gdp').map((state) => state.acronym)).toEqual(['SP', 'RS', 'AC']);
  });

  it('não altera o array original', () => {
    rankStates(sample, 'gdp');
    expect(sample[0].acronym).toBe('AC');
  });
});

describe('groupByRegion', () => {
  it('soma por região na ordem oficial e ignora regiões sem estados', () => {
    const result = groupByRegion([
      { regionAcronym: 'S', population: 10, gdp: 100 },
      { regionAcronym: 'N', population: 5, gdp: 20 },
      { regionAcronym: 'S', population: 30, gdp: 300 },
    ]);

    expect(result.map((region) => region.acronym)).toEqual(['N', 'S']);
    expect(result[1]).toMatchObject({
      name: 'Sul',
      stateCount: 2,
      population: 40,
      gdp: 400,
      gdpPerCapita: 10,
    });
  });
});

describe('filterByRegion', () => {
  const sample = [
    { acronym: 'SP', regionAcronym: 'SE' },
    { acronym: 'BA', regionAcronym: 'NE' },
    { acronym: 'RJ', regionAcronym: 'SE' },
  ];

  it('mantém só os estados da região', () => {
    expect(filterByRegion(sample, 'SE').map((state) => state.acronym)).toEqual(['SP', 'RJ']);
  });

  it('devolve todos os estados com ALL_REGIONS', () => {
    expect(filterByRegion(sample, ALL_REGIONS)).toHaveLength(3);
  });
});

describe('normalizeText', () => {
  it('tira acentos, espaços das pontas e deixa minúsculo', () => {
    expect(normalizeText('  São Paulo ')).toBe('sao paulo');
  });
});

describe('searchStates', () => {
  const sample = [
    { name: 'São Paulo', acronym: 'SP' },
    { name: 'Paraná', acronym: 'PR' },
    { name: 'Pará', acronym: 'PA' },
  ];

  it('encontra pelo nome sem precisar de acento', () => {
    expect(searchStates(sample, 'sao').map((state) => state.acronym)).toEqual(['SP']);
  });

  it('encontra parte do nome', () => {
    expect(searchStates(sample, 'par').map((state) => state.acronym)).toEqual(['PR', 'PA']);
  });

  it('encontra pela sigla exata', () => {
    expect(searchStates(sample, 'pa').map((state) => state.acronym)).toEqual(['SP', 'PR', 'PA']);
    expect(searchStates(sample, 'SP').map((state) => state.acronym)).toEqual(['SP']);
  });

  it('devolve todos quando a busca está vazia', () => {
    expect(searchStates(sample, '   ')).toHaveLength(3);
  });
});

describe('sortStates', () => {
  const sample = [
    { name: 'Pará', gdp: 200 },
    { name: 'Acre', gdp: null },
    { name: 'Ceará', gdp: 100 },
    { name: 'Paraná', gdp: 300 },
  ];

  it('ordena textos em ordem alfabética do português', () => {
    expect(sortStates(sample, 'name').map((state) => state.name)).toEqual([
      'Acre',
      'Ceará',
      'Pará',
      'Paraná',
    ]);
  });

  it('ordena números nas duas direções e deixa null no fim', () => {
    expect(sortStates(sample, 'gdp', 'asc').map((state) => state.gdp)).toEqual([
      100,
      200,
      300,
      null,
    ]);
    expect(sortStates(sample, 'gdp', 'desc').map((state) => state.gdp)).toEqual([
      300,
      200,
      100,
      null,
    ]);
  });

  it('não altera o array original', () => {
    sortStates(sample, 'gdp');
    expect(sample[0].name).toBe('Pará');
  });
});
