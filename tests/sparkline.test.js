import { describe, it, expect } from 'vitest';
import { seriesAmplitude, seriesChange, sparklinePath } from '../src/utils/sparkline.js';

describe('seriesChange', () => {
  it('último menos primeiro', () => {
    expect(seriesChange([0.1, 0.5, 0.3])).toBeCloseTo(0.2);
  });

  it('null quando falta o primeiro ou o último ano', () => {
    expect(seriesChange([null, 0.5, 0.3])).toBeNull();
    expect(seriesChange([0.1, 0.5, null])).toBeNull();
  });
});

describe('seriesAmplitude', () => {
  it('maior menos menor, ignorando anos sem dado', () => {
    expect(seriesAmplitude([3, null, 1, 4])).toBe(3);
  });

  it('0 quando não há valores', () => {
    expect(seriesAmplitude([null])).toBe(0);
  });
});

describe('sparklinePath', () => {
  const box = { width: 100, height: 10, range: 2 };

  it('parte do mínimo da própria série e usa o range comum para a altura', () => {
    // Série de 5 a 6: sobe 1 num range de 2, então chega só à metade da altura
    expect(sparklinePath([5, 6], box)).toBe('M0 10L100 5');
  });

  it('mesma variação, mesma inclinação, mesmo em níveis diferentes', () => {
    expect(sparklinePath([30, 31], box)).toBe(sparklinePath([0.5, 1.5], box));
  });

  it('respeita a margem de cima e de baixo', () => {
    expect(sparklinePath([0, 2], { ...box, padding: 1 })).toBe('M0 9L100 1');
  });

  it('ano sem dado quebra a linha (a caneta levanta)', () => {
    expect(sparklinePath([0, null, 2, 2], { width: 30, height: 10, range: 2 })).toBe(
      'M0 10M20 0L30 0',
    );
  });

  it('série sem valores não desenha nada', () => {
    expect(sparklinePath([null, null], box)).toBe('');
  });
});
