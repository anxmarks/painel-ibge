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
