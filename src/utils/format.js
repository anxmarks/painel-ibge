import { LOCALE, CURRENCY, MISSING_VALUE_LABEL } from '../config.js';

/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */
/** Todo formatador recebe um número (ou null, quando falta o dado) e devolve texto */
/** @typedef {(value: number | null) => string} Formatter */

// Os formatadores são criados uma vez só, porque criar um Intl.NumberFormat é caro
const integerFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

const compactFormatter = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 2,
});

// Aplica o formatador só quando o valor é um número válido
/**
 * @param {Intl.NumberFormat} formatter
 * @param {number | null} value
 */
function formatWith(formatter, value) {
  return isFiniteNumber(value) ? formatter.format(value) : MISSING_VALUE_LABEL;
}

// Number.isFinite não "avisa" o TypeScript de que o valor é número; esta versão avisa
/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isFiniteNumber(value) {
  return Number.isFinite(value);
}

// 203080756 -> "203.080.756"
/** @type {Formatter} */
export function formatInteger(value) {
  return formatWith(integerFormatter, value);
}

// 203080756 -> "203,1 mi"
/** @type {Formatter} */
export function formatCompact(value) {
  return formatWith(compactFormatter, value);
}

// 49633.83 -> "R$ 49.634"
/** @type {Formatter} */
export function formatCurrency(value) {
  return formatWith(currencyFormatter, value);
}

// 10079676378000 -> "R$ 10,08 tri"
/** @type {Formatter} */
export function formatCompactCurrency(value) {
  return formatWith(compactCurrencyFormatter, value);
}

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 1,
});

// 0.532 -> "53,2%"
/** @type {Formatter} */
export function formatPercent(value) {
  return formatWith(percentFormatter, value);
}

const shareFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Participação sempre com uma casa: 0.53 -> "53,0%" (lado a lado com "57,4%", não parece outro número)
/** @type {Formatter} */
export function formatShare(value) {
  return formatWith(shareFormatter, value);
}

const percentagePointFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

// Diferença entre duas participações (0.574 - 0.530 = 0.044) em pontos percentuais: "+4,4 p.p."
/** @param {number | null} difference */
export function formatPercentagePoints(difference) {
  if (!isFiniteNumber(difference)) return MISSING_VALUE_LABEL;
  return `${percentagePointFormatter.format(difference * 100)} p.p.`;
}

const densityFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// 23.857 -> "23,9 hab/km²"
/** @type {Formatter} */
export function formatDensity(value) {
  const number = formatWith(densityFormatter, value);
  return number === MISSING_VALUE_LABEL ? number : `${number} hab/km²`;
}

// 8510345.5 -> "8,5 mi km²"
/** @type {Formatter} */
export function formatArea(value) {
  const number = formatCompact(value);
  return number === MISSING_VALUE_LABEL ? number : `${number} km²`;
}

// Formatadores de cada indicador: "full" para tooltips e tabela, "short" para eixos
/** @type {Record<IndicatorKey, { full: Formatter, short: Formatter }>} */
const indicatorFormatters = {
  population: { full: formatInteger, short: formatCompact },
  gdp: { full: formatCompactCurrency, short: formatCompactCurrency },
  gdpPerCapita: { full: formatCurrency, short: formatCompactCurrency },
  density: { full: formatDensity, short: formatInteger }, // no eixo, só o número ("489")
};

// Formata o valor de um indicador; short = true para versões curtas (eixos dos gráficos)
/**
 * @param {IndicatorKey} indicator
 * @param {number | null} value
 * @param {{ short?: boolean }} [options]
 */
export function formatIndicator(indicator, value, { short = false } = {}) {
  const formatters = indicatorFormatters[indicator];
  return short ? formatters.short(value) : formatters.full(value);
}
