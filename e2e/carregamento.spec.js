import { test, expect } from '@playwright/test';
import { failIbgeApi, mockIbgeApi } from './support/ibgeApi.js';

test('mostra o resumo do Brasil, os gráficos e os 27 estados', async ({ page }) => {
  await mockIbgeApi(page);
  await page.goto('./');

  await expect(page.locator('main')).toHaveAttribute('data-status', 'ready');
  await expect(page.locator('#kpi-cards')).toContainText('203,1 mi');
  await expect(page.locator('#kpi-cards')).toContainText('R$ 10,08 tri');
  await expect(
    page.getByRole('heading', { name: 'Ranking dos estados por PIB per capita' }),
  ).toBeVisible();
  await expect(page.locator('#region-legend li')).toHaveCount(5);
  await expect(page.locator('#states-table tbody tr')).toHaveCount(27);
});

test('mostra o erro quando a API falha e recupera com "Tentar novamente"', async ({ page }) => {
  await failIbgeApi(page);
  await page.goto('./');

  const alert = page.getByRole('alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('Não foi possível conectar à API do IBGE.');
  await expect(page.getByLabel('Região')).toBeDisabled(); // sem dados, os filtros ficam bloqueados

  await mockIbgeApi(page); // a API "volta"
  await page.getByRole('button', { name: 'Tentar novamente' }).click();

  await expect(alert).toBeHidden();
  await expect(page.getByLabel('Região')).toBeEnabled();
  await expect(page.locator('#states-table tbody tr')).toHaveCount(27);
});
