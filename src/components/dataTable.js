import { INDICATORS, SKELETON_TABLE_ROWS } from '../config.js';
import { searchStates, sortStates } from '../utils/transform.js';
import { formatIndicator } from '../utils/format.js';
import { requireElement } from '../utils/dom.js';

/** @typedef {import('../types.js').StateData} StateData */
/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */
/** @typedef {import('../types.js').SortDirection} SortDirection */
/** @typedef {import('../types.js').TableColumnKey} TableColumnKey */

// Uma coluna de texto ou uma coluna de indicador. O "numeric" diz qual das duas é:
// com ele, o TypeScript sabe que a key de uma coluna numérica é sempre um IndicatorKey.
/** @typedef {{ key: 'name' | 'regionName', label: string, numeric: false }} TextColumn */
/** @typedef {{ key: IndicatorKey, label: string, numeric: true }} NumericColumn */
/** @typedef {TextColumn | NumericColumn} Column */

// Colunas da tabela: "key" é a propriedade do estado; numéricas ficam alinhadas à direita
/** @type {Column[]} */
const COLUMNS = [
  { key: 'name', label: 'Estado', numeric: false },
  { key: 'regionName', label: 'Região', numeric: false },
  { key: 'population', label: INDICATORS.population.label, numeric: true },
  { key: 'gdp', label: INDICATORS.gdp.label, numeric: true },
  { key: 'gdpPerCapita', label: INDICATORS.gdpPerCapita.label, numeric: true },
  { key: 'density', label: INDICATORS.density.label, numeric: true },
];

// As colunas numéricas são indicadores: cada célula usa o formatador do próprio indicador
const NUMERIC_COLUMNS = COLUMNS.filter(
  /** @returns {column is NumericColumn} */ (column) => column.numeric,
);

/** @type {Record<SortDirection, string>} */
const ARIA_SORT = { asc: 'ascending', desc: 'descending' };

// Tabela com ordenação por coluna (clicando no cabeçalho) e busca por nome ou sigla
/**
 * @param {{ table: HTMLTableElement, searchInput: HTMLInputElement, resultCount: HTMLElement }} elements
 */
export function createDataTable({ table, searchInput, resultCount }) {
  /** @type {StateData[]} */
  let allStates = [];
  // Estado local da tabela: só ela precisa saber como está ordenada e o que foi buscado
  /** @type {TableColumnKey} */
  let sortKey = 'name';
  /** @type {SortDirection} */
  let sortDirection = 'asc';

  const thead = requireElement('thead', HTMLTableSectionElement, table);
  const tbody = requireElement('tbody', HTMLTableSectionElement, table);

  renderHeader();

  // Um único listener no <thead> atende todos os botões (delegação de eventos)
  thead.addEventListener('click', (event) => {
    const button = event.target instanceof Element && event.target.closest('button[data-key]');
    if (!(button instanceof HTMLElement)) return;
    const column = COLUMNS.find((item) => item.key === button.dataset.key);
    if (column) toggleSort(column);
  });

  searchInput.addEventListener('input', renderBody);

  // Clicar na mesma coluna inverte a direção; numa coluna nova, números começam do maior
  /** @param {Column} column */
  function toggleSort(column) {
    if (column.key === sortKey) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = column.key;
      sortDirection = column.numeric ? 'desc' : 'asc';
    }
    renderHeader();
    renderBody();
  }

  function renderHeader() {
    thead.innerHTML = `<tr>${COLUMNS.map(headerCellTemplate).join('')}</tr>`;
  }

  /** @param {Column} column */
  function headerCellTemplate(column) {
    const isActive = column.key === sortKey;
    const ariaSort = isActive ? ARIA_SORT[sortDirection] : 'none';
    const arrow = isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '';

    return `
      <th scope="col" aria-sort="${ariaSort}" class="${column.numeric ? 'is-numeric' : ''}">
        <button type="button" class="sort-button" data-key="${column.key}">
          ${column.label}<span class="sort-arrow" aria-hidden="true">${arrow}</span>
        </button>
      </th>
    `;
  }

  // Os estados que a tabela mostra agora: com a busca e a ordenação aplicadas
  function getVisibleStates() {
    return sortStates(searchStates(allStates, searchInput.value), sortKey, sortDirection);
  }

  function renderBody() {
    const visibleStates = getVisibleStates();

    tbody.innerHTML =
      visibleStates.length > 0
        ? visibleStates.map(rowTemplate).join('')
        : `<tr><td colspan="${COLUMNS.length}" class="empty-row">Nenhum estado encontrado.</td></tr>`;

    resultCount.textContent = `${visibleStates.length} de ${allStates.length} estados`;
  }

  // Recebe a lista de estados (já filtrada por região, quando houver filtro) e redesenha
  /** @param {StateData[]} states */
  function update(states) {
    allStates = states;
    renderBody();
  }

  // Linhas de carregamento: o cabeçalho já aparece e o corpo mostra blocos animados
  function showLoading() {
    const cells = COLUMNS.map(
      (column) =>
        `<td class="${column.numeric ? 'is-numeric' : ''}"><span class="skeleton skeleton-text"></span></td>`,
    ).join('');

    tbody.innerHTML = `<tr aria-hidden="true">${cells}</tr>`.repeat(SKELETON_TABLE_ROWS);
    resultCount.textContent = '';
  }

  return { update, showLoading, getVisibleStates };
}

/** @param {StateData} state */
function rowTemplate(state) {
  return `
    <tr>
      <th scope="row">${state.name} <span class="state-acronym">${state.acronym}</span></th>
      <td>${state.regionName}</td>
      ${NUMERIC_COLUMNS.map(
        ({ key }) => `<td class="is-numeric">${formatIndicator(key, state[key])}</td>`,
      ).join('')}
    </tr>
  `;
}
