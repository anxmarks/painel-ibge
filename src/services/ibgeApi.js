import {
  API_BASE_URL,
  REFERENCE_YEAR,
  STATES_LOCATION,
  AGGREGATES,
  GDP_SERIES_YEARS,
  MAP_MESH,
} from '../config.js';
import { withCache } from './cache.js';

/** @typedef {import('../types.js').SidraResponse} SidraResponse */
/** @typedef {import('../types.js').IbgeState} IbgeState */
/** @typedef {import('../types.js').StateMesh} StateMesh */

// Busca uma URL e devolve o JSON, com mensagens de erro amigáveis
/** @param {string} url */
async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error('Não foi possível conectar à API do IBGE.', { cause: error });
  }

  if (!response.ok) {
    throw new Error(`A API do IBGE respondeu com erro ${response.status}.`);
  }

  return response.json();
}

// Monta a URL de uma variável de um agregado do SIDRA para todos os estados.
// "periods" é um ano ("2022") ou um intervalo ("2002-2023").
/**
 * @param {{ id: number, variable: number }} aggregate
 * @param {number | string} [periods]
 */
function buildAggregateUrl({ id, variable }, periods = REFERENCE_YEAR) {
  return (
    `${API_BASE_URL}/v3/agregados/${id}/periodos/${periods}` +
    `/variaveis/${variable}?localidades=${STATES_LOCATION}`
  );
}

// Lista de estados com sigla, nome e região
/** @returns {Promise<IbgeState[]>} */
export function fetchStates() {
  return withCache('states', () => fetchJson(`${API_BASE_URL}/v1/localidades/estados`));
}

// População residente por estado (resposta bruta do SIDRA)
/** @returns {Promise<SidraResponse>} */
export function fetchPopulation() {
  return withCache(`population:${REFERENCE_YEAR}`, () =>
    fetchJson(buildAggregateUrl(AGGREGATES.population)),
  );
}

// PIB por estado, em mil reais (resposta bruta do SIDRA)
/** @returns {Promise<SidraResponse>} */
export function fetchGdp() {
  return withCache(`gdp:${REFERENCE_YEAR}`, () => fetchJson(buildAggregateUrl(AGGREGATES.gdp)));
}

// PIB por estado em todos os anos da série, em mil reais (resposta bruta do SIDRA)
/** @returns {Promise<SidraResponse>} */
export function fetchGdpSeries() {
  const periods = `${GDP_SERIES_YEARS.firstYear}-${GDP_SERIES_YEARS.lastYear}`;
  return withCache(`gdp-series:${periods}`, () =>
    fetchJson(buildAggregateUrl(AGGREGATES.gdp, periods)),
  );
}

// Área territorial por estado, em km² (resposta bruta do SIDRA)
/** @returns {Promise<SidraResponse>} */
export function fetchArea() {
  return withCache(`area:${REFERENCE_YEAR}`, () => fetchJson(buildAggregateUrl(AGGREGATES.area)));
}

// Contornos dos estados (GeoJSON) para o mapa. A malha quase nunca muda, então o cache ajuda muito.
// URLSearchParams codifica o "+" de "vnd.geo+json" como %2B (um "+" cru viraria espaço na URL).
/** @returns {Promise<StateMesh>} */
export function fetchStateMesh() {
  const query = new URLSearchParams(MAP_MESH.params);
  return withCache('mesh:states', () => fetchJson(`${API_BASE_URL}${MAP_MESH.path}?${query}`));
}
