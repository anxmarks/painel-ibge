import { test, expect } from '@playwright/test';
import { mockIbgeApi } from './support/ibgeApi.js';

test.beforeEach(async ({ page }) => {
  await mockIbgeApi(page);
});

test('o tema escolhido continua depois de recarregar a página', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');

  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: 'Tema escuro' });
  await expect(html).toHaveAttribute('data-theme', 'light');

  await toggle.click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('sem escolha salva, o painel segue o tema do sistema', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('o primeiro Tab leva ao link "Pular para o conteúdo"', async ({ page, isMobile }) => {
  test.skip(isMobile, 'navegação por teclado é testada só no desktop');
  await page.goto('./');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skipLink).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});
