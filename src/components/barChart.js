import { Chart, cssVar } from './chartTheme.js';
import { INDICATORS } from '../config.js';
import { rankStates } from '../utils/transform.js';
import { formatIndicator } from '../utils/format.js';

// Ranking dos estados em barras horizontais (27 nomes cabem melhor na vertical)
export function createBarChart({ canvas, title }) {
  let indicator = null;

  const chart = new Chart(canvas, {
    type: 'bar',
    data: { labels: [], datasets: [{ data: [], states: [] }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      datasets: {
        bar: {
          backgroundColor: cssVar('--color-accent'),
          hoverBackgroundColor: cssVar('--color-accent-strong'),
          borderRadius: 4,
          borderSkipped: 'start', // arredonda só a ponta da barra, não a base
          categoryPercentage: 0.85,
          barPercentage: 0.9,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          border: { display: false },
          ticks: {
            maxRotation: 0, // rótulos sempre na horizontal, mesmo no celular
            maxTicksLimit: 5,
            // O Chart.js desenha o eixo assim que é criado, antes do primeiro update()
            callback: (value) =>
              indicator ? formatIndicator(indicator, value, { short: true }) : value,
          },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { autoSkip: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: ([item]) => item.dataset.states[item.dataIndex].name,
            label: (item) =>
              `${INDICATORS[indicator].label}: ${formatIndicator(indicator, item.raw)}`,
          },
        },
      },
    },
  });

  // Atualiza os dados sem recriar o gráfico (chart.update anima a transição)
  function update(states, newIndicator) {
    indicator = newIndicator;
    const ranked = rankStates(states, indicator);
    const [dataset] = chart.data.datasets;

    chart.data.labels = ranked.map((state) => state.acronym);
    dataset.data = ranked.map((state) => state[indicator]);
    dataset.states = ranked;
    chart.update();

    title.textContent = `Ranking dos estados por ${INDICATORS[indicator].label}`;
    canvas.setAttribute('aria-label', describeRanking(ranked, indicator));
  }

  return { update };
}

// Texto alternativo do gráfico: o que ele mostra e os extremos do ranking
function describeRanking(ranked, indicator) {
  if (ranked.length === 0) return 'Gráfico de barras sem dados.';

  const first = ranked[0];
  const last = ranked[ranked.length - 1];
  return (
    `Gráfico de barras com ${ranked.length} estados ordenados por ${INDICATORS[indicator].label}. ` +
    `Maior: ${first.name}, ${formatIndicator(indicator, first[indicator])}. ` +
    `Menor: ${last.name}, ${formatIndicator(indicator, last[indicator])}.`
  );
}
