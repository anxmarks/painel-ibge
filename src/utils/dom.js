// Busca um elemento que a página precisa ter. Se ele não existir (ex.: um id mudou no index.html)
// ou for de outro tipo, o erro aparece na hora, com o seletor no texto, e não depois como
// "Cannot read properties of null". Também diz ao TypeScript o tipo exato do elemento.
/**
 * @template {Element} T
 * @param {string} selector
 * @param {new () => T} type Ex.: HTMLCanvasElement, HTMLSelectElement
 * @param {ParentNode} [root]
 * @returns {T}
 */
export function requireElement(selector, type, root = document) {
  const element = root.querySelector(selector);
  if (!(element instanceof type)) {
    throw new Error(`Elemento "${selector}" não encontrado ou não é um ${type.name}.`);
  }
  return element;
}
