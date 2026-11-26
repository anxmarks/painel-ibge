import { COMPARE_INDICATORS, INDICATORS } from '../config.js';

/** @typedef {import('../types.js').StateData} StateData */
/** @typedef {import('../types.js').Summary} Summary */
/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */

/**
 * Uma célula da comparação: o valor, a barra (de 0 a 1, relativa ao maior da linha)
 * e se é o maior entre os estados comparados
 * @typedef {{ value: number | null, ratio: number, isMax: boolean }} ComparisonCell
 */

/**
 * Uma linha da comparação: um indicador, uma célula por estado e o valor do Brasil como referência
 * @typedef {{ indicator: IndicatorKey, label: string, cells: ComparisonCell[], brazil: number | null }} ComparisonRow
 */

// Os estados escolhidos, na ordem em que foram escolhidos (siglas que não existem ficam de fora)
/**
 * @param {StateData[]} states
 * @param {string[]} acronyms
 * @returns {StateData[]}
 */
export function pickStates(states, acronyms) {
  return acronyms.flatMap((acronym) => states.filter((state) => state.acronym === acronym));
}

// Monta as linhas da tabela de comparação. A barra de cada estado é proporcional ao maior
// valor da linha entre os estados escolhidos (o Brasil fica de fora: num total como a população,
// ele é tão maior que todas as barras dos estados ficariam minúsculas).
/**
 * @param {StateData[]} selected
 * @param {Summary} brazil
 * @returns {ComparisonRow[]}
 */
export function buildComparisonRows(selected, brazil) {
  return COMPARE_INDICATORS.map((indicator) => {
    const values = selected.map((state) => state[indicator]);
    const max = Math.max(0, ...values.filter((value) => value !== null));

    return {
      indicator,
      label: INDICATORS[indicator].label,
      brazil: brazil[indicator],
      cells: values.map((value) => ({
        value,
        ratio: value !== null && max > 0 ? value / max : 0,
        // "Maior" só faz sentido com mais de um estado
        isMax: selected.length > 1 && value !== null && value === max,
      })),
    };
  });
}
