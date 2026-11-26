import { MAX_COMPARED_STATES, REGIONS } from '../config.js';
import { buildComparisonRows, pickStates } from '../utils/compare.js';
import { formatIndicator } from '../utils/format.js';
import { requireElement } from '../utils/dom.js';

/** @typedef {import('../types.js').StateData} StateData */
/** @typedef {import('../types.js').Summary} Summary */
/** @typedef {import('../utils/compare.js').ComparisonRow} ComparisonRow */

// Comparação de até 3 estados lado a lado: seletores, tabela com barras e o Brasil como referência.
// Os seletores só avisam a escolha (onChange); quem decide o que aparece é o estado do painel.
/**
 * @param {{
 *   selects: HTMLSelectElement[],
 *   clearButton: HTMLButtonElement,
 *   hint: HTMLElement,
 *   result: HTMLElement,
 *   table: HTMLTableElement,
 *   onChange: (compare: string[]) => void,
 * }} options
 */
export function createStateCompare({ selects, clearButton, hint, result, table, onChange }) {
  const thead = requireElement('thead', HTMLTableSectionElement, table);
  const tbody = requireElement('tbody', HTMLTableSectionElement, table);
  let hasOptions = false;

  // Escolher o mesmo estado em dois seletores não duplica a coluna: a repetição sai
  function readSelection() {
    const chosen = selects.map((select) => select.value).filter((value) => value !== '');
    return [...new Set(chosen)].slice(0, MAX_COMPARED_STATES);
  }

  selects.forEach((select) => select.addEventListener('change', () => onChange(readSelection())));
  clearButton.addEventListener('click', () => onChange([]));

  // As opções dependem da lista de estados, que só chega com os dados: são montadas uma vez
  /** @param {StateData[]} states */
  function fillOptions(states) {
    const groups = REGIONS.map((region) => {
      const options = states
        .filter((state) => state.regionAcronym === region.acronym)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        .map((state) => `<option value="${state.acronym}">${state.name}</option>`)
        .join('');
      return `<optgroup label="${region.name}">${options}</optgroup>`;
    });
    const html = `<option value="">Nenhum</option>${groups.join('')}`;
    selects.forEach((select) => {
      select.innerHTML = html;
    });
    hasOptions = true;
  }

  /** @param {{ states: StateData[], compare: string[], brazil: Summary }} params */
  function update({ states, compare, brazil }) {
    if (!hasOptions) fillOptions(states);
    const selected = pickStates(states, compare);

    // Cada seletor mostra a escolha da sua posição; os que sobram voltam para "Nenhum"
    selects.forEach((select, index) => {
      select.value = selected[index]?.acronym ?? '';
    });
    clearButton.hidden = selected.length === 0;

    if (selected.length === 0) {
      hint.textContent = 'Escolha um ou mais estados para ver os números lado a lado.';
      result.hidden = true;
      return;
    }

    hint.textContent = selected.length === 1 ? 'Escolha outro estado para comparar com este.' : '';
    result.hidden = false;
    renderTable(selected, buildComparisonRows(selected, brazil));
  }

  /**
   * @param {StateData[]} selected
   * @param {ComparisonRow[]} rows
   */
  function renderTable(selected, rows) {
    thead.innerHTML = `
      <tr>
        <th scope="col">Indicador</th>
        ${selected.map((state) => `<th scope="col" class="is-numeric">${state.name}</th>`).join('')}
        <th scope="col" class="is-numeric compare-reference">Brasil</th>
      </tr>`;

    tbody.innerHTML = rows
      .map(
        (row) => `
      <tr>
        <th scope="row">${row.label}</th>
        ${row.cells
          .map(
            (cell) => `
          <td class="is-numeric${cell.isMax ? ' is-max' : ''}">
            <span class="compare-value">${formatIndicator(row.indicator, cell.value)}${
              cell.isMax ? '<span class="visually-hidden"> (maior)</span>' : ''
            }</span>
            <span class="compare-bar" style="--ratio: ${cell.ratio}" aria-hidden="true"></span>
          </td>`,
          )
          .join('')}
        <td class="is-numeric compare-reference">${formatIndicator(row.indicator, row.brazil)}</td>
      </tr>`,
      )
      .join('');
  }

  return { update };
}
