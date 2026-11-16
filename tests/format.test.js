import { describe, it, expect } from 'vitest';
import {
  formatInteger,
  formatCompact,
  formatCurrency,
  formatCompactCurrency,
  formatPercent,
  formatIndicator,
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

describe('valores ausentes', () => {
  it.each([null, undefined, NaN, Infinity])('mostra o marcador de ausente para %s', (value) => {
    expect(formatInteger(value)).toBe(MISSING_VALUE_LABEL);
    expect(formatCompact(value)).toBe(MISSING_VALUE_LABEL);
    expect(formatCurrency(value)).toBe(MISSING_VALUE_LABEL);
    expect(formatCompactCurrency(value)).toBe(MISSING_VALUE_LABEL);
  });
});
