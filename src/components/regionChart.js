import { Chart, cssVar } from './chartTheme.js';
import { INDICATORS } from '../config.js';
import { groupByRegion, sumBy } from '../utils/transform.js';
import { formatIndicator, formatPercent } from '../utils/format.js';

/** @typedef {import('../types.js').StateData} StateData */
/** @typedef {import('../types.js').RegionSummary} RegionSummary */
/** @typedef {import('../types.js').RegionAcronym} RegionAcronym */
/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */

// A cor segue a região (N, NE, CO...), nunca a posição: filtrar não troca as cores
/** @param {RegionAcronym} acronym */
function regionColor(acronym) {
  return cssVar(`--color-region-${acronym.toLowerCase()}`);
}

// Gráfico de rosca com a participação de cada região, mais uma legenda em HTML com as porcentagens
/**
 * @param {{ canvas: HTMLCanvasElement, legend: HTMLElement, title: HTMLElement }} elements
 */
export function createRegionChart({ canvas, legend, title }) {
  /** @type {IndicatorKey | null} */
  let indicator = null;
  /** @type {(number | null)[]} */
  let shares = []; // participação de cada fatia (o tooltip mostra junto do valor)

  /** @type {Chart<'doughnut', (number | null)[], string>} */
  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      datasets: {
        doughnut: {
          borderWidth: 2, // 2px de respiro entre as fatias, na cor da superfície (definida no update)
          hoverOffset: 6,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) =>
              indicator
                ? ` ${formatIndicator(indicator, item.parsed)} (${formatPercent(shares[item.dataIndex])})`
                : '',
          },
        },
      },
    },
  });

  /**
   * @param {StateData[]} states
   * @param {IndicatorKey} newIndicator
   */
  function update(states, newIndicator) {
    // Participação só faz sentido para indicadores que somam (população e PIB)
    if (!INDICATORS[newIndicator].additive) {
      throw new Error(`O indicador "${newIndicator}" não pode ser dividido entre regiões.`);
    }
    indicator = newIndicator;
    const regions = groupByRegion(states);
    const total = sumBy(regions, newIndicator);
    shares = regions.map((region) => {
      const value = region[newIndicator];
      return total > 0 && value !== null ? value / total : null;
    });
    const [dataset] = chart.data.datasets;

    chart.data.labels = regions.map((region) => region.name);
    dataset.data = regions.map((region) => region[newIndicator]);
    // As cores são lidas a cada update para acompanhar a troca de tema
    dataset.backgroundColor = regions.map((region) => regionColor(region.acronym));
    dataset.borderColor = cssVar('--color-surface');
    chart.update();

    title.textContent = `Participação das regiões ${INDICATORS[newIndicator].shareOf}`;
    legend.innerHTML = regions
      .map((region, index) => legendItemTemplate(region, shares[index], newIndicator))
      .join('');
    canvas.setAttribute(
      'aria-label',
      `Gráfico de rosca. ${regions
        .map((region, index) => `${region.name}: ${formatPercent(shares[index])}`)
        .join('; ')}.`,
    );
  }

  return { update };
}

// Cada item da legenda mostra a cor, o nome, a porcentagem e o valor (assim a cor nunca é a única pista)
/**
 * @param {RegionSummary} region
 * @param {number | null} share
 * @param {IndicatorKey} indicator
 */
function legendItemTemplate(region, share, indicator) {
  return `
    <li class="legend-item">
      <span class="legend-swatch" style="background: ${regionColor(region.acronym)}"></span>
      <span class="legend-name">${region.name}</span>
      <span class="legend-share">${formatPercent(share)}</span>
      <span class="legend-value">${formatIndicator(indicator, region[indicator])}</span>
    </li>
  `;
}
