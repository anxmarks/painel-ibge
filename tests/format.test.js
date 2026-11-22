import { describe, it, expect } from 'vitest';
import {
  formatInteger,
  formatCompact,
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  formatIndicator,
  formatDensity,
  formatArea,
} from '../src/utils/format.js';
import { MISSING_VALUE_LABEL } from '../src/config.js';

// O Intl usa espaço não separável entre "R$" e o número; normalizar facilita comparar
const normalizeSpaces = (text) => text.replace(/\s/g, ' ');

describe('formatInteger', () => {
  it('usa ponto como separador de milhar', () => {
    expect(formatInteger(203080756)).toBe('203.080.756');
  });
});

describe('formatCompact', () => {
  it('abrevia números grandes', () => {
    expect(normalizeSpaces(formatCompact(203080756))).toBe('203,1 mi');
  });
});

describe('formatCurrency', () => {
  it('formata em reais sem centavos', () => {
    expect(normalizeSpaces(formatCurrency(49633.83))).toBe('R$ 49.634');
  });
});

describe('formatCompactCurrency', () => {
  it('abrevia valores em reais', () => {
    expect(normalizeSpaces(formatCompactCurrency(10079676378000))).toBe('R$ 10,08 tri');
  });
});

describe('formatPercent', () => {
  it('converte fração em porcentagem com uma casa', () => {
    expect(normalizeSpaces(formatPercent(0.532))).toBe('53,2%');
  });
});

describe('formatIndicator', () => {
  it('usa o formato completo por padrão', () => {
    expect(formatIndicator('population', 1581196)).toBe('1.581.196');
    expect(normalizeSpaces(formatIndicator('gdpPerCapita', 42243.6))).toBe('R$ 42.244');
  });

  it('usa o formato curto quando pedido', () => {
    expect(normalizeSpaces(formatIndicator('population', 1581196, { short: true }))).toBe('1,6 mi');
  });
});

describe('formatInteger', () => {
  it('arredonda para inteiro', () => {
    expect(formatInteger(489.06)).toBe('489');
  });
});

describe('formatDensity', () => {
  it('mostra uma casa decimal e a unidade', () => {
    expect(formatDensity(23.857)).toBe('23,9 hab/km²');
  });

  it('usa separador de milhar em valores grandes', () => {
    expect(formatDensity(1234.5)).toBe('1.234,5 hab/km²');
  });
});

describe('formatArea', () => {
  it('usa a forma compacta e a unidade', () => {
    expect(normalizeSpaces(formatArea(8510345.5))).toBe('8,5 mi km²');
  });
});

describe('formatIndicator para densidade', () => {
  it('mostra a unidade no formato completo e só o número no curto (eixo)', () => {
    expect(formatIndicator('density', 489.06)).toBe('489,1 hab/km²');
    expect(formatIndicator('density', 489.06, { short: true })).toBe('489');
  });
});

describe('valores ausentes', () => {
  it.each([null, undefined, NaN, Infinity])('mostra o marcador de ausente para %s', (value) => {
    expect(formatInteger(value)).toBe(MISSING_VALUE_LABEL);
    expect(formatCompact(value)).toBe(MISSING_VALUE_LABEL);
    expect(formatCurrency(value)).toBe(MISSING_VALUE_LABEL);
    expect(formatCompactCurrency(value)).toBe(MISSING_VALUE_LABEL);
    expect(formatDensity(value)).toBe(MISSING_VALUE_LABEL); // sem "hab/km²" sobrando
    expect(formatArea(value)).toBe(MISSING_VALUE_LABEL);
  });
});
