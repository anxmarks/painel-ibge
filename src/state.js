// Estado central do painel: guarda os dados e os filtros escolhidos.
// Quem quiser saber das mudanças se inscreve com subscribe; setState avisa todos os inscritos.
export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  function getState() {
    return state;
  }

  // Junta as mudanças ao estado atual. Se nada mudou de fato, ninguém é avisado.
  function setState(changes) {
    const hasChanges = Object.entries(changes).some(([key, value]) => state[key] !== value);
    if (!hasChanges) return;

    state = { ...state, ...changes };
    listeners.forEach((listener) => listener(state));
  }

  // Devolve uma função que cancela a inscrição
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}
