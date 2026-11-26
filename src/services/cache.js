import { CACHE_KEY_PREFIX, CACHE_TTL_MS } from '../config.js';

/**
 * Opções que os testes usam para trocar o storage e o relógio
 * @typedef {{ storage?: Pick<Storage, 'getItem' | 'setItem'> | null, ttl?: number, now?: number }} CacheOptions
 */

// O storage pode ser trocado nos testes; no navegador é o localStorage.
// Em aba anônima ou com armazenamento bloqueado, acessar o localStorage pode lançar erro.
function getDefaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Lê um item do cache; devolve null se não existe, expirou ou está corrompido
/**
 * @param {string} key
 * @param {CacheOptions} [options]
 * @returns {any}
 */
export function readCache(
  key,
  { storage = getDefaultStorage(), ttl = CACHE_TTL_MS, now = Date.now() } = {},
) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(CACHE_KEY_PREFIX + key);
    if (raw === null) return null;

    const { savedAt, data } = JSON.parse(raw);
    const isExpired = typeof savedAt !== 'number' || now - savedAt > ttl;
    return isExpired ? null : data;
  } catch {
    return null;
  }
}

// Grava um item no cache junto com a data em que foi salvo
/**
 * @param {string} key
 * @param {unknown} data
 * @param {CacheOptions} [options]
 */
export function writeCache(key, data, { storage = getDefaultStorage(), now = Date.now() } = {}) {
  if (!storage) return;

  try {
    storage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({ savedAt: now, data }));
  } catch {
    // Armazenamento cheio ou bloqueado: o painel segue funcionando sem cache
  }
}

// Devolve o dado do cache se ainda for válido; senão chama a função de busca e guarda o resultado
/**
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fetcher
 * @param {CacheOptions} [options]
 * @returns {Promise<T>}
 */
export async function withCache(key, fetcher, options = {}) {
  const cached = readCache(key, options);
  if (cached !== null) return cached;

  const data = await fetcher();
  writeCache(key, data, options);
  return data;
}
