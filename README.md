# 📊 Brasil em Dados

> Painel web interativo que consome dados abertos do IBGE e apresenta indicadores socioeconômicos dos estados brasileiros.

[![CI](https://github.com/anxmarks/painel-ibge/actions/workflows/ci.yml/badge.svg)](https://github.com/anxmarks/painel-ibge/actions/workflows/ci.yml)
[![Deploy](https://github.com/anxmarks/painel-ibge/actions/workflows/deploy.yml/badge.svg)](https://github.com/anxmarks/painel-ibge/actions/workflows/deploy.yml)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

🔗 **Demo:** [anxmarks.github.io/painel-ibge](https://anxmarks.github.io/painel-ibge/)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/preview-dark.png" />
  <img src="docs/preview-light.png" alt="Painel Brasil em Dados: filtros de região e indicador, cards com população, PIB e PIB per capita, ranking dos estados em barras, participação das regiões em gráfico de rosca e tabela de dados por estado." width="800" />
</picture>

---

## 📌 Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Fonte de dados](#-fonte-de-dados)
- [Arquitetura](#-arquitetura)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Como executar](#-como-executar)
- [Qualidade e entrega contínua](#-qualidade-e-entrega-contínua)
- [Aprendizados](#-aprendizados)
- [Próximos passos](#-próximos-passos)
- [Autora](#-autora)

---

## 💡 Sobre o projeto

O **Brasil em Dados** transforma dados públicos do IBGE em visualizações claras e interativas. Dá para comparar estados, filtrar por região e explorar população, PIB e PIB per capita de 2022.

O painel foi feito **sem framework**, de propósito: o objetivo era dominar os fundamentos do JavaScript (DOM, módulos, estado, assincronismo) antes de partir para React.

---

## ✨ Funcionalidades

- **Cards de KPI** com população total, PIB total e PIB per capita da seleção
- **Ranking dos estados** em gráfico de barras, pelo indicador escolhido
- **Participação das regiões** (N, NE, CO, SE, S) em gráfico de rosca, com legenda que traz porcentagem e valor
- **Tabela ordenável** por qualquer coluna, com busca que ignora acentos
- **Filtros** por região e por indicador, que atualizam o painel inteiro
- **Estados de interface:** skeleton de carregamento, mensagem de erro com "Tentar novamente"
- **Cache local** das respostas da API (localStorage, expira em 24h)
- **Tema claro/escuro**, que segue o sistema até a pessoa escolher
- **Exportação em CSV** do que a tabela está mostrando, pronta para abrir no Excel em português
- **Responsivo e acessível:** testado em 360px, 768px e 1280px; navegação por teclado, link para pular ao conteúdo, `aria-label` nos gráficos, cores validadas para daltonismo

**Lighthouse:** 99–100 em Performance e 100 em Acessibilidade, Boas Práticas e SEO.

---

## 🛠 Tecnologias

| Categoria   | Ferramenta                                                 |
| ----------- | ---------------------------------------------------------- |
| Linguagem   | JavaScript (ES Modules)                                    |
| Build / Dev | [Vite](https://vitejs.dev/)                                |
| Gráficos    | [Chart.js](https://www.chartjs.org/)                       |
| Estilo      | CSS moderno (variáveis, Grid, Flexbox)                     |
| Qualidade   | ESLint + Prettier                                          |
| Testes      | [Vitest](https://vitest.dev/)                              |
| CI / Deploy | GitHub Actions + [GitHub Pages](https://pages.github.com/) |

---

## 🗄 Fonte de dados

Os dados vêm da **[API de Serviço de Dados do IBGE](https://servicodados.ibge.gov.br/api/docs)**, pública, gratuita e sem autenticação.

| Dado                        | Endpoint                                                                    |
| --------------------------- | --------------------------------------------------------------------------- |
| Estados e regiões           | `GET /api/v1/localidades/estados`                                           |
| População residente (Censo) | `GET /api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N3[all]` |
| PIB a preços correntes      | `GET /api/v3/agregados/5938/periodos/2022/variaveis/37?localidades=N3[all]` |

População e PIB usam **o mesmo ano (2022)**, para que a divisão faça sentido. O **PIB per capita** é calculado no front-end (`PIB ÷ população`), e o PIB, que a API entrega em mil reais, é convertido para reais.

---

## 🏗 Arquitetura

O fluxo dos dados segue a ideia de um pipeline de ETL:

```
  API IBGE  ──►  services/  ──►  utils/transform  ──►  state  ──►  components/
  (Extract)      (fetch +        (Transform:           (store      (Load: gráficos,
                  cache)          normaliza, junta,     central)    cards, tabela)
                                  calcula per capita)
```

- **services/**: toda a comunicação com a API. Os componentes nunca chamam `fetch`.
- **utils/**: funções puras, sem efeitos colaterais, cobertas por testes.
- **state.js**: um store simples (`getState`, `setState`, `subscribe`). A interface é sempre `render(estado)`: um filtro muda o estado, e o painel se redesenha a partir dele.
- **components/**: cada parte da interface é criada uma vez e expõe um `update()`. Os gráficos são atualizados com `chart.update()`, nunca recriados.
- **config.js**: URLs, códigos de tabelas e todos os valores fixos. Nenhum "número mágico" solto no código.

---

## 📁 Estrutura de pastas

```
painel-ibge/
├── .github/workflows/
│   ├── ci.yml              # Prettier, ESLint, testes e build a cada push/PR
│   └── deploy.yml          # Publica no GitHub Pages a cada push na main
├── docs/                   # Imagens do README
├── public/                 # favicon e robots.txt
├── src/
│   ├── components/         # kpiCards, barChart, regionChart, dataTable, filters, themeToggle, chartTheme
│   ├── services/           # ibgeApi (fetch) e cache (localStorage com expiração)
│   ├── utils/              # transform, format (Intl pt-BR) e exportCsv
│   ├── styles/             # variables.css (design tokens e tema escuro) e main.css
│   ├── config.js
│   ├── state.js
│   └── main.js             # Ponto de entrada
├── tests/                  # Vitest: transform, format, cache, state, exportCsv
├── index.html
└── vite.config.js
```

---

## 🚀 Como executar

**Pré-requisitos:** Node.js 20.19+ e npm

```bash
git clone https://github.com/anxmarks/painel-ibge.git
cd painel-ibge
npm install
npm run dev
```

O painel abre em `http://localhost:5173/painel-ibge/` (o caminho `/painel-ibge/` é o mesmo do GitHub Pages).

| Script                 | Descrição                             |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Servidor local com hot reload         |
| `npm run build`        | Build otimizado em `dist/`            |
| `npm run preview`      | Pré-visualiza o build                 |
| `npm test`             | Testes com Vitest (modo watch)        |
| `npm run lint`         | Analisa o código com ESLint           |
| `npm run format`       | Formata o código com Prettier         |
| `npm run format:check` | Confere a formatação sem alterar nada |

---

## ✅ Qualidade e entrega contínua

- **67 testes** cobrem as funções puras: transformação dos dados do SIDRA, cálculo do per capita, formatação, cache, store e geração do CSV.
- **CI:** cada push e cada Pull Request rodam Prettier, ESLint, testes e build no GitHub Actions.
- **Deploy contínuo:** cada merge na `main` roda os testes de novo e, se passarem, publica o build no GitHub Pages.
- **Fluxo de trabalho:** cada etapa do projeto foi uma branch e um Pull Request próprios, com commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/).

---

## 🧠 Aprendizados

**O formato aninhado do SIDRA.** A API de agregados não devolve uma lista simples de estados: o valor de cada estado fica dentro de `resultados → series → serie → ano`, e vem como **texto**, às vezes com códigos como `"-"` ou `"..."` no lugar de um número. Separei esse trabalho em funções puras (`parseSidraValue`, `parseAggregateSeries`, `mergeStateData`) e escrevi testes para cada uma. Assim, o resto do painel só enxerga um array limpo de estados.

**Cache com expiração.** Os dados do IBGE mudam raramente, então não faz sentido buscá-los a cada visita. As respostas ficam no `localStorage` com a data em que foram salvas e expiram em 24h. O prefixo da chave tem versão (`v1`), o que permite invalidar o cache antigo se o formato dos dados mudar. Todo acesso ao `localStorage` fica em `try/catch`, porque em aba anônima ou com armazenamento bloqueado ele pode lançar erro, e o painel precisa continuar funcionando sem cache.

**O Chart.js guarda as opções das escalas.** Ao implementar o tema escuro, os eixos dos gráficos continuavam com as cores do tema claro. Descobri que o Chart.js copia as opções de escala quando o gráfico é criado, então mudar os padrões globais depois não tem efeito. A solução foi reaplicar as cores das escalas a cada `update()`, lendo os valores atuais das variáveis CSS.

**Achar a causa real de um problema de layout.** O Lighthouse apontou um CLS (deslocamento de layout) de 0,258 no celular. A primeira tentativa, ajustar a altura das linhas, não mudou nada. Medindo de novo, vi que o deslocamento vinha dos cards de KPI, que só apareciam depois que o JavaScript carregava. Colocar o skeleton dos cards direto no HTML reservou o espaço desde a primeira pintura, e o CLS foi para 0.

**Interface como função do estado.** Com um store central e uma única função `render(estado)`, carregamento, erro, filtros e tema passaram a ser só valores no estado. Isso deixou fácil implementar o botão "Tentar novamente" e garantir que tudo na tela fica sempre consistente.

**O que eu faria diferente:** usaria TypeScript desde o início para descrever o formato dos dados da API, e escreveria testes de interface (por exemplo, com Playwright) além dos testes de funções.

---

## 🔮 Próximos passos

- [ ] Mapa coroplético do Brasil (ex.: com Leaflet ou D3)
- [ ] Série histórica com gráfico de linha
- [ ] Novos indicadores (IDH, escolaridade, saneamento)
- [ ] Versão em React + TypeScript

---

## 👩‍💻 Autora

**Ana Luiza Marks** · Bacharel em Ciência da Computação (URI)

[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/anxmarks)

---

## 📄 Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](./LICENSE) para mais detalhes.

Dados: © IBGE — Instituto Brasileiro de Geografia e Estatística, disponibilizados via API pública.
