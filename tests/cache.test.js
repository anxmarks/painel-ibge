import { describe, it, expect, vi } from 'vitest';
import { readCache, writeCache, withCache } from '../src/services/cache.js';
import { CACHE_KEY_PREFIX, CACHE_TTL_MS } from '../src/config.js';

// Storage em memória com a mesma interface do localStorage
function createMemoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
  };
}

const NOW = 1_700_000_000_000;

describe('readCache e writeCache', () => {
  it('lê o que foi gravado dentro do prazo', () => {
    const storage = createMemoryStorage();
    writeCache('states', [{ id: 11 }], { storage, now: NOW });

    expect(readCache('states', { storage, now: NOW + 1000 })).toEqual([{ id: 11 }]);
  });

  it('devolve null quando o item expirou', () => {
    const storage = createMemoryStorage();
    writeCache('states', [{ id: 11 }], { storage, now: NOW });

    expect(readCache('states', { storage, now: NOW + CACHE_TTL_MS + 1 })).toBeNull();
  });

  it('devolve null quando a chave não existe', () => {
    expect(readCache('states', { storage: createMemoryStorage() })).toBeNull();
  });

  it('devolve null quando o conteúdo está corrompido', () => {
    const storage = createMemoryStorage();
    storage.setItem(CACHE_KEY_PREFIX + 'states', 'isso não é JSON');

    expect(readCache('states', { storage })).toBeNull();
  });

  it('não quebra quando o storage lança erro', () => {
    const storage = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('cheio');
      },
    };

    expect(() => writeCache('states', [], { storage })).not.toThrow();
    expect(readCache('states', { storage })).toBeNull();
  });
});

describe('withCache', () => {
  it('chama a API só na primeira vez e depois usa o cache', async () => {
    const storage = createMemoryStorage();
    const fetcher = vi.fn().mockResolvedValue({ ok: true });

    await withCache('gdp', fetcher, { storage, now: NOW });
    const result = await withCache('gdp', fetcher, { storage, now: NOW + 1000 });

    expect(result).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('busca de novo quando o cache expirou', async () => {
    const storage = createMemoryStorage();
    const fetcher = vi.fn().mockResolvedValueOnce('antigo').mockResolvedValueOnce('novo');

    await withCache('gdp', fetcher, { storage, now: NOW });
    const result = await withCache('gdp', fetcher, { storage, now: NOW + CACHE_TTL_MS + 1 });

    expect(result).toBe('novo');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('não grava no cache quando a busca falha', async () => {
    const storage = createMemoryStorage();
    const fetcher = vi.fn().mockRejectedValue(new Error('sem conexão'));

    await expect(withCache('gdp', fetcher, { storage })).rejects.toThrow('sem conexão');
    expect(readCache('gdp', { storage })).toBeNull();
  });
});
