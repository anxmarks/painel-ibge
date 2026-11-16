import {
  formatCompact,
  formatCompactCurrency,
  formatCurrency,
  formatInteger,
} from '../utils/format.js';

// Monta o HTML de um card. Os textos vêm do próprio código e dos formatadores, nunca do usuário.
function cardTemplate({ label, value, detail }) {
  return `
    <article class="kpi-card">
      <h3 class="kpi-label">${label}</h3>
      <p class="kpi-value">${value}</p>
      <p class="kpi-detail">${detail}</p>
    </article>
  `;
}

// Desenha os três cards de resumo a partir dos totais calculados por summarizeStates
export function renderKpiCards(container, summary) {
  const cards = [
    {
      label: 'População',
      value: formatCompact(summary.population),
      detail: `${formatInteger(summary.population)} pessoas`,
    },
    {
      label: 'PIB',
      value: formatCompactCurrency(summary.gdp),
      detail: 'a preços correntes',
    },
    {
      label: 'PIB per capita',
      value: formatCurrency(summary.gdpPerCapita),
      detail: `${summary.stateCount} estados`,
    },
  ];

  container.innerHTML = cards.map(cardTemplate).join('');
}
