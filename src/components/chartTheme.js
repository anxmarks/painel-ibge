import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

// Registra só as partes do Chart.js que o painel usa (deixa o bundle menor)
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

// O Chart.js desenha em <canvas> e não lê variáveis CSS sozinho; esta função busca o valor
/** @param {string} name */
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Duração padrão das animações do Chart.js, guardada para poder voltar a ela
// (o tipo aceita "false", que desliga as animações; nos padrões do Chart.js é sempre um objeto)
const animationDefaults = /** @type {import('chart.js').AnimationSpec<'bar'>} */ (
  Chart.defaults.animation
);
const defaultAnimationDuration = animationDefaults.duration;
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// Aparência padrão de todos os gráficos, a partir dos tokens do variables.css.
// É chamada de novo a cada troca de tema, porque os valores das variáveis mudam.
export function applyChartDefaults() {
  Chart.defaults.font.family = cssVar('--font-family');
  Chart.defaults.color = cssVar('--color-text-muted');
  Chart.defaults.borderColor = cssVar('--color-border');
  // Tooltip "invertido": fundo da cor do texto e texto da cor da superfície (funciona nos dois temas)
  Chart.defaults.plugins.tooltip.backgroundColor = cssVar('--color-text');
  Chart.defaults.plugins.tooltip.titleColor = cssVar('--color-surface');
  Chart.defaults.plugins.tooltip.bodyColor = cssVar('--color-surface');
  // Quem pediu menos movimento no sistema vê os gráficos mudarem sem animação
  animationDefaults.duration = reducedMotionQuery.matches ? 0 : defaultAnimationDuration;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 6;
}

// O Chart.js guarda em cache as opções dos eixos quando cria o gráfico, então mudar os
// padrões acima não basta: na troca de tema, as cores dos eixos são passadas de novo aqui
// Recebe qualquer gráfico que tenha eixos (barras, linhas...); a rosca não tem e não precisa disto
/**
 * @typedef {{ ticks?: { color?: unknown }, grid?: { color?: unknown } }} ScaleColors
 * @param {{ options: { scales?: Record<string, ScaleColors | undefined> } }} chart
 */
export function applyScaleColors(chart) {
  Object.values(chart.options.scales ?? {}).forEach((scale) => {
    if (scale?.ticks) scale.ticks.color = cssVar('--color-text-muted');
    if (scale?.grid) scale.grid.color = cssVar('--color-border');
  });
}

export { Chart };
