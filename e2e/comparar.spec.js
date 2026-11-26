import { test, expect } from '@playwright/test';
import { mockIbgeApi } from './support/ibgeApi.js';

const compareTable = (page) => page.locator('#compare-table');
const columnHeaders = (page) => compareTable(page).locator('thead th');
const row = (page, label) => compareTable(page).locator('tbody tr').filter({ hasText: label });

test.beforeEach(async ({ page }) => {
  await mockIbgeApi(page);
});

test('escolher estados monta a comparação e guarda na URL', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#compare-hint')).toContainText('Escolha um ou mais estados');
  await expect(page.locator('#compare-result')).toBeHidden();

  await page.getByLabel('Estado 1', { exact: true }).selectOption('SP');
  await expect(page.locator('#compare-hint')).toContainText('Escolha outro estado');
  await page.getByLabel('Estado 2', { exact: true }).selectOption('BA');

  await expect(page).toHaveURL(/\?comparar=SP-BA$/);
  await expect(columnHeaders(page)).toHaveText(['Indicador', 'São Paulo', 'Bahia', 'Brasil']);
  await expect(row(page, 'População')).toContainText('44.411.238');
  await expect(row(page, 'PIB per capita')).toContainText('R$ 49.634'); // Brasil, como referência
  // O maior de cada linha é marcado também em texto, para leitores de tela
  await expect(row(page, 'População').locator('.is-max')).toContainText('(maior)');
  await expect(row(page, 'População').locator('.is-max')).toContainText('44.411.238');
});

test('um link com siglas inválidas e repetidas é corrigido', async ({ page }) => {
  await page.goto('./?comparar=sp-xx-ba-sp-rr-mg');

  // Sai a sigla que não existe e a repetida; ficam no máximo 3, na ordem do link
  await expect(page).toHaveURL(/\?comparar=SP-BA-RR$/);
  await expect(columnHeaders(page)).toHaveText([
    'Indicador',
    'São Paulo',
    'Bahia',
    'Roraima',
    'Brasil',
  ]);
  await expect(page.getByLabel('Estado 3', { exact: true })).toHaveValue('RR');
});

test('"voltar" desfaz a escolha e "Limpar" tira a comparação', async ({ page }) => {
  await page.goto('./?comparar=SP-BA');
  await expect(columnHeaders(page)).toHaveCount(4);

  await page.getByLabel('Estado 3', { exact: true }).selectOption('RJ');
  await expect(page).toHaveURL(/\?comparar=SP-BA-RJ$/);

  await page.goBack();
  await expect(page).toHaveURL(/\?comparar=SP-BA$/);
  await expect(page.getByLabel('Estado 3', { exact: true })).toHaveValue('');

  await page.getByRole('button', { name: 'Limpar' }).click();
  await expect(page).toHaveURL(/\/painel-ibge\/$/);
  await expect(page.locator('#compare-result')).toBeHidden();
});

test('a comparação não muda com o filtro de região', async ({ page }) => {
  await page.goto('./?comparar=SP-BA');
  await page.getByLabel('Região', { exact: true }).selectOption('S');

  await expect(page).toHaveURL(/\?regiao=S&comparar=SP-BA$/);
  await expect(columnHeaders(page)).toHaveText(['Indicador', 'São Paulo', 'Bahia', 'Brasil']);
});
