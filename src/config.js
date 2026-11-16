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
};

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

// Indicadores disponíveis no painel (a chave é o nome da propriedade em cada estado).
// "additive" diz se faz sentido somar os estados: PIB per capita não soma, então não vai para a rosca.
export const INDICATORS = {
  population: { label: 'População', additive: true },
  gdp: { label: 'PIB', additive: true },
  gdpPerCapita: { label: 'PIB per capita', additive: false },
};

// Indicadores iniciais dos gráficos (os filtros da Etapa 4 vão poder trocar)
export const DEFAULT_RANKING_INDICATOR = 'gdpPerCapita';
export const DEFAULT_REGION_INDICATOR = 'gdp';

// Formatação de números e moeda
export const LOCALE = 'pt-BR';
export const CURRENCY = 'BRL';
export const MISSING_VALUE_LABEL = '—';

// Cache das respostas da API no localStorage.
// Mudar a versão do prefixo invalida o cache antigo (ex.: quando o formato dos dados muda).
export const CACHE_KEY_PREFIX = 'brasil-em-dados:v1:';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
