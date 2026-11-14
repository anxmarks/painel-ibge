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
