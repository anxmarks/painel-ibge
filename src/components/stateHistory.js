import { ALL_REGIONS, REGIONS, SPARKLINE } from '../config.js';
import { formatPercentagePoints, formatShare } from '../utils/format.js';
import { seriesAmplitude, seriesChange, sparklinePath } from '../utils/sparkline.js';

/** @typedef {import('../types.js').StateShareSeries} StateShareSeries */
/** @typedef {StateShareSeries['states'][number]} StateSeries */
/** @typedef {import('../types.js').RegionFilter} RegionFilter */

// Série histórica por estado em "pequenos múltiplos": um gráfico pequeno por estado,
// em vez de 27 linhas emaranhadas num gráfico só. Com uma região filtrada, só os estados dela.
/** @param {{ list: HTMLElement, title: HTMLElement }} elements */
export function createStateHistory({ list, title }) {
  /** @param {{ stateHistory: StateShareSeries, region: RegionFilter }} params */
  function update({ stateHistory, region }) {
    const { years, states } = stateHistory;
    const visible = states.filter(
      (state) => region === ALL_REGIONS || state.regionAcronym === region,
    );

    // Do que mais ganhou participação ao que mais perdeu (sem dado vai para o fim)
    const ranked = [...visible].sort(
      (a, b) => (seriesChange(b.shares) ?? -Infinity) - (seriesChange(a.shares) ?? -Infinity),
    );

    // Escala comum: a altura do desenho vale a maior variação entre os estados mostrados.
    // Assim a inclinação de Roraima e a de São Paulo podem ser comparadas de verdade.
    const range = Math.max(...visible.map((state) => seriesAmplitude(state.shares)), 0);

    const regionName = REGIONS.find((item) => item.acronym === region)?.name;
    const period = `${years[0]}–${years.at(-1)}`;
    title.textContent = `Participação de cada estado no PIB, ${period}${regionName ? `: ${regionName}` : ''}`;

    list.innerHTML = ranked.map((state) => cardTemplate(state, years, range)).join('');
  }

  return { update };
}

/**
 * @param {StateSeries} state
 * @param {number[]} years
 * @param {number} range
 */
function cardTemplate(state, years, range) {
  const path = sparklinePath(state.shares, { ...SPARKLINE, range });
  return `
    <li class="spark-card">
      <div class="spark-head">
        <span class="spark-name">${state.name}</span>
        <span class="spark-change"><span class="visually-hidden">variação: </span>${formatPercentagePoints(seriesChange(state.shares))}</span>
      </div>
      <svg class="spark" viewBox="0 0 ${SPARKLINE.width} ${SPARKLINE.height}" preserveAspectRatio="none" aria-hidden="true">
        <path d="${path}"></path>
      </svg>
      <p class="spark-values">
        <span class="visually-hidden">de ${years[0]} a ${years.at(-1)}: </span>${formatShare(state.shares[0] ?? null)} → ${formatShare(state.shares.at(-1) ?? null)}
      </p>
    </li>`;
}
