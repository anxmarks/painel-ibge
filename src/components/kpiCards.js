import {
  formatArea,
  formatCompact,
  formatCompactCurrency,
  formatCurrency,
  formatDensity,
  formatInteger,
} from '../utils/format.js';

/** @typedef {import('../types.js').Summary} Summary */
/** @typedef {{ label: string, value: (summary: Summary) => string, detail: (summary: Summary) => string }} KpiCard */

// Os quatro cards: o rótulo é fixo; valor e detalhe são calculados a partir do resumo
/** @type {KpiCard[]} */
const KPI_CARDS = [
  {
    label: 'População',
    value: (summary) => formatCompact(summary.population),
    detail: (summary) => `${formatInteger(summary.population)} pessoas`,
  },
  {
    label: 'PIB',
    value: (summary) => formatCompactCurrency(summary.gdp),
    detail: () => 'a preços correntes',
  },
  {
    label: 'PIB per capita',
    value: (summary) => formatCurrency(summary.gdpPerCapita),
    detail: (summary) => `${summary.stateCount} estados`,
  },
  {
    label: 'Densidade demográfica',
    value: (summary) => formatDensity(summary.density),
    detail: (summary) => `em ${formatArea(summary.area)}`,
  },
];

// Monta o HTML de um card. Os textos vêm do próprio código e dos formatadores, nunca do usuário.
/** @param {{ label: string, value: string, detail: string }} card */
function cardTemplate({ label, value, detail }) {
  return `
    <article class="kpi-card">
      <h3 class="kpi-label">${label}</h3>
      <p class="kpi-value">${value}</p>
      <p class="kpi-detail">${detail}</p>
    </article>
  `;
}

// Desenha os cards de resumo a partir dos totais calculados por summarizeStates
/**
 * @param {HTMLElement} container
 * @param {Summary} summary
 */
export function renderKpiCards(container, summary) {
  container.innerHTML = KPI_CARDS.map((card) =>
    cardTemplate({
      label: card.label,
      value: card.value(summary),
      detail: card.detail(summary),
    }),
  ).join('');
}

// Enquanto os dados carregam: os mesmos cards, com blocos animados no lugar dos números.
// Assim a página não "pula" quando os valores chegam.
/** @param {HTMLElement} container */
export function renderKpiSkeleton(container) {
  container.innerHTML = KPI_CARDS.map((card) =>
    cardTemplate({
      label: card.label,
      value: '<span class="skeleton skeleton-value"></span>',
      detail: '<span class="skeleton skeleton-text"></span>',
    }),
  ).join('');
}
