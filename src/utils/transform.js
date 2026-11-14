import { GDP_UNIT_MULTIPLIER } from '../config.js';

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

// PIB per capita em reais; null quando falta algum dos dados
export function calculatePerCapita(gdp, population) {
  if (gdp === null || !population) return null;
  return gdp / population;
}

// Junta estados, população e PIB em um único array de objetos planos
export function mergeStateData(states, populationResponse, gdpResponse) {
  const populationById = parseAggregateSeries(populationResponse);
  const gdpById = parseAggregateSeries(gdpResponse);

  return states.map((state) => {
    const population = populationById.get(state.id) ?? null;
    const gdpInThousands = gdpById.get(state.id) ?? null;
    const gdp = gdpInThousands === null ? null : gdpInThousands * GDP_UNIT_MULTIPLIER;

    return {
      id: state.id,
      acronym: state.sigla,
      name: state.nome,
      regionAcronym: state.regiao.sigla,
      regionName: state.regiao.nome,
      population,
      gdp,
      gdpPerCapita: calculatePerCapita(gdp, population),
    };
  });
}
