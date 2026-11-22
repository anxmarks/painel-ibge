import { Chart, applyScaleColors, cssVar } from './chartTheme.js';
import { ALL_REGIONS, REGIONS } from '../config.js';
import { formatPercent, formatPercentagePoints, formatShare } from '../utils/format.js';

const LINE_WIDTH = 2; // linhas finas: a cor e a forma contam a história, não a espessura
const MUTED_LINE_WIDTH = 1.5;
const HOVER_POINT_RADIUS = 4;
const HIT_RADIUS = 8; // área de toque maior que o ponto, para acertar no celular

// A cor segue a região, igual à rosca: o Nordeste é laranja nos dois gráficos
function regionColor(acronym) {
  return cssVar(`--color-region-${acronym.toLowerCase()}`);
}

// Linha vertical no ano sob o ponteiro, para ler todas as regiões no mesmo ano
const crosshairPlugin = {
  id: 'historyCrosshair',
  afterDatasetsDraw(chart) {
    const [active] = chart.tooltip?.getActiveElements() ?? [];
    if (!active) return;

    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.strokeStyle = cssVar('--color-text-muted');
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(active.element.x, chartArea.top);
    ctx.lineTo(active.element.x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

// Gráfico de linha com a participação de cada região no PIB do Brasil, ano a ano.
// Com uma região filtrada, ela fica colorida e as outras ficam cinza, como contexto.
export function createHistoryChart({ canvas, legend, title }) {
  const chart = new Chart(canvas, {
    type: 'line',
    data: { labels: [], datasets: [] },
    plugins: [crosshairPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // O tooltip mostra todas as regiões do ano mais próximo do ponteiro, sem precisar acertar a linha
      interaction: { mode: 'index', intersect: false },
      datasets: {
        line: {
          pointRadius: 0,
          pointHoverRadius: HOVER_POINT_RADIUS,
          pointHitRadius: HIT_RADIUS,
          tension: 0, // sem curvas: entre dois anos não há dado para inventar
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { maxRotation: 0, autoSkipPadding: 12 },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          ticks: { maxTicksLimit: 6, callback: (value) => formatPercent(value) },
        },
      },
      plugins: {
        legend: { display: false }, // a legenda é em HTML, com os números de cada região
        tooltip: {
          // Do maior para o menor, a mesma ordem das linhas no gráfico
          itemSort: (a, b) => b.raw - a.raw,
          callbacks: {
            label: (item) => ` ${item.dataset.label}: ${formatShare(item.raw)}`,
          },
        },
      },
    },
  });

  function update({ history, region }) {
    const { years, regions } = history;
    const isHighlighted = (acronym) => region === ALL_REGIONS || acronym === region;
    const mutedColor = cssVar('--color-context-line');

    chart.data.labels = years;
    chart.data.datasets = regions.map((item) => {
      const color = isHighlighted(item.acronym) ? regionColor(item.acronym) : mutedColor;
      return {
        label: item.name,
        data: item.shares,
        borderColor: color,
        backgroundColor: color, // quadradinho de cor no tooltip
        borderWidth: isHighlighted(item.acronym) ? LINE_WIDTH : MUTED_LINE_WIDTH,
        order: isHighlighted(item.acronym) ? 0 : 1, // a linha destacada fica por cima das cinza
      };
    });
    applyScaleColors(chart);
    chart.update();

    const period = `${years[0]}–${years.at(-1)}`;
    title.textContent = `Evolução da participação das regiões no PIB, ${period}`;

    // Legenda e texto para leitores de tela seguem a ordem do último ano, do maior para o menor
    const ranked = [...regions].sort((a, b) => b.shares.at(-1) - a.shares.at(-1));
    legend.innerHTML = ranked
      .map((item) =>
        legendItemTemplate(
          item,
          isHighlighted(item.acronym) ? regionColor(item.acronym) : mutedColor,
        ),
      )
      .join('');
    canvas.setAttribute('aria-label', describeHistory(ranked, years, region));
  }

  return { update };
}

// Cor, nome, participação no primeiro e no último ano e a variação (a cor nunca é a única pista)
function legendItemTemplate(item, color) {
  const first = item.shares[0];
  const last = item.shares.at(-1);
  return `
    <li class="legend-item">
      <span class="legend-swatch" style="background: ${color}"></span>
      <span class="legend-name">${item.name}</span>
      <span class="legend-share">${formatShare(first)} → ${formatShare(last)}</span>
      <span class="legend-value">${formatPercentagePoints(last - first)}</span>
    </li>
  `;
}

function describeHistory(ranked, years, region) {
  const changes = ranked
    .map(
      (item) =>
        `${item.name}: de ${formatShare(item.shares[0])} para ${formatShare(item.shares.at(-1))}`,
    )
    .join('; ');
  const highlight =
    region === ALL_REGIONS
      ? ''
      : ` Em destaque: ${REGIONS.find((item) => item.acronym === region).name}.`;
  return `Gráfico de linha da participação das regiões no PIB do Brasil, de ${years[0]} a ${years.at(-1)}. ${changes}.${highlight}`;
}
