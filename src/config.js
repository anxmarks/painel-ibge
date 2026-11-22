// URL base da API de Serviço de Dados do IBGE
export const API_BASE_URL = 'https://servicodados.ibge.gov.br/api';

// Ano de referência: PIB e população do mesmo ano (Censo 2022)
export const REFERENCE_YEAR = 2022;

// Nível territorial "Unidade da Federação", todos os estados
export const STATES_LOCATION = 'N3[all]';

// Tabelas do SIDRA (agregado + variável)
export const AGGREGATES = {
  population: { id: 4709, variable: 93 }, // Censo 2022: população residente
  gdp: { id: 5938, variable: 37 }, // PIB a preços correntes (mil reais)
  area: { id: 4714, variable: 6318 }, // Censo 2022: área da unidade territorial (km²)
};

// Série histórica do PIB: todos os anos que a tabela 5938 tem (Contas Regionais, referência 2010).
// Quando o IBGE publicar um ano novo, basta mudar "lastYear".
export const GDP_SERIES_YEARS = { firstYear: 2002, lastYear: 2023 };

// O PIB vem em mil reais; multiplicar por este fator converte para reais
export const GDP_UNIT_MULTIPLIER = 1000;

// Regiões na ordem oficial do IBGE; a ordem fixa garante que cada região tenha sempre a mesma cor
export const REGIONS = [
  { acronym: 'N', name: 'Norte' },
  { acronym: 'NE', name: 'Nordeste' },
  { acronym: 'CO', name: 'Centro-Oeste' },
  { acronym: 'SE', name: 'Sudeste' },
  { acronym: 'S', name: 'Sul' },
];

// Valor do filtro de região que mostra o Brasil inteiro
export const ALL_REGIONS = 'all';

// Indicadores disponíveis no painel (a chave é o nome da propriedade em cada estado).
// "additive" diz se faz sentido somar os estados: PIB per capita e densidade não somam, então não vão para a rosca.
// "shareOf" completa o título da rosca ("Participação das regiões no PIB").
// "unit" aparece no título da legenda do mapa quando os números da legenda vão sem unidade.
// "inSentence" é o nome com artigo, para usar no meio de uma frase ("o mapa mostra a densidade...").
export const INDICATORS = {
  population: { label: 'População', additive: true, shareOf: 'na população' },
  gdp: { label: 'PIB', additive: true, shareOf: 'no PIB' },
  gdpPerCapita: { label: 'PIB per capita', additive: false, inSentence: 'o PIB per capita' },
  density: {
    label: 'Densidade demográfica',
    additive: false,
    unit: 'hab/km²',
    inSentence: 'a densidade demográfica',
  },
};

// Indicador inicial do filtro
export const DEFAULT_INDICATOR = 'gdpPerCapita';

// A rosca usa este indicador quando o escolhido não pode ser somado (PIB per capita)
export const FALLBACK_REGION_INDICATOR = 'gdp';

// Formatação de números e moeda
export const LOCALE = 'pt-BR';
export const CURRENCY = 'BRL';
export const MISSING_VALUE_LABEL = '—';

// Cache das respostas da API no localStorage.
// Mudar a versão do prefixo invalida o cache antigo (ex.: quando o formato dos dados muda).
export const CACHE_KEY_PREFIX = 'brasil-em-dados:v1:';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Quantas linhas de "carregando" a tabela mostra enquanto os dados não chegam
export const SKELETON_TABLE_ROWS = 6;

// Exportação em CSV: ponto e vírgula é o separador que o Excel em português espera
export const CSV_SEPARATOR = ';';
export const CSV_FILENAME_PREFIX = 'brasil-em-dados';

// Tema escolhido pela pessoa ('light' ou 'dark'). Sem escolha salva, o painel segue o sistema.
// Atenção: o script no <head> do index.html usa a mesma chave.
export const THEME_STORAGE_KEY = 'brasil-em-dados:theme';

// Nomes dos parâmetros da URL que guardam os filtros (ex.: ?regiao=NE&indicador=gdp).
// Em português porque aparecem para quem usa o painel.
export const URL_PARAMS = { region: 'regiao', indicator: 'indicador' };

// Mapa coroplético.
// Malha dos estados em GeoJSON. Qualidade "mínima" (~100 KB) basta para o tamanho do mapa na tela.
export const MAP_MESH = {
  path: '/v3/malhas/paises/BR',
  params: { formato: 'application/vnd.geo+json', intrarregiao: 'UF', qualidade: 'minima' },
};

// Mapas pintam taxas, não totais: para cada indicador que é total, a taxa que o mapa mostra no lugar
export const MAP_RATE_INDICATOR = { population: 'density', gdp: 'gdpPerCapita' };

// Número de faixas de cor (cada uma tem uma cor --color-map-1 ... --color-map-5 no variables.css)
export const MAP_CLASS_COUNT = 5;

// Tamanho do desenho (viewBox do SVG); na tela, o SVG se ajusta à largura do painel
export const MAP_SIZE = 600;
export const MAP_PADDING = 8;
