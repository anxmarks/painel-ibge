import './styles/main.css';
import { FALLBACK_REGION_INDICATOR, INDICATORS, REGIONS } from './config.js';
import {
  fetchArea,
  fetchGdp,
  fetchPopulation,
  fetchStateMesh,
  fetchStates,
} from './services/ibgeApi.js';
import { filterByRegion, mergeStateData, summarizeStates } from './utils/transform.js';
import { createStore } from './state.js';
import { renderKpiCards, renderKpiSkeleton } from './components/kpiCards.js';
import { applyChartDefaults } from './components/chartTheme.js';
import { createBarChart } from './components/barChart.js';
import { createRegionChart } from './components/regionChart.js';
import { createStateMap } from './components/stateMap.js';
import { createDataTable } from './components/dataTable.js';
import { createFilters } from './components/filters.js';
import { createThemeToggle, getActiveTheme } from './components/themeToggle.js';
import { buildCsvFilename, buildStatesCsv, downloadCsv } from './utils/exportCsv.js';
import { buildSearchFromFilters, parseFiltersFromSearch } from './utils/urlState.js';

const main = document.querySelector('main');
const kpiContainer = document.querySelector('#kpi-cards');
const kpiTitle = document.querySelector('#kpi-title');
const loadingMessage = document.querySelector('#loading-message');
const errorPanel = document.querySelector('#error-panel');
const errorMessage = document.querySelector('#error-message');
const retryButton = document.querySelector('#retry-button');
const dataControls = document.querySelectorAll('[data-requires-data]');

// Estado inicial: carregando, sem dados ainda e com os filtros que vierem na URL
// (sem parâmetros, Brasil inteiro e indicador padrão). status pode ser 'loading', 'ready' ou 'error'.
const store = createStore({
  status: 'loading',
  errorMessage: '',
  states: [],
  mesh: null, // contornos dos estados para o mapa (GeoJSON)
  ...parseFiltersFromSearch(window.location.search),
  theme: getActiveTheme(),
});

// Busca tudo em paralelo: os dados viram um único array de estados; a malha vai direto para o mapa
async function loadDashboardData() {
  const [states, population, gdp, area, mesh] = await Promise.all([
    fetchStates(),
    fetchPopulation(),
    fetchGdp(),
    fetchArea(),
    fetchStateMesh(),
  ]);
  return { states: mergeStateData(states, population, gdp, area), mesh };
}

function regionName(acronym) {
  return REGIONS.find((region) => region.acronym === acronym)?.name ?? 'Brasil';
}

// Reflete o status na página: o CSS usa data-status; leitores de tela, aria-busy e as mensagens
function renderStatus({ status, errorMessage: message }) {
  main.dataset.status = status;
  main.setAttribute('aria-busy', String(status === 'loading'));
  dataControls.forEach((control) => {
    control.disabled = status !== 'ready';
  });

  loadingMessage.textContent = status === 'loading' ? 'Carregando dados do IBGE…' : '';
  errorPanel.hidden = status !== 'error';
  errorMessage.textContent = message;
}

