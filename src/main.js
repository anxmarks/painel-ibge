import './styles/main.css';
import { FALLBACK_REGION_INDICATOR, INDICATORS, REGIONS } from './config.js';
import {
  fetchArea,
  fetchGdp,
  fetchGdpSeries,
  fetchPopulation,
  fetchStateMesh,
  fetchStates,
} from './services/ibgeApi.js';
import {
  buildRegionShareSeries,
  filterByRegion,
  mergeStateData,
  summarizeStates,
} from './utils/transform.js';
import { createStore } from './state.js';
import { renderKpiCards, renderKpiSkeleton } from './components/kpiCards.js';
import { applyChartDefaults } from './components/chartTheme.js';
import { createBarChart } from './components/barChart.js';
import { createRegionChart } from './components/regionChart.js';
import { createStateMap } from './components/stateMap.js';
import { createHistoryChart } from './components/historyChart.js';
import { createHistoryTable } from './components/historyTable.js';
import { createDataTable } from './components/dataTable.js';
import { createFilters } from './components/filters.js';
import { createThemeToggle, getActiveTheme } from './components/themeToggle.js';
import {
  buildCsvFilename,
  buildHistoryCsv,
  buildHistoryCsvFilename,
  buildStatesCsv,
  downloadCsv,
} from './utils/exportCsv.js';
import { buildSearchFromFilters, parseFiltersFromSearch } from './utils/urlState.js';
import { requireElement } from './utils/dom.js';

/** @typedef {import('./types.js').AppState} AppState */
/** @typedef {import('./types.js').Filters} Filters */
/** @typedef {import('./types.js').RegionFilter} RegionFilter */

const main = requireElement('main', HTMLElement);
const kpiContainer = requireElement('#kpi-cards', HTMLElement);
const kpiTitle = requireElement('#kpi-title', HTMLElement);
const loadingMessage = requireElement('#loading-message', HTMLElement);
const errorPanel = requireElement('#error-panel', HTMLElement);
const errorMessage = requireElement('#error-message', HTMLElement);
const retryButton = requireElement('#retry-button', HTMLButtonElement);
// Botões, seletores e a busca: todos têm "disabled" e ficam desligados até os dados chegarem
/** @type {NodeListOf<HTMLButtonElement | HTMLSelectElement | HTMLInputElement>} */
const dataControls = document.querySelectorAll('[data-requires-data]');

// Estado inicial: carregando, sem dados ainda e com os filtros que vierem na URL
// (sem parâmetros, Brasil inteiro e indicador padrão). status pode ser 'loading', 'ready' ou 'error'.
/** @type {AppState} */
const initialState = {
  status: 'loading',
  errorMessage: '',
  states: [],
  mesh: null, // contornos dos estados para o mapa (GeoJSON)
  history: null, // participação de cada região no PIB, ano a ano
  ...parseFiltersFromSearch(window.location.search),
  theme: getActiveTheme(),
};
const store = createStore(initialState);

// Busca tudo em paralelo: os dados viram um único array de estados; a malha vai direto para o mapa
// e a série do PIB vira a participação de cada região por ano
async function loadDashboardData() {
  const [rawStates, population, gdp, area, mesh, gdpSeries] = await Promise.all([
    fetchStates(),
    fetchPopulation(),
    fetchGdp(),
    fetchArea(),
    fetchStateMesh(),
    fetchGdpSeries(),
  ]);
  const states = mergeStateData(rawStates, population, gdp, area);
  return { states, mesh, history: buildRegionShareSeries(states, gdpSeries) };
}

/** @param {RegionFilter} acronym */
function regionName(acronym) {
  return REGIONS.find((region) => region.acronym === acronym)?.name ?? 'Brasil';
}

