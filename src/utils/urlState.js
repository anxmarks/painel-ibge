import {
  ALL_REGIONS,
  COMPARE_URL_SEPARATOR,
  DEFAULT_INDICATOR,
  INDICATORS,
  MAX_COMPARED_STATES,
  REGIONS,
  STATE_ACRONYMS,
  URL_PARAMS,
} from '../config.js';

/** @typedef {import('../types.js').Filters} Filters */
/** @typedef {import('../types.js').RegionFilter} RegionFilter */
/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */

// Filtros que o painel usa quando a URL não diz nada
/** @type {Filters} */
export const DEFAULT_FILTERS = { region: ALL_REGIONS, indicator: DEFAULT_INDICATOR, compare: [] };

// Aceita "ne" ou "NE"; qualquer sigla desconhecida vira o Brasil inteiro
/**
 * @param {string | null} value
 * @returns {RegionFilter}
 */
function parseRegion(value) {
  const acronym = value?.toUpperCase();
  const region = REGIONS.find((item) => item.acronym === acronym);
  return region ? region.acronym : DEFAULT_FILTERS.region;
}

// Só aceita indicadores que existem no config.js; o resto vira o indicador padrão
/**
 * @param {string | null} value
 * @returns {IndicatorKey}
 */
function parseIndicator(value) {
  return isIndicatorKey(value) ? value : DEFAULT_FILTERS.indicator;
}

// "Type guard": quando devolve true, o TypeScript passa a tratar o texto como IndicatorKey
/**
 * @param {string | null} value
 * @returns {value is IndicatorKey}
 */
export function isIndicatorKey(value) {
  return value !== null && Object.hasOwn(INDICATORS, value);
}

// Aceita "SP-BA", "sp,ba" ou "SP BA". Siglas desconhecidas e repetidas saem; o máximo é 3.
/**
 * @param {string | null} value
 * @returns {string[]}
 */
export function parseCompare(value) {
  const acronyms = (value ?? '')
    .toUpperCase()
    .split(/[\s,-]+/)
    .filter((acronym) => STATE_ACRONYMS.includes(acronym));
  return [...new Set(acronyms)].slice(0, MAX_COMPARED_STATES);
}

// Lê os filtros de uma query string (ex.: location.search).
// A URL vem de fora (alguém pode digitar qualquer coisa), então tudo é validado.
/**
 * @param {string} search
 * @returns {Filters}
 */
export function parseFiltersFromSearch(search) {
  const params = new URLSearchParams(search);
  return {
    region: parseRegion(params.get(URL_PARAMS.region)),
    indicator: parseIndicator(params.get(URL_PARAMS.indicator)),
    compare: parseCompare(params.get(URL_PARAMS.compare)),
  };
}

// Monta a query string dos filtros. Valores padrão ficam de fora, para o link continuar limpo:
// o Brasil inteiro com o indicador padrão é só ".../painel-ibge/", sem "?".
/** @param {Filters} filters */
export function buildSearchFromFilters({ region, indicator, compare }) {
  const params = new URLSearchParams();
  if (region !== DEFAULT_FILTERS.region) params.set(URL_PARAMS.region, region);
  if (indicator !== DEFAULT_FILTERS.indicator) params.set(URL_PARAMS.indicator, indicator);
  if (compare.length > 0) params.set(URL_PARAMS.compare, compare.join(COMPARE_URL_SEPARATOR));

  const search = params.toString();
  return search ? `?${search}` : '';
}
