import { LOCALE, CURRENCY, MISSING_VALUE_LABEL } from '../config.js';

// Os formatadores são criados uma vez só, porque criar um Intl.NumberFormat é caro
const integerFormatter = new Intl.NumberFormat(LOCALE);

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
function formatWith(formatter, value) {
  return Number.isFinite(value) ? formatter.format(value) : MISSING_VALUE_LABEL;
}

// 203080756 -> "203.080.756"
export function formatInteger(value) {
  return formatWith(integerFormatter, value);
}

// 203080756 -> "203,1 mi"
export function formatCompact(value) {
  return formatWith(compactFormatter, value);
}

// 49633.83 -> "R$ 49.634"
export function formatCurrency(value) {
  return formatWith(currencyFormatter, value);
}

// 10079676378000 -> "R$ 10,08 tri"
export function formatCompactCurrency(value) {
  return formatWith(compactCurrencyFormatter, value);
}

const percentFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 1,
});

// 0.532 -> "53,2%"
export function formatPercent(value) {
  return formatWith(percentFormatter, value);
}

// Formatadores de cada indicador: "full" para tooltips e tabela, "short" para eixos
const indicatorFormatters = {
  population: { full: formatInteger, short: formatCompact },
  gdp: { full: formatCompactCurrency, short: formatCompactCurrency },
  gdpPerCapita: { full: formatCurrency, short: formatCompactCurrency },
};

// Formata o valor de um indicador; short = true para versões curtas (eixos dos gráficos)
export function formatIndicator(indicator, value, { short = false } = {}) {
  const formatters = indicatorFormatters[indicator];
  return short ? formatters.short(value) : formatters.full(value);
}
