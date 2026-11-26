import { Chart, applyScaleColors, cssVar } from './chartTheme.js';
import { ALL_REGIONS, REGIONS } from '../config.js';
import { formatPercent, formatPercentagePoints, formatShare } from '../utils/format.js';

/** @typedef {import('../types.js').RegionShareSeries} RegionShareSeries */
/** @typedef {RegionShareSeries['regions'][number]} RegionSeries */
/** @typedef {import('../types.js').RegionAcronym} RegionAcronym */
/** @typedef {import('../types.js').RegionFilter} RegionFilter */

const LINE_WIDTH = 2; // linhas finas: a cor e a forma contam a história, não a espessura
const MUTED_LINE_WIDTH = 1.5;
const HOVER_POINT_RADIUS = 4;
const HIT_RADIUS = 8; // área de toque maior que o ponto, para acertar no celular

// A cor segue a região, igual à rosca: o Nordeste é laranja nos dois gráficos
/** @param {RegionAcronym} acronym */
function regionColor(acronym) {
  return cssVar(`--color-region-${acronym.toLowerCase()}`);
}

// Participação no primeiro e no último ano da série (null quando falta o dado)
/** @param {RegionSeries} item */
function firstShare(item) {
  return item.shares[0] ?? null;
}

/** @param {RegionSeries} item */
function lastShare(item) {
  return item.shares.at(-1) ?? null;
}

// Variação entre o primeiro e o último ano. Sem um dos dois, não há variação:
// em JavaScript, "null - 0.13" daria -0.13, um número errado que pareceria certo.
/** @param {RegionSeries} item */
function shareChange(item) {
  const first = firstShare(item);
  const last = lastShare(item);
  return first === null || last === null ? null : last - first;
}

// Linha vertical no ano sob o ponteiro, para ler todas as regiões no mesmo ano
/** @type {import('chart.js').Plugin<'line'>} */
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
/**
 * @param {{ canvas: HTMLCanvasElement, legend: HTMLElement, title: HTMLElement }} elements
 */
export function createHistoryChart({ canvas, legend, title }) {
  /** @type {Chart<'line', (number | null)[], number>} */
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
          ticks: { maxTicksLimit: 6, callback: (value) => formatPercent(Number(value)) },
        },
      },
      plugins: {
        legend: { display: false }, // a legenda é em HTML, com os números de cada região
        tooltip: {
          // Do maior para o menor, a mesma ordem das linhas no gráfico (ano sem dado vai para o fim)
          itemSort: (a, b) => (b.parsed.y ?? -1) - (a.parsed.y ?? -1),
          callbacks: {
            label: (item) => ` ${item.dataset.label}: ${formatShare(item.parsed.y)}`,
          },
        },
      },
    },
  });

  /** @param {{ history: RegionShareSeries, region: RegionFilter }} params */
  function update({ history, region }) {
    const { years, regions } = history;
    /** @param {RegionAcronym} acronym */
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
    const ranked = [...regions].sort((a, b) => (lastShare(b) ?? 0) - (lastShare(a) ?? 0));
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
/**
 * @param {RegionSeries} item
 * @param {string} color
 */
function legendItemTemplate(item, color) {
  return `
    <li class="legend-item">
      <span class="legend-swatch" style="background: ${color}"></span>
      <span class="legend-name">${item.name}</span>
      <span class="legend-share">${formatShare(firstShare(item))} → ${formatShare(lastShare(item))}</span>
      <span class="legend-value">${formatPercentagePoints(shareChange(item))}</span>
    </li>
  `;
}

/**
 * @param {RegionSeries[]} ranked
 * @param {number[]} years
 * @param {RegionFilter} region
 */
function describeHistory(ranked, years, region) {
  const changes = ranked
    .map(
      (item) =>
        `${item.name}: de ${formatShare(firstShare(item))} para ${formatShare(lastShare(item))}`,
    )
    .join('; ');
  const highlightedName = REGIONS.find((item) => item.acronym === region)?.name;
  const highlight = highlightedName ? ` Em destaque: ${highlightedName}.` : '';
  return `Gráfico de linha da participação das regiões no PIB do Brasil, de ${years[0]} a ${years.at(-1)}. ${changes}.${highlight}`;
}
