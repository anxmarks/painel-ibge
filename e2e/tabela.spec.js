import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { mockIbgeApi } from './support/ibgeApi.js';

const rows = (page) => page.locator('#states-table tbody tr');

test.beforeEach(async ({ page }) => {
  await mockIbgeApi(page);
  await page.goto('./');
  await expect(rows(page)).toHaveCount(27);
});

test('a busca ignora acentos e aceita a sigla', async ({ page }) => {
  const search = page.getByLabel('Buscar estado');

  await search.fill('sao');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('São Paulo');
  await expect(page.locator('#table-count')).toHaveText('1 de 27 estados');

  await search.fill('rs');
  await expect(rows(page).first()).toContainText('Rio Grande do Sul');
});

test('ordena pela coluna clicada e inverte no segundo clique', async ({ page }) => {
  const populationHeader = page.getByRole('columnheader', { name: 'População' });

  await populationHeader.getByRole('button').click();
  await expect(populationHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(rows(page).first()).toContainText('São Paulo');

  await populationHeader.getByRole('button').click();
  await expect(populationHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(rows(page).first()).toContainText('Roraima');
});

test('exporta em CSV exatamente o que a tabela mostra', async ({ page }) => {
  await page.getByLabel('Região', { exact: true }).selectOption('S');
  await expect(rows(page)).toHaveCount(3);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('brasil-em-dados-2022-sul.csv');

  const content = await readFile(await download.path(), 'utf8');
  const lines = content.trim().split('\r\n');
  expect(content.startsWith('﻿')).toBe(true); // BOM: o Excel reconhece os acentos
  expect(lines).toHaveLength(4); // cabeçalho + 3 estados do Sul
  expect(lines[0]).toContain('Sigla;Estado;Região');
  expect(lines[0]).toContain('Densidade (hab/km²)');
  expect(content).toContain('Santa Catarina');
});
