import { geoArea } from 'd3-geo';
import { INDICATORS, MAP_RATE_INDICATOR } from '../config.js';

// Mapas pintam taxas, não totais: num mapa de população, os estados grandes "pareceriam"
// importantes só pelo tamanho. Para indicadores que são totais, o mapa usa a taxa correspondente.
export function mapIndicatorFor(indicator) {
  return INDICATORS[indicator].additive ? MAP_RATE_INDICATOR[indicator] : indicator;
}

// Limites entre as faixas de cor por quantis: cada faixa fica com (quase) o mesmo número de estados.
// Com 5 faixas, devolve 4 limites. Os valores ausentes (null) ficam de fora.
// Quantis funcionam bem com dados assimétricos como a densidade (de 2,5 a 489 hab/km²):
// com faixas de mesmo tamanho, quase todos os estados cairiam na primeira.
export function computeQuantileBreaks(values, classCount) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
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
export function classify(value, breaks) {
  if (!Number.isFinite(value)) return null;
  return breaks.filter((limit) => value > limit).length;
}

function reverseRings(polygon) {
  return polygon.map((ring) => [...ring].reverse());
}

// O padrão GeoJSON (RFC 7946) desenha o contorno externo no sentido anti-horário, mas o d3-geo,
// que trabalha numa esfera, espera o sentido horário. No sentido "errado", o d3 entende o polígono
// como o globo inteiro MENOS o estado (área maior que meia esfera, 2π). Aí é só inverter os anéis.
export function rewindForD3(feature) {
  if (geoArea(feature) <= 2 * Math.PI) return feature;

  const { type, coordinates } = feature.geometry;
  const rewound =
    type === 'Polygon'
      ? reverseRings(coordinates)
      : coordinates.map((polygon) => reverseRings(polygon));

  return { ...feature, geometry: { type, coordinates: rewound } };
}
