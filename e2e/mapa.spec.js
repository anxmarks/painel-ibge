import { test, expect } from '@playwright/test';
import { mockIbgeApi } from './support/ibgeApi.js';

const statePath = (page, id) => page.locator(`#state-map [data-state-id="${id}"]`);

test.beforeEach(async ({ page }) => {
  await mockIbgeApi(page);
});

test('desenha os 27 estados com a legenda de faixas', async ({ page }) => {
  await page.goto('./?indicador=density');

  await expect(page.locator('#state-map path')).toHaveCount(27);
  await expect(page.getByRole('heading', { name: 'Mapa: Densidade demográfica' })).toBeVisible();
  await expect(page.locator('#map-legend-title')).toHaveText('Faixas (hab/km²)');
  await expect(page.locator('#map-legend li')).toHaveCount(5);
  await expect(page.locator('#state-map')).toHaveAttribute(
    'aria-label',
    /Maiores: Distrito Federal/,
  );
});

test('para um total, o mapa mostra a taxa e explica o motivo', async ({ page }) => {
  await page.goto('./?indicador=population');

  await expect(page.getByRole('heading', { name: 'Mapa: Densidade demográfica' })).toBeVisible();
  await expect(page.locator('#map-note')).toContainText('Mapas comparam taxas, e não totais');

  await page.getByLabel('Indicador', { exact: true }).selectOption('gdp');
  await expect(page.getByRole('heading', { name: 'Mapa: PIB per capita' })).toBeVisible();
  await expect(page.locator('#map-note')).toContainText('o mapa mostra o PIB per capita');
});

test('o filtro de região acinzenta os outros estados sem mudar as cores', async ({ page }) => {
  await page.goto('./?indicador=density');
  const bahia = statePath(page, 29);
  await expect(page.locator('#state-map path')).toHaveCount(27);
  const colorBefore = await bahia.evaluate((path) => path.style.fill);

  await page.getByLabel('Região', { exact: true }).selectOption('NE');

  await expect(page.locator('#state-map path.is-muted')).toHaveCount(18); // 27 - 9 do Nordeste
  await expect(page.locator('#map-legend')).toContainText('Fora da região escolhida');
  // As faixas são calculadas com os 27 estados: a Bahia continua com a mesma cor
  expect(await bahia.evaluate((path) => path.style.fill)).toBe(colorBefore);
});

test('passar o mouse (ou tocar) num estado mostra o nome e o valor, e sair esconde', async ({
  page,
  isMobile,
}) => {
  await page.goto('./?indicador=density');
  const saoPaulo = statePath(page, 35);
  const tooltip = page.locator('#map-tooltip');

  if (isMobile) await saoPaulo.tap();
  else await saoPaulo.hover();

  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('São Paulo');
  await expect(tooltip).toContainText('hab/km²');

  // Some quando o mouse sai do mapa ou, no celular, com um toque fora dele
  if (isMobile) await page.locator('#map-title').tap();
  else await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();
});
