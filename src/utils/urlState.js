import { ALL_REGIONS, DEFAULT_INDICATOR, INDICATORS, REGIONS, URL_PARAMS } from '../config.js';

// Filtros que o painel usa quando a URL não diz nada
export const DEFAULT_FILTERS = { region: ALL_REGIONS, indicator: DEFAULT_INDICATOR };

// Aceita "ne" ou "NE"; qualquer sigla desconhecida vira o Brasil inteiro
function parseRegion(value) {
  const acronym = value?.toUpperCase();
  return REGIONS.some((region) => region.acronym === acronym) ? acronym : DEFAULT_FILTERS.region;
}

// Só aceita indicadores que existem no config.js; o resto vira o indicador padrão
function parseIndicator(value) {
  return Object.hasOwn(INDICATORS, value) ? value : DEFAULT_FILTERS.indicator;
}

// Lê os filtros de uma query string (ex.: location.search).
// A URL vem de fora (alguém pode digitar qualquer coisa), então tudo é validado.
export function parseFiltersFromSearch(search) {
  const params = new URLSearchParams(search);
  return {
    region: parseRegion(params.get(URL_PARAMS.region)),
    indicator: parseIndicator(params.get(URL_PARAMS.indicator)),
  };
}

// Monta a query string dos filtros. Valores padrão ficam de fora, para o link continuar limpo:
// o Brasil inteiro com o indicador padrão é só ".../painel-ibge/", sem "?".
export function buildSearchFromFilters({ region, indicator }) {
  const params = new URLSearchParams();
  if (region !== DEFAULT_FILTERS.region) params.set(URL_PARAMS.region, region);
  if (indicator !== DEFAULT_FILTERS.indicator) params.set(URL_PARAMS.indicator, indicator);

  const search = params.toString();
  return search ? `?${search}` : '';
}
