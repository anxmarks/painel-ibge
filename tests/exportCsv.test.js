import { describe, it, expect } from 'vitest';
import {
  formatCsvNumber,
  escapeCsvField,
  toCsv,
  buildStatesCsv,
  buildCsvFilename,
  buildHistoryCsv,
  buildHistoryCsvFilename,
} from '../src/utils/exportCsv.js';
import { ALL_REGIONS } from '../src/config.js';

describe('formatCsvNumber', () => {
  it('usa vírgula decimal e não usa separador de milhar', () => {
    expect(formatCsvNumber(49634.567, 2)).toBe('49634,57');
  });

  it('arredonda para inteiro quando decimals é 0', () => {
    expect(formatCsvNumber(1234567.8, 0)).toBe('1234568');
  });

  it('deixa a célula vazia quando falta o dado', () => {
    expect(formatCsvNumber(null, 2)).toBe('');
  });
});

describe('escapeCsvField', () => {
  it('mantém texto simples como está', () => {
    expect(escapeCsvField('São Paulo')).toBe('São Paulo');
  });

  it('põe entre aspas quando há separador', () => {
    expect(escapeCsvField('a;b')).toBe('"a;b"');
  });

  it('dobra as aspas internas', () => {
    expect(escapeCsvField('diz "oi"')).toBe('"diz ""oi"""');
  });

  it('põe entre aspas quando há quebra de linha', () => {
    expect(escapeCsvField('linha 1\nlinha 2')).toBe('"linha 1\nlinha 2"');
  });
});

describe('toCsv', () => {
  it('monta cabeçalho e linhas com ; e quebra de linha CRLF', () => {
    const columns = [
      { header: 'Nome', value: (row) => row.name },
      { header: 'Valor', value: (row) => row.value },
    ];
    const csv = toCsv(
      [
        { name: 'A', value: 1 },
        { name: 'B', value: 2 },
      ],
      columns,
    );

    expect(csv).toBe('Nome;Valor\r\nA;1\r\nB;2');
  });

  it('gera só o cabeçalho quando não há linhas', () => {
    expect(toCsv([], [{ header: 'Nome', value: () => '' }])).toBe('Nome');
  });
});

describe('buildStatesCsv', () => {
  it('exporta os estados com valores crus', () => {
    const csv = buildStatesCsv([
      {
        acronym: 'DF',
        name: 'Distrito Federal',
        regionName: 'Centro-Oeste',
        population: 2817381,
        gdp: 328750000000,
        gdpPerCapita: 116688.123,
        area: 5760.784,
        density: 489.0627,
      },
    ]);

    expect(csv).toBe(
      'Sigla;Estado;Região;População;PIB (R$);PIB per capita (R$);Área (km²);Densidade (hab/km²)\r\n' +
        'DF;Distrito Federal;Centro-Oeste;2817381;328750000000;116688,12;5760,784;489,06',
    );
  });
});

describe('buildCsvFilename', () => {
  it('usa o nome da região sem acentos e com hífen', () => {
    expect(buildCsvFilename('CO')).toBe('brasil-em-dados-2022-centro-oeste.csv');
  });

  it('usa "brasil" quando não há filtro de região', () => {
    expect(buildCsvFilename(ALL_REGIONS)).toBe('brasil-em-dados-2022-brasil.csv');
  });
});

describe('buildHistoryCsv', () => {
  const history = {
    years: [2002, 2003],
    regions: [
      { acronym: 'N', name: 'Norte', shares: [0.04712, null] },
      { acronym: 'SE', name: 'Sudeste', shares: [0.5744, 0.565] },
    ],
  };

  it('uma linha por ano, uma coluna por região, em % com 2 casas', () => {
    expect(buildHistoryCsv(history).split('\r\n')).toEqual([
      'Ano;Norte (% do PIB);Sudeste (% do PIB)',
      '2002;4,71;57,44',
      '2003;;56,50',
    ]);
  });
});

describe('buildHistoryCsvFilename', () => {
  it('leva o primeiro e o último ano no nome', () => {
    expect(buildHistoryCsvFilename([2002, 2010, 2023])).toBe(
      'brasil-em-dados-pib-regioes-2002-2023.csv',
    );
  });
});
