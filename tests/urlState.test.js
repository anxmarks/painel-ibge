import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FILTERS,
  buildSearchFromFilters,
  parseCompare,
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
      compare: [],
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
      compare: [],
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
    expect(buildSearchFromFilters({ region: 'SE', indicator: 'population', compare: [] })).toBe(
      '?regiao=SE&indicador=population',
    );
  });

  it('ida e volta: ler a URL montada devolve os mesmos filtros', () => {
    /** @type {import('../src/types.js').Filters} */
    const filters = { region: 'N', indicator: 'gdp', compare: ['AM', 'PA'] };
    expect(parseFiltersFromSearch(buildSearchFromFilters(filters))).toEqual(filters);
  });
});

describe('parseCompare', () => {
  it('lê as siglas separadas por hífen, na ordem do link', () => {
    expect(parseCompare('SP-BA')).toEqual(['SP', 'BA']);
  });

  it('aceita minúsculas, vírgula e espaço', () => {
    expect(parseCompare('sp,ba rj')).toEqual(['SP', 'BA', 'RJ']);
  });

  it('descarta siglas desconhecidas e repetidas', () => {
    expect(parseCompare('SP-XX-SP-BA')).toEqual(['SP', 'BA']);
  });

  it('guarda no máximo 3 estados', () => {
    expect(parseCompare('SP-BA-RJ-MG')).toEqual(['SP', 'BA', 'RJ']);
  });

  it('sem parâmetro, não compara nada', () => {
    expect(parseCompare(null)).toEqual([]);
  });
});

describe('buildSearchFromFilters com comparação', () => {
  it('junta as siglas com hífen (a vírgula viraria %2C no link)', () => {
    expect(buildSearchFromFilters({ ...DEFAULT_FILTERS, compare: ['SP', 'BA'] })).toBe(
      '?comparar=SP-BA',
    );
  });
});
