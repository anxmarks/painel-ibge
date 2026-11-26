import { geoConicEqualArea, geoPath } from 'd3-geo';
import { cssVar } from './chartTheme.js';
import {
  ALL_REGIONS,
  INDICATORS,
  MAP_CLASS_COUNT,
  MAP_PADDING,
  MAP_SIZE,
  REGIONS,
} from '../config.js';
import { classify, computeQuantileBreaks, mapIndicatorFor, rewindForD3 } from '../utils/map.js';
import { rankStates } from '../utils/transform.js';
import { formatIndicator } from '../utils/format.js';

/** @typedef {import('../types.js').StateData} StateData */
/** @typedef {import('../types.js').StateMesh} StateMesh */
/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */
/** @typedef {import('../types.js').RegionFilter} RegionFilter */
/** @typedef {{ states: StateData[], mesh: StateMesh, indicator: IndicatorKey, region: RegionFilter }} MapParams */

const SVG_NS = 'http://www.w3.org/2000/svg';
const TOOLTIP_OFFSET = 12; // distância entre o ponteiro e a caixinha, em px
const DESCRIBED_ENDS = 3; // quantos estados de cada ponta o texto para leitores de tela cita
const PATH_DIGITS = 1; // casas decimais nos caminhos do SVG: num desenho de 600px, 1 casa basta

// Projeção cônica de áreas iguais: cada estado aparece com a área proporcional à real,
// o que importa num mapa em que a cor é comparada por área. Centrada no Brasil.
/** @param {StateMesh} mesh */
function createProjection(mesh) {
  return geoConicEqualArea()
    .parallels([-2, -22])
    .rotate([54, 0])
    .fitExtent(
      [
        [MAP_PADDING, MAP_PADDING],
        [MAP_SIZE - MAP_PADDING, MAP_SIZE - MAP_PADDING],
      ],
      mesh,
    );
}

// Mapa coroplético dos estados: a cor de cada estado mostra em que faixa o indicador está
/**
 * @param {{
 *   svg: SVGSVGElement,
 *   legend: HTMLElement,
 *   legendTitle: HTMLElement,
 *   title: HTMLElement,
 *   note: HTMLElement,
 *   tooltip: HTMLElement,
 * }} elements
 */
export function createStateMap({ svg, legend, legendTitle, title, note, tooltip }) {
  const container = svg.parentElement ?? svg;
  /** @type {Map<number, SVGPathElement>} */
  const paths = new Map(); // id do estado -> <path>
  /** @type {Map<number, { name: string, value: string }>} */
  const tooltipTexts = new Map(); // id do estado -> { name, value }
  /** @type {MapParams | null} */
  let pending = null; // última atualização pedida enquanto o contorno ainda não foi desenhado

  svg.setAttribute('viewBox', `0 0 ${MAP_SIZE} ${MAP_SIZE}`);

  // O contorno dos estados não muda: é desenhado uma vez só, na primeira atualização
  /** @param {StateMesh} mesh */
  function drawMesh(mesh) {
    const features = mesh.features.map(rewindForD3);
    const toPath = geoPath(createProjection({ ...mesh, features })).digits(PATH_DIGITS);

    for (const feature of features) {
      const path = document.createElementNS(SVG_NS, 'path');
      const id = Number(feature.properties.codarea);
      path.setAttribute('d', toPath(feature) ?? '');
      path.setAttribute('class', 'map-state');
      path.dataset.stateId = String(id);
      svg.append(path);
      paths.set(id, path);
    }
  }

  /** @param {PointerEvent} event */
  function showTooltip(event) {
    const path = event.target instanceof Element && event.target.closest('.map-state');
    const text = path instanceof SVGPathElement && tooltipTexts.get(Number(path.dataset.stateId));
    if (!path || !text) return hideTooltip();

    tooltip.innerHTML = `<strong>${text.name}</strong><span>${text.value}</span>`;
    tooltip.hidden = false;

    // Posição relativa ao container; perto da borda direita, a caixinha vai para o outro lado
    const box = container.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    const flip = x + TOOLTIP_OFFSET + tooltip.offsetWidth > box.width;
    tooltip.style.left = `${flip ? x - TOOLTIP_OFFSET - tooltip.offsetWidth : x + TOOLTIP_OFFSET}px`;
    tooltip.style.top = `${y + TOOLTIP_OFFSET}px`;

    // O estado sob o ponteiro vai para o fim do SVG, para a borda destacada não ficar por baixo dos vizinhos
    svg.append(path);
  }

  function hideTooltip() {
    tooltip.hidden = true;
  }

  // Mouse e toque usam os mesmos eventos de "pointer"; um toque também mostra a caixinha
  svg.addEventListener('pointermove', showTooltip);
  svg.addEventListener('pointerdown', showTooltip);
  // No toque, o navegador dispara "pointerleave" assim que o dedo sai da tela: se escondesse aqui,
  // a caixinha sumiria na hora. No toque, ela fica até a pessoa tocar fora do mapa.
  svg.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') hideTooltip();
  });
  document.addEventListener('pointerdown', (event) => {
    const isInsideMap = event.target instanceof Node && svg.contains(event.target);
    if (!isInsideMap) hideTooltip();
  });

  // Desenhar os 27 contornos é a parte mais pesada do painel (projetar ~5 mil pontos).
  // Na primeira vez, isso vai para uma tarefa separada: os cards, os gráficos e a tabela aparecem
  // antes, e a página não fica travada numa tarefa longa só. Depois, cada update só troca as cores.
  /** @param {MapParams} params */
  function update(params) {
    if (paths.size > 0) return paint(params);

    const isFirstRequest = pending === null;
    pending = params; // se chegar outro update antes do desenho, vale o mais recente
    if (!isFirstRequest) return;

    setTimeout(() => {
      if (!pending) return;
      drawMesh(pending.mesh);
      paint(pending);
    });
  }

  /** @param {MapParams} params */
  function paint({ states, indicator, region }) {
    const mapIndicator = mapIndicatorFor(indicator);
    const { label } = INDICATORS[mapIndicator];
    // As faixas usam sempre os 27 estados: filtrar uma região não muda a cor de ninguém
    const breaks = computeQuantileBreaks(
      states.map((state) => state[mapIndicator]),
      MAP_CLASS_COUNT,
    );
    // As cores são lidas a cada update para acompanhar a troca de tema
    const colors = Array.from({ length: MAP_CLASS_COUNT }, (_, index) =>
      cssVar(`--color-map-${index + 1}`),
    );
    const mutedColor = cssVar('--color-map-muted');
    /** @param {StateData} state */
    const isInRegion = (state) => region === ALL_REGIONS || state.regionAcronym === region;

    svg.style.setProperty('--map-stroke', cssVar('--color-surface'));
    for (const state of states) {
      const path = paths.get(state.id);
      if (!path) continue;

      const classIndex = classify(state[mapIndicator], breaks);
      const highlighted = isInRegion(state) && classIndex !== null;
      path.style.fill = highlighted ? colors[classIndex] : mutedColor;
      path.classList.toggle('is-muted', !isInRegion(state));
      tooltipTexts.set(state.id, {
        name: state.name,
        value: formatIndicator(mapIndicator, state[mapIndicator]),
      });
    }

    title.textContent = `Mapa: ${label}`;
    const { unit } = INDICATORS[mapIndicator];
    legendTitle.textContent = unit ? `Faixas (${unit})` : 'Faixas';
    note.textContent =
      mapIndicator === indicator
        ? ''
        : `Mapas comparam taxas, e não totais. Para o indicador "${INDICATORS[indicator].label}", o mapa mostra ${INDICATORS[mapIndicator].inSentence}.`;
    legend.innerHTML = legendTemplate({ breaks, colors, mutedColor, mapIndicator, region });
    svg.setAttribute('aria-label', describeMap(states.filter(isInRegion), mapIndicator, region));
  }

  return { update };
}

