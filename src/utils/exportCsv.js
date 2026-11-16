import { CSV_FILENAME_PREFIX, CSV_SEPARATOR, REFERENCE_YEAR, REGIONS } from '../config.js';
import { normalizeText } from './transform.js';

// Quebra de linha do padrão CSV (RFC 4180)
const LINE_BREAK = '\r\n';

// Marca invisível no início do arquivo que avisa ao Excel que o texto está em UTF-8.
// Sem ela, "São Paulo" aparece como "SÃ£o Paulo".
const UTF8_BOM = '﻿';

// Número no formato que o Excel em português lê como número: vírgula decimal, sem separador de milhar
export function formatCsvNumber(value, decimals) {
  if (value === null) return '';
  return value.toFixed(decimals).replace('.', ',');
}

// Colunas do arquivo: os valores vão "crus" (sem R$ nem "mi"), para dar para fazer contas na planilha
const STATE_COLUMNS = [
  { header: 'Sigla', value: (state) => state.acronym },
  { header: 'Estado', value: (state) => state.name },
  { header: 'Região', value: (state) => state.regionName },
  { header: 'População', value: (state) => formatCsvNumber(state.population, 0) },
  { header: 'PIB (R$)', value: (state) => formatCsvNumber(state.gdp, 0) },
  { header: 'PIB per capita (R$)', value: (state) => formatCsvNumber(state.gdpPerCapita, 2) },
];

// Campos com separador, aspas ou quebra de linha vão entre aspas, e as aspas internas são dobradas
export function escapeCsvField(value) {
  const text = String(value);
  const needsQuotes = text.includes(CSV_SEPARATOR) || /["\r\n]/.test(text);
  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text;
}

// Monta o texto do CSV: uma linha de cabeçalho e uma linha por item
export function toCsv(rows, columns) {
  const lines = [
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => column.value(row))),
  ];

  return lines.map((fields) => fields.map(escapeCsvField).join(CSV_SEPARATOR)).join(LINE_BREAK);
}

export function buildStatesCsv(states) {
  return toCsv(states, STATE_COLUMNS);
}

// Nome do arquivo com o ano e a região, ex.: brasil-em-dados-2022-centro-oeste.csv
export function buildCsvFilename(regionAcronym) {
  const region = REGIONS.find((item) => item.acronym === regionAcronym);
  const slug = region ? normalizeText(region.name).replaceAll(' ', '-') : 'brasil';
  return `${CSV_FILENAME_PREFIX}-${REFERENCE_YEAR}-${slug}.csv`;
}

// Único trecho com efeito colateral: cria um arquivo na memória e dispara o download
export function downloadCsv(content, filename) {
  const blob = new Blob([UTF8_BOM + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
