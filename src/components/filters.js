import { ALL_REGIONS, INDICATORS, REGIONS } from '../config.js';

/** @typedef {import('../types.js').Filters} Filters */
/** @typedef {import('../types.js').RegionFilter} RegionFilter */
/** @typedef {import('../types.js').IndicatorKey} IndicatorKey */

/**
 * @param {string} value
 * @param {string} label
 */
function optionTemplate(value, label) {
  return `<option value="${value}">${label}</option>`;
}

// Preenche os seletores de região e de indicador a partir do config.js.
// Quando a pessoa troca uma opção, chama onChange só com o que mudou (ex.: { region: 'NE' }).
/**
 * @param {{
 *   regionSelect: HTMLSelectElement,
 *   indicatorSelect: HTMLSelectElement,
 *   onChange: (changes: Partial<Filters>) => void,
 * }} options
 */
export function createFilters({ regionSelect, indicatorSelect, onChange }) {
  regionSelect.innerHTML = [
    optionTemplate(ALL_REGIONS, 'Todas as regiões'),
    ...REGIONS.map((region) => optionTemplate(region.acronym, region.name)),
  ].join('');

  indicatorSelect.innerHTML = Object.entries(INDICATORS)
    .map(([key, { label }]) => optionTemplate(key, label))
    .join('');

  // Os seletores só têm as opções montadas acima, a partir do config.js: o valor é sempre válido
  regionSelect.addEventListener('change', () =>
    onChange({ region: /** @type {RegionFilter} */ (regionSelect.value) }),
  );
  indicatorSelect.addEventListener('change', () =>
    onChange({ indicator: /** @type {IndicatorKey} */ (indicatorSelect.value) }),
  );

  // Deixa os seletores iguais ao estado (útil no carregamento inicial)
  /** @param {Pick<Filters, 'region' | 'indicator'>} filters */
  function update({ region, indicator }) {
    regionSelect.value = region;
    indicatorSelect.value = indicator;
  }

  return { update };
}
