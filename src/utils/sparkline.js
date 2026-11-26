// Funções puras dos pequenos gráficos (sparklines) da série por estado.
// Nada aqui mexe na página: recebem números e devolvem números ou o texto do caminho do SVG.

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Variação entre o primeiro e o último valor (null se faltar um dos dois)
/**
 * @param {(number | null)[]} values
 * @returns {number | null}
 */
export function seriesChange(values) {
  const first = values[0];
  const last = values.at(-1);
  return isNumber(first) && isNumber(last) ? last - first : null;
}

// Diferença entre o maior e o menor valor da série (0 se não houver valores)
/**
 * @param {(number | null)[]} values
 */
export function seriesAmplitude(values) {
  const numbers = values.filter(isNumber);
  return numbers.length > 0 ? Math.max(...numbers) - Math.min(...numbers) : 0;
}

// Caminho do SVG de uma série. "range" é quanto de valor cabe na altura do desenho:
// passando o mesmo range para todos os gráficos, a mesma inclinação significa a mesma
// variação em todos eles (cada um parte do próprio mínimo). Anos sem dado quebram a linha.
/**
 * @param {(number | null)[]} values
 * @param {{ width: number, height: number, range: number, padding?: number }} box
 * @returns {string}
 */
export function sparklinePath(values, { width, height, range, padding = 0 }) {
  const numbers = values.filter(isNumber);
  if (numbers.length === 0) return '';

  const min = Math.min(...numbers);
  const innerHeight = height - padding * 2;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const round = (/** @type {number} */ n) => Math.round(n * 10) / 10;

  let path = '';
  let penDown = false; // "levanta a caneta" quando falta um ano
  values.forEach((value, index) => {
    if (!isNumber(value)) {
      penDown = false;
      return;
    }
    const ratio = range > 0 ? (value - min) / range : 0;
    const x = round(index * step);
    const y = round(height - padding - ratio * innerHeight);
    path += `${penDown ? 'L' : 'M'}${x} ${y}`;
    penDown = true;
  });
  return path;
}
