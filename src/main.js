import './styles/main.css';
import { DEFAULT_RANKING_INDICATOR, DEFAULT_REGION_INDICATOR } from './config.js';
import { fetchStates, fetchPopulation, fetchGdp } from './services/ibgeApi.js';
import { mergeStateData, summarizeStates } from './utils/transform.js';
import { renderKpiCards } from './components/kpiCards.js';
import { applyChartDefaults } from './components/chartTheme.js';
import { createBarChart } from './components/barChart.js';
import { createRegionChart } from './components/regionChart.js';
import { createDataTable } from './components/dataTable.js';

const kpiContainer = document.querySelector('#kpi-cards');
const statusMessage = document.querySelector('#status-message');

// Busca as três respostas em paralelo e junta em um único array de estados
async function loadStates() {
  const [states, population, gdp] = await Promise.all([
    fetchStates(),
    fetchPopulation(),
    fetchGdp(),
  ]);
  return mergeStateData(states, population, gdp);
}

function showError(message) {
  statusMessage.textContent = message;
  statusMessage.hidden = false;
}

async function init() {
  try {
    const states = await loadStates();

    renderKpiCards(kpiContainer, summarizeStates(states));

    applyChartDefaults();
    const rankingChart = createBarChart({
      canvas: document.querySelector('#ranking-chart'),
      title: document.querySelector('#ranking-title'),
    });
    const regionChart = createRegionChart({
      canvas: document.querySelector('#region-chart'),
      legend: document.querySelector('#region-legend'),
      title: document.querySelector('#region-title'),
    });

    const dataTable = createDataTable({
      table: document.querySelector('#states-table'),
      searchInput: document.querySelector('#state-search'),
      resultCount: document.querySelector('#table-count'),
    });

    rankingChart.update(states, DEFAULT_RANKING_INDICATOR);
    regionChart.update(states, DEFAULT_REGION_INDICATOR);
    dataTable.update(states);
  } catch (error) {
    console.error(error);
    showError(`${error.message} Tente recarregar a página em alguns instantes.`);
  }
}

init();
