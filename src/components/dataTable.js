import { INDICATORS, SKELETON_TABLE_ROWS } from '../config.js';
import { searchStates, sortStates } from '../utils/transform.js';
import { formatIndicator } from '../utils/format.js';

// Colunas da tabela: "key" é a propriedade do estado; numéricas ficam alinhadas à direita
const COLUMNS = [
  { key: 'name', label: 'Estado', numeric: false },
  { key: 'regionName', label: 'Região', numeric: false },
  { key: 'population', label: INDICATORS.population.label, numeric: true },
  { key: 'gdp', label: INDICATORS.gdp.label, numeric: true },
  { key: 'gdpPerCapita', label: INDICATORS.gdpPerCapita.label, numeric: true },
];

const ARIA_SORT = { asc: 'ascending', desc: 'descending' };

// Tabela com ordenação por coluna (clicando no cabeçalho) e busca por nome ou sigla
export function createDataTable({ table, searchInput, resultCount }) {
  let allStates = [];
  // Estado local da tabela: só ela precisa saber como está ordenada e o que foi buscado
  let sortKey = 'name';
  let sortDirection = 'asc';

  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  renderHeader();

  // Um único listener no <thead> atende todos os botões (delegação de eventos)
  thead.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-key]');
    if (!button) return;
    toggleSort(button.dataset.key);
  });

  searchInput.addEventListener('input', renderBody);

  // Clicar na mesma coluna inverte a direção; numa coluna nova, números começam do maior
  function toggleSort(key) {
    if (key === sortKey) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDirection = COLUMNS.find((column) => column.key === key).numeric ? 'desc' : 'asc';
    }
    renderHeader();
    renderBody();
  }

  function renderHeader() {
    thead.innerHTML = `<tr>${COLUMNS.map(headerCellTemplate).join('')}</tr>`;
  }

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

function rowTemplate(state) {
  return `
    <tr>
      <th scope="row">${state.name} <span class="state-acronym">${state.acronym}</span></th>
      <td>${state.regionName}</td>
      <td class="is-numeric">${formatIndicator('population', state.population)}</td>
      <td class="is-numeric">${formatIndicator('gdp', state.gdp)}</td>
      <td class="is-numeric">${formatIndicator('gdpPerCapita', state.gdpPerCapita)}</td>
    </tr>
  `;
}
