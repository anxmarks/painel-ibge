import { API_BASE_URL, REFERENCE_YEAR, STATES_LOCATION, AGGREGATES } from '../config.js';
import { withCache } from './cache.js';

// Busca uma URL e devolve o JSON, com mensagens de erro amigáveis
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

// Monta a URL de uma variável de um agregado do SIDRA para todos os estados
function buildAggregateUrl({ id, variable }) {
  return (
    `${API_BASE_URL}/v3/agregados/${id}/periodos/${REFERENCE_YEAR}` +
    `/variaveis/${variable}?localidades=${STATES_LOCATION}`
  );
}

// Lista de estados com sigla, nome e região
export function fetchStates() {
  return withCache('states', () => fetchJson(`${API_BASE_URL}/v1/localidades/estados`));
}

// População residente por estado (resposta bruta do SIDRA)
export function fetchPopulation() {
  return withCache(`population:${REFERENCE_YEAR}`, () =>
    fetchJson(buildAggregateUrl(AGGREGATES.population)),
  );
}

// PIB por estado, em mil reais (resposta bruta do SIDRA)
export function fetchGdp() {
  return withCache(`gdp:${REFERENCE_YEAR}`, () => fetchJson(buildAggregateUrl(AGGREGATES.gdp)));
}
