import { ALL_REGIONS, REGIONS } from '../config.js';
import { formatShare } from '../utils/format.js';

// Tabela com os valores da série histórica: um ano por linha, uma região por coluna.
// É a alternativa ao gráfico de linha para quem usa leitor de tela ou quer o número exato de um ano.
export function createHistoryTable({ table }) {
  function update({ history, region }) {
    const { years, regions } = history;
    // A ordem das colunas é a oficial (N, NE, CO, SE, S), a mesma da legenda da rosca
    const columns = REGIONS.map((item) =>
      regions.find((series) => series.acronym === item.acronym),
    );
    const highlightClass = (acronym) =>
      region !== ALL_REGIONS && acronym === region ? ' is-highlighted' : '';

    table.tHead.innerHTML = `
      <tr>
        <th scope="col">Ano</th>
        ${columns
          .map(
            (item) =>
              `<th scope="col" class="is-numeric${highlightClass(item.acronym)}">${item.name}</th>`,
          )
          .join('')}
      </tr>`;

    table.tBodies[0].innerHTML = years
      .map(
        (year, index) => `
      <tr>
        <th scope="row">${year}</th>
        ${columns
          .map(
            (item) =>
              `<td class="is-numeric${highlightClass(item.acronym)}">${formatShare(item.shares[index])}</td>`,
          )
          .join('')}
      </tr>`,
      )
      .join('');
  }

  return { update };
}