// Rótulo de cada faixa: "até 5", "5 a 12", ..., "acima de 70"
/**
 * @param {number[]} breaks
 * @param {IndicatorKey} indicator
 */
function classLabels(breaks, indicator) {
  /** @param {number | undefined} value */
  const format = (value) => formatIndicator(indicator, value ?? null, { short: true });
  return Array.from({ length: breaks.length + 1 }, (_, index) => {
    if (index === 0) return `até ${format(breaks[0])}`;
    if (index === breaks.length) return `acima de ${format(breaks.at(-1))}`;
    return `${format(breaks[index - 1])} a ${format(breaks[index])}`;
  });
}

/**
 * @param {{
 *   breaks: number[],
 *   colors: string[],
 *   mutedColor: string,
 *   mapIndicator: IndicatorKey,
 *   region: RegionFilter,
 * }} params
 */
function legendTemplate({ breaks, colors, mutedColor, mapIndicator, region }) {
  const items = classLabels(breaks, mapIndicator).map(
    (text, index) => `
      <li class="map-legend-item">
        <span class="legend-swatch" style="background: ${colors[index]}"></span>
        <span>${text}</span>
      </li>`,
  );
  if (region !== ALL_REGIONS) {
    items.push(`
      <li class="map-legend-item">
        <span class="legend-swatch" style="background: ${mutedColor}"></span>
        <span>Fora da região escolhida</span>
      </li>`);
  }
  return items.join('');
}

// Texto para leitores de tela: o que o mapa mostra e quais estados estão nas pontas.
// Os valores de todos os estados estão na tabela logo abaixo.
/**
 * @param {StateData[]} states
 * @param {IndicatorKey} indicator
 * @param {RegionFilter} region
 */
function describeMap(states, indicator, region) {
  const ranked = rankStates(states, indicator);
  /** @param {StateData[]} items */
  const list = (items) =>
    items
      .map((state) => `${state.name} (${formatIndicator(indicator, state[indicator])})`)
      .join(', ');
  const regionName = REGIONS.find((item) => item.acronym === region)?.name;
  const place = regionName ? `da região ${regionName}` : 'dos estados';

  const intro = `Mapa ${place}: ${INDICATORS[indicator].label}.`;

  // Com poucos estados (o Sul tem 3), "maiores" e "menores" repetiriam os mesmos nomes
  if (ranked.length <= DESCRIBED_ENDS * 2) {
    return `${intro} Do maior para o menor: ${list(ranked)}.`;
  }
  return (
    `${intro} Maiores: ${list(ranked.slice(0, DESCRIBED_ENDS))}. ` +
    `Menores: ${list(ranked.slice(-DESCRIBED_ENDS).reverse())}.`
  );
}
