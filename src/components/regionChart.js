import { Chart, cssVar } from './chartTheme.js';
import { INDICATORS } from '../config.js';
import { groupByRegion, sumBy } from '../utils/transform.js';
import { formatIndicator, formatPercent } from '../utils/format.js';

// A cor segue a região (N, NE, CO...), nunca a posição: filtrar não troca as cores
function regionColor(acronym) {
  return cssVar(`--color-region-${acronym.toLowerCase()}`);
}

// Gráfico de rosca com a participação de cada região, mais uma legenda em HTML com as porcentagens
export function createRegionChart({ canvas, legend, title }) {
  let indicator = null;

  const chart = new Chart(canvas, {
    type: 'doughnut',
    data: { labels: [], datasets: [{ data: [], shares: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      datasets: {
        doughnut: {
          borderColor: cssVar('--color-surface'), // 2px de respiro entre as fatias
          borderWidth: 2,
          hoverOffset: 6,
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) =>
              ` ${formatIndicator(indicator, item.raw)} (${formatPercent(item.dataset.shares[item.dataIndex])})`,
          },
        },
      },
    },
  });

  function update(states, newIndicator) {
    // Participação só faz sentido para indicadores que somam (população e PIB)
    if (!INDICATORS[newIndicator].additive) {
      throw new Error(`O indicador "${newIndicator}" não pode ser dividido entre regiões.`);
    }
    indicator = newIndicator;
    const regions = groupByRegion(states);
    const total = sumBy(regions, indicator);
    const shares = regions.map((region) => (total > 0 ? region[indicator] / total : null));
    const [dataset] = chart.data.datasets;

    chart.data.labels = regions.map((region) => region.name);
    dataset.data = regions.map((region) => region[indicator]);
    dataset.backgroundColor = regions.map((region) => regionColor(region.acronym));
    dataset.shares = shares;
    chart.update();

    title.textContent = `Participação das regiões ${INDICATORS[indicator].shareOf}`;
    legend.innerHTML = regions
      .map((region, index) => legendItemTemplate(region, shares[index], indicator))
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
