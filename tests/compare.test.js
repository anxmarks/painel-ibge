import { describe, it, expect } from 'vitest';
import { buildComparisonRows, pickStates } from '../src/utils/compare.js';

/** @typedef {import('../src/types.js').StateData} StateData */

/**
 * Estado de teste: só os campos que a comparação usa importam
 * @param {string} acronym
 * @param {Partial<StateData>} values
 * @returns {StateData}
 */
function state(acronym, values) {
  return {
    id: 0,
    acronym,
    name: acronym,
    regionAcronym: 'SE',
    regionName: 'Sudeste',
    population: null,
    gdp: null,
    gdpPerCapita: null,
    area: null,
    density: null,
    ...values,
  };
}

const sp = state('SP', { population: 400, gdp: 1000, gdpPerCapita: 2.5, density: 160 });
const ba = state('BA', { population: 100, gdp: 200, gdpPerCapita: 2, density: 25 });
const brazil = {
  stateCount: 27,
  population: 2000,
  gdp: 10000,
  gdpPerCapita: 5,
  area: 85,
  density: 23.5,
};

describe('pickStates', () => {
  it('devolve os estados na ordem escolhida, não na ordem da lista', () => {
    expect(pickStates([sp, ba], ['BA', 'SP'])).toEqual([ba, sp]);
  });

  it('ignora siglas que não estão nos dados', () => {
    expect(pickStates([sp], ['SP', 'BA'])).toEqual([sp]);
  });
});

describe('buildComparisonRows', () => {
  const rows = buildComparisonRows([sp, ba], brazil);
  const row = (indicator) => rows.find((item) => item.indicator === indicator);

  it('uma linha por indicador, com o rótulo do config', () => {
    expect(rows.map((item) => item.label)).toEqual([
      'População',
      'PIB',
      'PIB per capita',
      'Densidade demográfica',
    ]);
  });

  it('a barra é proporcional ao maior valor da linha entre os estados', () => {
    expect(row('population').cells.map((cell) => cell.ratio)).toEqual([1, 0.25]);
  });

  it('marca o maior valor de cada linha', () => {
    expect(row('gdp').cells.map((cell) => cell.isMax)).toEqual([true, false]);
  });

  it('traz o Brasil como referência, fora das barras', () => {
    expect(row('gdpPerCapita').brazil).toBe(5);
    // O Brasil (5) é maior que SP (2,5), mas a barra de SP continua cheia
    expect(row('gdpPerCapita').cells[0].ratio).toBe(1);
  });

  it('com um estado só, ninguém é "o maior"', () => {
    const single = buildComparisonRows([ba], brazil);
    expect(single.every((item) => item.cells.every((cell) => !cell.isMax))).toBe(true);
  });

  it('valor ausente fica sem barra e nunca é o maior', () => {
    const missing = state('XX', { population: null });
    const [population] = buildComparisonRows([missing, ba], brazil);
    expect(population.cells[0]).toEqual({ value: null, ratio: 0, isMax: false });
    expect(population.cells[1].isMax).toBe(true);
  });
});
