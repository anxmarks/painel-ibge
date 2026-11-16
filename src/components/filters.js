import { ALL_REGIONS, INDICATORS, REGIONS } from '../config.js';

function optionTemplate(value, label) {
  return `<option value="${value}">${label}</option>`;
}

// Preenche os seletores de região e de indicador a partir do config.js.
// Quando a pessoa troca uma opção, chama onChange só com o que mudou (ex.: { region: 'NE' }).
export function createFilters({ regionSelect, indicatorSelect, onChange }) {
  regionSelect.innerHTML = [
    optionTemplate(ALL_REGIONS, 'Todas as regiões'),
    ...REGIONS.map((region) => optionTemplate(region.acronym, region.name)),
  ].join('');

  indicatorSelect.innerHTML = Object.entries(INDICATORS)
    .map(([key, { label }]) => optionTemplate(key, label))
    .join('');

  regionSelect.addEventListener('change', () => onChange({ region: regionSelect.value }));
  indicatorSelect.addEventListener('change', () => onChange({ indicator: indicatorSelect.value }));

  // Deixa os seletores iguais ao estado (útil no carregamento inicial)
  function update({ region, indicator }) {
    regionSelect.value = region;
    indicatorSelect.value = indicator;
  }

  return { update };
}
