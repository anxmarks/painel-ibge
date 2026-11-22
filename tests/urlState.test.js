import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FILTERS,
  buildSearchFromFilters,
  parseFiltersFromSearch,
} from '../src/utils/urlState.js';

describe('parseFiltersFromSearch', () => {
  it('usa os filtros padrão quando a URL não tem parâmetros', () => {
    expect(parseFiltersFromSearch('')).toEqual(DEFAULT_FILTERS);
  });

  it('lê região e indicador da URL', () => {
    expect(parseFiltersFromSearch('?regiao=NE&indicador=gdp')).toEqual({
      region: 'NE',
      indicator: 'gdp',
    });
  });

  it('aceita a sigla da região em minúsculas', () => {
    expect(parseFiltersFromSearch('?regiao=co').region).toBe('CO');
  });

  it('troca região desconhecida pelo Brasil inteiro', () => {
    expect(parseFiltersFromSearch('?regiao=XX').region).toBe(DEFAULT_FILTERS.region);
  });

  it('troca indicador desconhecido pelo padrão', () => {
    expect(parseFiltersFromSearch('?indicador=idh').indicator).toBe(DEFAULT_FILTERS.indicator);
  });

  it('não aceita propriedades herdadas como indicador', () => {
    expect(parseFiltersFromSearch('?indicador=toString').indicator).toBe(DEFAULT_FILTERS.indicator);
  });

  it('ignora parâmetros que o painel não conhece', () => {
    expect(parseFiltersFromSearch('?utm_source=linkedin&regiao=S')).toEqual({
      region: 'S',
      indicator: DEFAULT_FILTERS.indicator,
    });
  });
});

describe('buildSearchFromFilters', () => {
  it('devolve string vazia para os filtros padrão', () => {
    expect(buildSearchFromFilters(DEFAULT_FILTERS)).toBe('');
  });

  it('inclui só os filtros diferentes do padrão', () => {
    expect(buildSearchFromFilters({ ...DEFAULT_FILTERS, region: 'NE' })).toBe('?regiao=NE');
  });

  it('inclui região e indicador quando os dois mudam', () => {
    expect(buildSearchFromFilters({ region: 'SE', indicator: 'population' })).toBe(
      '?regiao=SE&indicador=population',
    );
  });

  it('ida e volta: ler a URL montada devolve os mesmos filtros', () => {
    const filters = { region: 'N', indicator: 'gdp' };
    expect(parseFiltersFromSearch(buildSearchFromFilters(filters))).toEqual(filters);
  });
});
