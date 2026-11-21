import { THEME_STORAGE_KEY } from '../config.js';

const THEMES = ['light', 'dark'];
const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// O localStorage pode estar bloqueado (navegação privada, cookies desativados): aí só não salva
function readSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // sem localStorage o tema vale só até recarregar a página
  }
}

// A escolha salva vence; sem escolha, vale a preferência do sistema
function systemTheme() {
  return darkSchemeQuery.matches ? 'dark' : 'light';
}

export function getActiveTheme() {
  return document.documentElement.dataset.theme;
}

// Botão de alternar tema. O tema inicial já foi aplicado pelo script do <head>;
// aqui ficam o clique, o aviso a quem precisa redesenhar (onChange) e a troca do sistema.
export function createThemeToggle({ button, onChange }) {
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    onChange(theme);
  }

  button.addEventListener('click', () => {
    const nextTheme = getActiveTheme() === 'dark' ? 'light' : 'dark';
    saveTheme(nextTheme);
    applyTheme(nextTheme);
  });

  // Se a pessoa nunca escolheu, o painel acompanha quando o sistema muda de tema
  darkSchemeQuery.addEventListener('change', () => {
    if (!readSavedTheme()) applyTheme(systemTheme());
  });

  button.setAttribute('aria-pressed', String(getActiveTheme() === 'dark'));
}
