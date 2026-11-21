import { defineConfig } from 'vite';

// O GitHub Pages publica o site em https://<usuario>.github.io/<repositorio>/,
// então todos os caminhos gerados no build precisam começar com o nome do repositório.
const REPOSITORY_BASE = '/painel-ibge/';

export default defineConfig({
  base: REPOSITORY_BASE,
});
