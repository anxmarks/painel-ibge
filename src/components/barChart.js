import { Chart, applyScaleColors, cssVar } from './chartTheme.js';
import { INDICATORS } from '../config.js';
import { rankStates } from '../utils/transform.js';
import { formatIndicator } from '../utils/format.js';

/** @typedef {import('../types.js').StateData} StateData */
/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */

// Ranking dos estados em barras horizontais (27 nomes cabem melhor na vertical)
/**
 * @param {{ canvas: HTMLCanvasElement, title: HTMLElement }} elements
 */
export function createBarChart({ canvas, title }) {
  /** @type {IndicatorKey | null} */
  let indicator = null;
  /** @type {StateData[]} */
  let ranked = []; // estados na ordem das barras (o tooltip usa para achar o nome)

  /** @type {Chart<'bar', (number | null)[], string>} */
  const chart = new Chart(canvas, {
    type: 'bar',
    data: { labels: [], datasets: [{ data: [] }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      datasets: {
        bar: {
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
              indicator ? formatIndicator(indicator, Number(value), { short: true }) : value,
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
            title: ([item]) => ranked[item.dataIndex].name,
            label: (item) =>
              indicator
                ? `${INDICATORS[indicator].label}: ${formatIndicator(indicator, item.parsed.x)}`
                : '',
          },
        },
      },
    },
  });

  // Atualiza os dados sem recriar o gráfico (chart.update anima a transição)
  /**
   * @param {StateData[]} states
   * @param {IndicatorKey} newIndicator
   */
  function update(states, newIndicator) {
    indicator = newIndicator;
    ranked = rankStates(states, newIndicator);
    const [dataset] = chart.data.datasets;

    chart.data.labels = ranked.map((state) => state.acronym);
    dataset.data = ranked.map((state) => state[newIndicator]);
    // As cores são lidas a cada update para acompanhar a troca de tema
    dataset.backgroundColor = cssVar('--color-accent');
    dataset.hoverBackgroundColor = cssVar('--color-accent-strong');
    applyScaleColors(chart);
    // O CSS usa esse número para dar a altura certa ao gráfico; o Chart.js percebe o novo tamanho
    canvas.parentElement?.style.setProperty('--bar-count', String(ranked.length));
    chart.update();

    title.textContent = `Ranking dos estados por ${INDICATORS[newIndicator].label}`;
    canvas.setAttribute('aria-label', describeRanking(ranked, newIndicator));
  }

  return { update };
}

// Texto alternativo do gráfico: o que ele mostra e os extremos do ranking
/**
 * @param {StateData[]} ranked
 * @param {IndicatorKey} indicator
 */
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
