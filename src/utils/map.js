import { geoArea } from 'd3-geo';
import { MAP_RATE_INDICATOR } from '../config.js';

/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */
/** @typedef {import('../types.js').StateFeature} StateFeature */
/** @typedef {import('geojson').Position[][]} PolygonRings */

// Mapas pintam taxas, não totais: num mapa de população, os estados grandes "pareceriam"
// importantes só pelo tamanho. Para indicadores que são totais, o mapa usa a taxa correspondente.
/**
 * @param {IndicatorKey} indicator
 * @returns {IndicatorKey}
 */
export function mapIndicatorFor(indicator) {
  return MAP_RATE_INDICATOR[indicator] ?? indicator;
}

// Limites entre as faixas de cor por quantis: cada faixa fica com (quase) o mesmo número de estados.
// Com 5 faixas, devolve 4 limites. Os valores ausentes (null) ficam de fora.
// Quantis funcionam bem com dados assimétricos como a densidade (de 2,5 a 489 hab/km²):
// com faixas de mesmo tamanho, quase todos os estados cairiam na primeira.
/**
 * @param {(number | null)[]} values
 * @param {number} classCount
 * @returns {number[]}
 */
export function computeQuantileBreaks(values, classCount) {
  const sorted = values.filter(isFiniteNumber).sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  return Array.from({ length: classCount - 1 }, (_, index) => {
    // Posição do quantil, com interpolação linear entre os dois vizinhos
    const position = ((sorted.length - 1) * (index + 1)) / classCount;
    const lower = Math.floor(position);
    const fraction = position - lower;
    const upper = Math.min(lower + 1, sorted.length - 1);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * fraction;
  });
}

// Em qual faixa (0 = a mais baixa) o valor cai. Valor igual ao limite fica na faixa de baixo.
// Devolve null para valor ausente, que o mapa pinta de cinza.
/**
 * @param {number | null} value
 * @param {number[]} breaks
 * @returns {number | null}
 */
export function classify(value, breaks) {
  if (!isFiniteNumber(value)) return null;
  return breaks.filter((limit) => value > limit).length;
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isFiniteNumber(value) {
  return Number.isFinite(value);
}

/** @param {PolygonRings} polygon */
function reverseRings(polygon) {
  return polygon.map((ring) => [...ring].reverse());
}

// O padrão GeoJSON (RFC 7946) desenha o contorno externo no sentido anti-horário, mas o d3-geo,
// que trabalha numa esfera, espera o sentido horário. No sentido "errado", o d3 entende o polígono
// como o globo inteiro MENOS o estado (área maior que meia esfera, 2π). Aí é só inverter os anéis.
/**
 * @param {StateFeature} feature
 * @returns {StateFeature}
 */
export function rewindForD3(feature) {
  if (geoArea(feature) <= 2 * Math.PI) return feature;

  const { geometry } = feature;
  return {
    ...feature,
    geometry:
      geometry.type === 'Polygon'
        ? { type: 'Polygon', coordinates: reverseRings(geometry.coordinates) }
        : { type: 'MultiPolygon', coordinates: geometry.coordinates.map(reverseRings) },
  };
}
