import { test, expect } from '@playwright/test';
import { mockIbgeApi } from './support/ibgeApi.js';

test.beforeEach(async ({ page }) => {
  await mockIbgeApi(page);
});

test('filtrar por região atualiza o painel e a URL; "voltar" desfaz', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#states-table tbody tr')).toHaveCount(27);

  await page.getByLabel('Região').selectOption('NE');

  await expect(page).toHaveURL(/\?regiao=NE$/);
  await expect(page.locator('#kpi-title')).toHaveText('Resumo: Nordeste');
  await expect(page.locator('#states-table tbody tr')).toHaveCount(9);

  await page.getByLabel('Indicador').selectOption('population');

  await expect(page).toHaveURL(/\?regiao=NE&indicador=population$/);
  await expect(
    page.getByRole('heading', { name: 'Ranking dos estados por População' }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\?regiao=NE$/);
  await expect(page.getByLabel('Indicador')).toHaveValue('gdpPerCapita');

  await page.goBack();
  await expect(page).toHaveURL(/\/painel-ibge\/$/);
  await expect(page.getByLabel('Região')).toHaveValue('all');
  await expect(page.locator('#states-table tbody tr')).toHaveCount(27);
});

test('um link com filtros já abre filtrado', async ({ page }) => {
  await page.goto('./?regiao=co&indicador=gdp');

  await expect(page).toHaveURL(/\?regiao=CO&indicador=gdp$/); // a sigla é normalizada
  await expect(page.getByLabel('Região')).toHaveValue('CO');
  await expect(page.getByLabel('Indicador')).toHaveValue('gdp');
  await expect(page.locator('#states-table tbody tr')).toHaveCount(4);
});

test('um link com valores inválidos abre o Brasil inteiro e limpa a URL', async ({ page }) => {
  await page.goto('./?regiao=XX&indicador=idh');

  await expect(page).toHaveURL(/\/painel-ibge\/$/);
  await expect(page.getByLabel('Região')).toHaveValue('all');
  await expect(page.locator('#states-table tbody tr')).toHaveCount(27);
});
