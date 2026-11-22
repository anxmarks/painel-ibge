import { defineConfig, devices } from '@playwright/test';

// Os testes de ponta a ponta rodam contra o build de produção (o mesmo que vai para o GitHub Pages).
// Porta própria (não a 4173 do "npm run preview"), para nunca testar um build antigo que ficou aberto.
const PORT = 4174;
const BASE_URL = `http://localhost:${PORT}/painel-ibge/`;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI), // no CI, um test.only esquecido faz o job falhar
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry', // grava um passo a passo do teste quando ele falha no CI
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  // Gera o build e sobe o "vite preview" antes dos testes
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false, // sempre gera um build novo antes de testar
    timeout: 120_000,
  },
});
