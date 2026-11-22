import { ALL_REGIONS, GDP_UNIT_MULTIPLIER, LOCALE, REGIONS } from '../config.js';

// Converte um valor do SIDRA (sempre texto) em número.
// O SIDRA usa símbolos como "...", "-" ou "X" para dado ausente: nesses casos devolve null.
export function parseSidraValue(value) {
  const number = Number(value);
  return value !== '' && Number.isFinite(number) ? number : null;
}

// Desaninha a resposta de um agregado do SIDRA em um Map { id do estado -> valor }
export function parseAggregateSeries(response) {
  const series = response?.[0]?.resultados?.[0]?.series ?? [];

  return new Map(
    series.map(({ localidade, serie }) => [
      Number(localidade.id),
      // A série tem uma única chave (o ano), por isso pega o primeiro valor
      parseSidraValue(Object.values(serie)[0]),
    ]),
  );
}

// Divisão que devolve null quando falta algum dado (ou quando o divisor é zero)
function divide(numerator, denominator) {
  if (numerator === null || !denominator) return null;
  return numerator / denominator;
}

// PIB per capita em reais; null quando falta algum dos dados
export function calculatePerCapita(gdp, population) {
  return divide(gdp, population);
}

// Densidade demográfica em habitantes por km²; null quando falta algum dos dados
export function calculateDensity(population, area) {
  return divide(population, area);
}

// Junta estados, população, PIB e área em um único array de objetos planos
export function mergeStateData(states, populationResponse, gdpResponse, areaResponse) {
  const populationById = parseAggregateSeries(populationResponse);
  const gdpById = parseAggregateSeries(gdpResponse);
  const areaById = parseAggregateSeries(areaResponse);

  return states.map((state) => {
    const population = populationById.get(state.id) ?? null;
    const gdpInThousands = gdpById.get(state.id) ?? null;
    const gdp = gdpInThousands === null ? null : gdpInThousands * GDP_UNIT_MULTIPLIER;
    const area = areaById.get(state.id) ?? null;

    return {
      id: state.id,
      acronym: state.sigla,
      name: state.nome,
      regionAcronym: state.regiao.sigla,
      regionName: state.regiao.nome,
      population,
      gdp,
      gdpPerCapita: calculatePerCapita(gdp, population),
      area,
      density: calculateDensity(population, area),
    };
  });
}

// Soma uma propriedade numérica, ignorando valores ausentes (null)
export function sumBy(items, key) {
  return items.reduce((total, item) => total + (item[key] ?? 0), 0);
}

// Totais de um conjunto de estados (o Brasil inteiro ou uma região filtrada).
// O per capita é PIB total ÷ população total, e não a média dos per capitas dos estados:
// a média daria o mesmo peso a Roraima e a São Paulo. A densidade segue a mesma regra.
// Cada razão usa só os estados que têm os dois dados, para numerador e divisor falarem dos mesmos estados.
export function summarizeStates(states) {
  const withGdp = states.filter((state) => state.population !== null && state.gdp !== null);
  const withArea = states.filter((state) => state.population !== null && state.area !== null);

  return {
    stateCount: states.length,
    population: sumBy(states, 'population'),
    gdp: sumBy(states, 'gdp'),
    gdpPerCapita: calculatePerCapita(sumBy(withGdp, 'gdp'), sumBy(withGdp, 'population')),
    area: sumBy(states, 'area'),
    density: calculateDensity(sumBy(withArea, 'population'), sumBy(withArea, 'area')),
  };
}

// Ordena os estados do maior para o menor valor do indicador, deixando de fora os sem dado.
// Devolve um array novo, sem alterar o original.
export function rankStates(states, indicator) {
  return states
    .filter((state) => state[indicator] !== null)
    .sort((a, b) => b[indicator] - a[indicator]);
}

// Totais por região, sempre na ordem de REGIONS (regiões sem estados ficam de fora)
export function groupByRegion(states) {
  return REGIONS.map((region) => {
    const regionStates = states.filter((state) => state.regionAcronym === region.acronym);
    return { ...region, ...summarizeStates(regionStates) };
  }).filter((region) => region.stateCount > 0);
}

// Mantém só os estados da região escolhida; ALL_REGIONS devolve todos
export function filterByRegion(states, regionAcronym) {
  if (regionAcronym === ALL_REGIONS) return states;
  return states.filter((state) => state.regionAcronym === regionAcronym);
}

// Tira acentos e deixa minúsculo, para "sao" encontrar "São Paulo"
export function normalizeText(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// Filtra os estados pelo nome ou pela sigla; busca vazia devolve todos
export function searchStates(states, query) {
  const term = normalizeText(query);
  if (term === '') return states;

  return states.filter(
    (state) => normalizeText(state.name).includes(term) || normalizeText(state.acronym) === term,
  );
}

// Compara dois valores: textos em ordem alfabética do português, números do menor para o maior
function compareValues(a, b) {
  if (typeof a === 'string') return a.localeCompare(b, LOCALE);
  return a - b;
}

// Ordena por qualquer coluna, em ordem 'asc' ou 'desc'. Valores null vão sempre para o fim.
export function sortStates(states, key, direction = 'asc') {
  const sign = direction === 'asc' ? 1 : -1;

  return [...states].sort((a, b) => {
    if (a[key] === null) return b[key] === null ? 0 : 1;
    if (b[key] === null) return -1;
    return sign * compareValues(a[key], b[key]);
  });
}
