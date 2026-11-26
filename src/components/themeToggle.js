import { THEME_STORAGE_KEY } from '../config.js';

/** @typedef {import('../types.js').Theme} Theme */

const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

// O localStorage pode estar bloqueado (navegação privada, cookies desativados): aí só não salva
/** @returns {Theme | null} */
function readSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

/** @param {Theme} theme */
function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // sem localStorage o tema vale só até recarregar a página
  }
}

// A escolha salva vence; sem escolha, vale a preferência do sistema
/** @returns {Theme} */
function systemTheme() {
  return darkSchemeQuery.matches ? 'dark' : 'light';
}

// O script do <head> sempre define o tema antes de tudo; "light" é só a garantia
/** @returns {Theme} */
export function getActiveTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

// Botão de alternar tema. O tema inicial já foi aplicado pelo script do <head>;
// aqui ficam o clique, o aviso a quem precisa redesenhar (onChange) e a troca do sistema.
/** @param {{ button: HTMLButtonElement, onChange: (theme: Theme) => void }} options */
export function createThemeToggle({ button, onChange }) {
  /** @param {Theme} theme */
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
