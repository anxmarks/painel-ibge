import { readFileSync } from 'node:fs';

// Os testes nunca chamam a API real: ela pode estar fora do ar ou lenta, e os dados podem mudar.
// Cada requisição é interceptada e respondida com uma resposta real salva em e2e/fixtures/.
const API_URL_PATTERN = 'https://servicodados.ibge.gov.br/api/**';

function readFixture(name) {
  return readFileSync(new URL(`../fixtures/${name}.json`, import.meta.url), 'utf8');
}

// Trecho da URL -> arquivo de fixture (os códigos são os mesmos do src/config.js)
const FIXTURES = [
  { urlPart: '/v1/localidades/estados', body: readFixture('states') },
  { urlPart: '/v3/agregados/4709/', body: readFixture('population') },
  { urlPart: '/v3/agregados/5938/', body: readFixture('gdp') },
  { urlPart: '/v3/agregados/4714/', body: readFixture('area') },
];

// Responde a API com as fixtures; qualquer URL inesperada falha, para o teste não ir à internet
export async function mockIbgeApi(page) {
  await page.unroute(API_URL_PATTERN);
  await page.route(API_URL_PATTERN, (route) => {
    const fixture = FIXTURES.find(({ urlPart }) => route.request().url().includes(urlPart));
    if (!fixture) return route.abort();
    return route.fulfill({ contentType: 'application/json', body: fixture.body });
  });
}

// Simula a API fora do ar (falha de conexão em todas as requisições)
export async function failIbgeApi(page) {
  await page.unroute(API_URL_PATTERN);
  await page.route(API_URL_PATTERN, (route) => route.abort('connectionrefused'));
}