// Reflete o status na página: o CSS usa data-status; leitores de tela, aria-busy e as mensagens
/** @param {AppState} state */
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
    button: requireElement('#theme-toggle', HTMLButtonElement),
    onChange: (theme) => store.setState({ theme }),
  });

  applyChartDefaults(); // precisa vir antes de criar os gráficos

  const filters = createFilters({
    regionSelect: requireElement('#region-filter', HTMLSelectElement),
    indicatorSelect: requireElement('#indicator-filter', HTMLSelectElement),
    onChange: (changes) => store.setState(changes),
  });
  const rankingChart = createBarChart({
    canvas: requireElement('#ranking-chart', HTMLCanvasElement),
    title: requireElement('#ranking-title', HTMLElement),
  });
  const regionChart = createRegionChart({
    canvas: requireElement('#region-chart', HTMLCanvasElement),
    legend: requireElement('#region-legend', HTMLElement),
    title: requireElement('#region-title', HTMLElement),
  });
  const stateMap = createStateMap({
    svg: requireElement('#state-map', SVGSVGElement),
    legend: requireElement('#map-legend', HTMLElement),
    legendTitle: requireElement('#map-legend-title', HTMLElement),
    title: requireElement('#map-title', HTMLElement),
    note: requireElement('#map-note', HTMLElement),
    tooltip: requireElement('#map-tooltip', HTMLElement),
  });
  const historyChart = createHistoryChart({
    canvas: requireElement('#history-chart', HTMLCanvasElement),
    legend: requireElement('#history-legend', HTMLElement),
    title: requireElement('#history-title', HTMLElement),
  });
  const historyTable = createHistoryTable({
    table: requireElement('#history-table', HTMLTableElement),
  });
  const dataTable = createDataTable({
    table: requireElement('#states-table', HTMLTableElement),
    searchInput: requireElement('#state-search', HTMLInputElement),
    resultCount: requireElement('#table-count', HTMLElement),
  });

  // Exporta exatamente o que a tabela mostra: região filtrada, busca e ordenação
  requireElement('#export-button', HTMLButtonElement).addEventListener('click', () => {
    const csv = buildStatesCsv(dataTable.getVisibleStates());
    downloadCsv(csv, buildCsvFilename(store.getState().region));
  });

  // A série inteira, sempre com as 5 regiões (o filtro só muda o destaque)
  requireElement('#history-export-button', HTMLButtonElement).addEventListener('click', () => {
    const { history } = store.getState();
    if (!history) return; // o botão fica desligado até os dados chegarem
    downloadCsv(buildHistoryCsv(history), buildHistoryCsvFilename(history.years));
  });

  /** @param {AppState} state */
  return function render(state) {
    renderStatus(state);

    if (state.status === 'loading') {
      renderKpiSkeleton(kpiContainer);
      dataTable.showLoading();
    }
    // Com status "ready", a malha e a série sempre chegaram juntas com os estados (loadData)
    if (state.status !== 'ready' || !state.mesh || !state.history) return;

    const { states, mesh, history, region, indicator } = state;
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

    // A série histórica é sempre do PIB, por região; a região filtrada fica em destaque
    historyChart.update({ history, region });
    historyTable.update({ history, region });
  };
}

// Busca os dados e muda o status conforme o resultado. Também é usada pelo botão "Tentar novamente".
async function loadData() {
  store.setState({ status: 'loading', errorMessage: '' });
  try {
    store.setState({ status: 'ready', ...(await loadDashboardData()) });
  } catch (error) {
    console.error(error);
    // Em JavaScript dá para lançar qualquer coisa (até um texto), então o tipo de "error" é unknown
    const reason = error instanceof Error ? error.message : 'Erro inesperado.';
    store.setState({
      status: 'error',
      errorMessage: `${reason} Verifique sua conexão e tente de novo.`,
    });
  }
}

/** @param {string} search */
function urlFor(search) {
  return `${window.location.pathname}${search}${window.location.hash}`;
}

// Mantém a URL igual aos filtros. Cada mudança vira uma entrada no histórico,
// então o botão "voltar" do navegador desfaz o último filtro.
/** @param {Filters} filters */
function syncUrl({ region, indicator }) {
  const search = buildSearchFromFilters({ region, indicator });
  if (search === window.location.search) return; // nada mudou (ou a mudança veio do próprio "voltar")
  window.history.pushState(null, '', urlFor(search));
}

// Link com valor inválido (ex.: ?regiao=XX) ou parâmetros estranhos: corrige a URL
// sem criar entrada no histórico, senão o "voltar" levaria de novo ao link quebrado
/** @param {Filters} filters */
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
