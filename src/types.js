// Tipos compartilhados do painel, descritos em JSDoc.
// Este arquivo não tem código: o TypeScript (npm run typecheck) lê os comentários e confere
// se cada função recebe e devolve o que promete. No navegador ele vira um módulo vazio.

/** @typedef {'N' | 'NE' | 'CO' | 'SE' | 'S'} RegionAcronym */

/** Valor do filtro de região: uma sigla ou "all" (o Brasil inteiro) */
/** @typedef {RegionAcronym | 'all'} RegionFilter */

/** @typedef {{ acronym: RegionAcronym, name: string }} Region */

/** Chaves dos indicadores; cada uma é também uma propriedade de StateData */
/** @typedef {'population' | 'gdp' | 'gdpPerCapita' | 'density'} IndicatorKey */

/**
 * @typedef {object} Indicator
 * @property {string} label Nome que aparece na tela
 * @property {boolean} additive Se faz sentido somar os estados (vai para a rosca)
 * @property {string} [shareOf] Fim do título da rosca ("no PIB")
 * @property {string} [inSentence] Nome com artigo, para o meio de uma frase ("o PIB per capita")
 * @property {string} [unit] Unidade, quando os números da legenda do mapa vão sem ela
 */

/** Colunas que a tabela de estados sabe ordenar */
/** @typedef {'name' | 'regionName' | IndicatorKey} TableColumnKey */

/** @typedef {'light' | 'dark'} Theme */

/** @typedef {'asc' | 'desc'} SortDirection */

/**
 * Um estado com todos os dados já juntados e calculados (saída do mergeStateData).
 * Valor ausente é sempre null, nunca undefined nem NaN.
 * @typedef {object} StateData
 * @property {number} id Código do IBGE (ex.: 35 para São Paulo)
 * @property {string} acronym
 * @property {string} name
 * @property {RegionAcronym} regionAcronym
 * @property {string} regionName
 * @property {number | null} population
 * @property {number | null} gdp Em reais
 * @property {number | null} gdpPerCapita
 * @property {number | null} area Em km²
 * @property {number | null} density Em habitantes por km²
 */

/**
 * Totais de um conjunto de estados (saída do summarizeStates)
 * @typedef {object} Summary
 * @property {number} stateCount
 * @property {number} population
 * @property {number} gdp
 * @property {number | null} gdpPerCapita
 * @property {number} area
 * @property {number | null} density
 */

/** @typedef {Region & Summary} RegionSummary */

/**
 * Participação de cada região no PIB, ano a ano (saída do buildRegionShareSeries)
 * @typedef {object} RegionShareSeries
 * @property {number[]} years
 * @property {(Region & { shares: (number | null)[] })[]} regions shares[i] é o ano years[i]
 */

/**
 * Participação de cada estado no PIB, ano a ano (saída do buildStateShareSeries)
 * @typedef {object} StateShareSeries
 * @property {number[]} years
 * @property {(Pick<StateData, 'id' | 'acronym' | 'name' | 'regionAcronym'> & { shares: (number | null)[] })[]} states
 */

/**
 * Estado (no sentido de "state") do painel inteiro, guardado no store
 * @typedef {object} AppState
 * @property {'loading' | 'ready' | 'error'} status
 * @property {string} errorMessage
 * @property {StateData[]} states
 * @property {StateMesh | null} mesh
 * @property {RegionShareSeries | null} history
 * @property {StateShareSeries | null} stateHistory
 * @property {RegionFilter} region
 * @property {IndicatorKey} indicator
 * @property {string[]} compare Siglas dos estados comparados (de 0 a 3)
 * @property {Theme} theme
 */

/**
 * Tudo o que a URL guarda. "compare" são as siglas dos estados comparados, na ordem escolhida.
 * @typedef {{ region: RegionFilter, indicator: IndicatorKey, compare: string[] }} Filters
 */

/** Um estado da lista de localidades da API (/v1/localidades/estados) */
/**
 * @typedef {object} IbgeState
 * @property {number} id
 * @property {string} sigla
 * @property {string} nome
 * @property {{ id: number, sigla: RegionAcronym, nome: string }} regiao
 */

/**
 * Resposta de um agregado do SIDRA: tudo aninhado, e os valores sempre como texto
 * (ex.: "203080756" ou "..." para dado ausente). "serie" vai de ano para valor.
 * @typedef {{
 *   resultados: {
 *     series: { localidade: { id: string, nome: string }, serie: Record<string, string> }[]
 *   }[]
 * }[]} SidraResponse
 */

/** Contornos dos estados (GeoJSON); cada um traz o código do IBGE em properties.codarea */
/** @typedef {import('geojson').Feature<import('geojson').Polygon | import('geojson').MultiPolygon, { codarea: string }>} StateFeature */
/** @typedef {import('geojson').FeatureCollection<StateFeature['geometry'], StateFeature['properties']>} StateMesh */

export {};
