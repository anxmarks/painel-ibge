import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  DoughnutController,
  ArcElement,
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
  Tooltip,
);

// O Chart.js desenha em <canvas> e não lê variáveis CSS sozinho; esta função busca o valor
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Aparência padrão de todos os gráficos, a partir dos tokens do variables.css
export function applyChartDefaults() {
  Chart.defaults.font.family = cssVar('--font-family');
  Chart.defaults.color = cssVar('--color-text-muted');
  Chart.defaults.borderColor = cssVar('--color-border');
  Chart.defaults.plugins.tooltip.backgroundColor = cssVar('--color-text');
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 6;
}

export { Chart };
