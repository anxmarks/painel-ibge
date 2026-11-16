import { describe, it, expect, vi } from 'vitest';
import { createStore } from '../src/state.js';

describe('createStore', () => {
  it('começa com o estado inicial', () => {
    const store = createStore({ region: 'all', indicator: 'gdp' });
    expect(store.getState()).toEqual({ region: 'all', indicator: 'gdp' });
  });

  it('junta as mudanças sem apagar as outras chaves', () => {
    const store = createStore({ region: 'all', indicator: 'gdp' });
    store.setState({ region: 'NE' });
    expect(store.getState()).toEqual({ region: 'NE', indicator: 'gdp' });
  });

  it('avisa os inscritos com o estado novo', () => {
    const store = createStore({ region: 'all' });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState({ region: 'S' });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith({ region: 'S' });
  });

  it('não avisa ninguém quando o valor não mudou', () => {
    const store = createStore({ region: 'S' });
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState({ region: 'S' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('para de avisar depois de cancelar a inscrição', () => {
    const store = createStore({ region: 'all' });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.setState({ region: 'N' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('não altera o objeto inicial', () => {
    const initial = { region: 'all' };
    const store = createStore(initial);
    store.setState({ region: 'CO' });
    expect(initial.region).toBe('all');
  });
});
