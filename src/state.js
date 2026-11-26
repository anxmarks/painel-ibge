// Estado central do painel: guarda os dados e os filtros escolhidos.
// Quem quiser saber das mudanças se inscreve com subscribe; setState avisa todos os inscritos.
/**
 * @template {object} T
 * @param {T} initialState
 */
export function createStore(initialState) {
  let state = { ...initialState };
  /** @type {Set<(state: T) => void>} */
  const listeners = new Set();

  function getState() {
    return state;
  }

  // Junta as mudanças ao estado atual. Se nada mudou de fato, ninguém é avisado.
  /** @param {Partial<T>} changes */
  function setState(changes) {
    const hasChanges = Object.entries(changes).some(
      ([key, value]) => state[/** @type {keyof T} */ (key)] !== value,
    );
    if (!hasChanges) return;

    state = { ...state, ...changes };
    listeners.forEach((listener) => listener(state));
  }

  // Devolve uma função que cancela a inscrição
  /** @param {(state: T) => void} listener */
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}