// Cria os componentes uma vez e devolve a função que redesenha todos a partir do estado
function setupDashboard() {
  // Trocar o tema muda o estado; o render redesenha os gráficos com as cores novas
  createThemeToggle({
    button: document.querySelector('#theme-toggle'),
    onChange: (theme) => store.setState({ theme }),
  });

  applyChartDefaults(); // precisa vir antes de criar os gráficos

  const filters = createFilters({
    regionSelect: document.querySelector('#region-filter'),
    indicatorSelect: document.querySelector('#indicator-filter'),
    onChange: (changes) => store.setState(changes),
  });
  const rankingChart = createBarChart({
    canvas: document.querySelector('#ranking-chart'),
    title: document.querySelector('#ranking-title'),
  });
  const regionChart = createRegionChart({
    canvas: document.querySelector('#region-chart'),
    legend: document.querySelector('#region-legend'),
    title: document.querySelector('#region-title'),
  });
  const stateMap = createStateMap({
    svg: document.querySelector('#state-map'),
    legend: document.querySelector('#map-legend'),
    legendTitle: document.querySelector('#map-legend-title'),
    title: document.querySelector('#map-title'),
    note: document.querySelector('#map-note'),
    tooltip: document.querySelector('#map-tooltip'),
  });
  const dataTable = createDataTable({
    table: document.querySelector('#states-table'),
    searchInput: document.querySelector('#state-search'),
    resultCount: document.querySelector('#table-count'),
  });

  // Exporta exatamente o que a tabela mostra: região filtrada, busca e ordenação
  document.querySelector('#export-button').addEventListener('click', () => {
    const csv = buildStatesCsv(dataTable.getVisibleStates());
    downloadCsv(csv, buildCsvFilename(store.getState().region));
  });

  return function render(state) {
    renderStatus(state);

    if (state.status === 'loading') {
      renderKpiSkeleton(kpiContainer);
      dataTable.showLoading();
    }
    if (state.status !== 'ready') return;

    const { states, mesh, region, indicator } = state;
    const visibleStates = filterByRegion(states, region);

    applyChartDefaults(); // relê as cores do tema atual antes de atualizar os gráficos

    filters.update({ region, indicator });
    kpiTitle.textContent = `Resumo: ${regionName(region)}`;
    renderKpiCards(kpiContainer, summarizeStates(visibleStates));
    rankingChart.update(visibleStates, indicator);
    dataTable.update(visibleStates);

    // A rosca sempre mostra o Brasil inteiro, para dar contexto à região filtrada.
    // PIB per capita e densidade não podem ser somados entre regiões; nesses casos ela mostra o PIB.
    const regionIndicator = INDICATORS[indicator].additive ? indicator : FALLBACK_REGION_INDICATOR;
    regionChart.update(states, regionIndicator);

    // O mapa também recebe todos os estados: os de fora da região ficam cinza, como contexto
    stateMap.update({ states, mesh, indicator, region });
  };
}

// Busca os dados e muda o status conforme o resultado. Também é usada pelo botão "Tentar novamente".
async function loadData() {
  store.setState({ status: 'loading', errorMessage: '' });
  try {
    store.setState({ status: 'ready', ...(await loadDashboardData()) });
  } catch (error) {
    console.error(error);
    store.setState({
      status: 'error',
      errorMessage: `${error.message} Verifique sua conexão e tente de novo.`,
    });
  }
}

function urlFor(search) {
  return `${window.location.pathname}${search}${window.location.hash}`;
}

// Mantém a URL igual aos filtros. Cada mudança vira uma entrada no histórico,
// então o botão "voltar" do navegador desfaz o último filtro.
function syncUrl({ region, indicator }) {
  const search = buildSearchFromFilters({ region, indicator });
  if (search === window.location.search) return; // nada mudou (ou a mudança veio do próprio "voltar")
  window.history.pushState(null, '', urlFor(search));
}

// Link com valor inválido (ex.: ?regiao=XX) ou parâmetros estranhos: corrige a URL
// sem criar entrada no histórico, senão o "voltar" levaria de novo ao link quebrado
function normalizeUrl({ region, indicator }) {
  window.history.replaceState(null, '', urlFor(buildSearchFromFilters({ region, indicator })));
}

// "Voltar" e "avançar" trocam a URL sem recarregar: aí é o estado que segue a URL
function listenToHistory() {
  window.addEventListener('popstate', () => {
    store.setState(parseFiltersFromSearch(window.location.search));
  });
}

function init() {
  const render = setupDashboard();
  store.subscribe(render);
  normalizeUrl(store.getState());
  store.subscribe(syncUrl);
  listenToHistory();
  render(store.getState()); // primeira pintura: o skeleton aparece antes de qualquer resposta
  retryButton.addEventListener('click', loadData);
  loadData();
}

init();
