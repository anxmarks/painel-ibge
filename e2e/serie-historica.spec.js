import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { mockIbgeApi } from './support/ibgeApi.js';

const legendItem = (page, name) =>
  page.locator('#history-legend .legend-item').filter({ hasText: name });
const swatchColor = (page, name) =>
  legendItem(page, name)
    .locator('.legend-swatch')
    .evaluate((swatch) => swatch.style.background);

test.beforeEach(async ({ page }) => {
  await mockIbgeApi(page);
});

test('mostra a participação das regiões de 2002 a 2023', async ({ page }) => {
  await page.goto('./');

  await expect(
    page.getByRole('heading', { name: 'Evolução da participação das regiões no PIB, 2002–2023' }),
  ).toBeVisible();
  // Legenda na ordem do último ano, do maior para o menor
  await expect(page.locator('#history-legend .legend-name')).toHaveText([
    'Sudeste',
    'Sul',
    'Nordeste',
    'Centro-Oeste',
    'Norte',
  ]);
  await expect(legendItem(page, 'Sudeste')).toContainText('57,4% → 53,0%');
  await expect(legendItem(page, 'Sudeste')).toContainText('-4,4 p.p.');
  await expect(legendItem(page, 'Centro-Oeste')).toContainText('+2,0 p.p.');
  await expect(page.locator('#history-chart')).toHaveAttribute(
    'aria-label',
    /de 2002 a 2023\. Sudeste: de 57,4% para 53,0%/,
  );
});

test('o filtro de região destaca a região e acinzenta as outras', async ({ page }) => {
  await page.goto('./');
  await expect(legendItem(page, 'Nordeste')).toBeVisible();
  const northeastColor = await swatchColor(page, 'Nordeste');

  await page.getByLabel('Região', { exact: true }).selectOption('NE');

  await expect(page.locator('#history-chart')).toHaveAttribute(
    'aria-label',
    /Em destaque: Nordeste\.$/,
  );
  // O Nordeste mantém a própria cor (a mesma da rosca); as outras regiões ficam todas no mesmo cinza
  expect(await swatchColor(page, 'Nordeste')).toBe(northeastColor);
  const mutedColor = await swatchColor(page, 'Sudeste');
  expect(mutedColor).not.toBe(northeastColor);
  for (const name of ['Sul', 'Centro-Oeste', 'Norte']) {
    expect(await swatchColor(page, name)).toBe(mutedColor);
  }

  await page.getByLabel('Região', { exact: true }).selectOption('all');
  await expect(page.locator('#history-chart')).not.toHaveAttribute('aria-label', /Em destaque/);
});

test('a tabela da série mostra todos os anos e exporta em CSV', async ({ page }) => {
  await page.goto('./?regiao=CO');
  const table = page.locator('#history-table');
  await expect(table).toBeHidden(); // fechada até a pessoa pedir

  await page.getByText('Ver os dados em tabela').click();
  await expect(table.locator('tbody tr')).toHaveCount(22);
  await expect(table.locator('thead th')).toHaveText([
    'Ano',
    'Norte',
    'Nordeste',
    'Centro-Oeste',
    'Sudeste',
    'Sul',
  ]);
  const firstRow = table.locator('tbody tr').first();
  await expect(firstRow.locator('th')).toHaveText('2002');
  await expect(firstRow.locator('td').nth(3)).toHaveText('57,4%'); // Sudeste em 2002
  // A coluna da região filtrada fica em destaque (cabeçalho e as 22 células)
  await expect(table.locator('.is-highlighted')).toHaveCount(23);
  await expect(table.locator('thead .is-highlighted')).toHaveText('Centro-Oeste');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV da série' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('brasil-em-dados-pib-regioes-2002-2023.csv');

  const content = await readFile(await download.path(), 'utf8');
  expect(content.startsWith('﻿')).toBe(true); // BOM: o Excel reconhece os acentos
  // o trim() também tira o BOM, por isso o cabeçalho é comparado sem ele
  const lines = content.trim().split('\r\n');
  expect(lines).toHaveLength(23); // cabeçalho + 22 anos
  expect(lines[0]).toBe(
    'Ano;Norte (% do PIB);Nordeste (% do PIB);Centro-Oeste (% do PIB);Sudeste (% do PIB);Sul (% do PIB)',
  );
  expect(lines[1]).toMatch(/^2002;4,\d\d;13,\d\d;8,\d\d;57,\d\d;16,\d\d$/);
});
