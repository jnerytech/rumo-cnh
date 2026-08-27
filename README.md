# rumo-cnh

App local de estudo para a prova teórica da CNH. Roda no navegador, sem backend
e sem conta: o progresso vive no `localStorage` da própria máquina.

Dois modos:

- **Estudar** — varre as 1496 questões com fila de erros. O que você errou volta,
  e precisa de **dois acertos seguidos** para sair da fila (um acerto pode ser chute).
  Teclado: `1`–`4` respondem, `Enter` avança.
- **Simulado** — 30 questões na proporção real do banco (8/4/13/5 por módulo),
  **sem revelar nada durante a prova**. No fim: nota, veredito contra o mínimo de
  24/30, e cada erro com sua resposta, a correta e o comentário. Errar aqui
  alimenta a fila de revisão do modo estudo.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

A porta é travada em 5173 de propósito: o progresso é preso à origem, e cair para
5174 abriria um app sem os seus dados, sem aviso.

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | 169 testes |
| `npm test -- --coverage` | cobertura, com limites travados |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run placas:cobertura` | quantas placas o acervo cobre |
| `npm run placas:contact-sheet` | folha de conferência visual das placas |

## Os dados

1500 questões extraídas do **Banco Nacional de Questões** da CNH (Ministério dos
Transportes / SENATRAN, versão 1.0) — 1496 depois de remover 4 duplicatas exatas
da fonte. Como a extração foi feita e o que ela validou: [`QUESTOES.md`](QUESTOES.md).

171 questões dependem de **ver a placa**, e usam 69 códigos distintos. O acervo
está completo: 67 SVGs do Wikimedia Commons e 2 desenhados aqui, com a procedência
de cada um em [`public/placas/fontes.json`](public/placas/fontes.json).

## Arquitetura

Quatro módulos, sem ciclos — o mapa e as fronteiras estão em
[`CAPABILITY-MAP.md`](CAPABILITY-MAP.md), com uma spec por módulo:

| Módulo | Responsabilidade |
|---|---|
| `dados` | carregar, embaralhar sem viés, filtrar, sortear |
| `acervo-placas` | 69 SVGs mapeados por `codigoPlaca` + relatório de cobertura |
| `modo-estudo` | fila de erros e progresso persistido |
| `modo-simulado` | 30 questões, nota, revisão |

`modo-estudo` e `modo-simulado` **não** importam um ao outro. Errar no simulado
alimenta a fila do estudo porque o `App` costura as duas coisas — ele é raiz de
composição, não módulo. Um teste lê o próprio arquivo e falha se esse import
aparecer.

100% de cobertura de branches, travada no `vite.config.ts`, em `src/dados/`,
`src/estudo/fila.ts` e `src/simulado/simulado.ts` — a lógica pura onde um erro não
dá sintoma.

## Três coisas que este projeto aprendeu do jeito difícil

**Embaralhar com `sort(() => Math.random() - 0.5)` não funciona.** Com 4
alternativas, a correta cai na posição 0 em **35,2%** das vezes em vez de 25%. Há
um teste que roda 10 000 embaralhamentos e exige 25% ± 2 p.p. em cada posição —
e ele foi verificado ao contrário, trocando Fisher–Yates pelo `sort` para provar
que fica vermelho. Teste que nunca falha não protege nada.

**A UI não consegue vazar o gabarito.** Na fonte, `alternativas[0]` é *sempre* a
correta. O tipo `QuestaoPreparada` **omite** `alternativas` e `respostaCorreta`,
então a tela não pode renderizar na ordem original — o campo não chega até ela.
A garantia é de tipo, não de disciplina.

**O banco tem um código errado.** A questão rotulada `R-35` descreve "pedestres à
esquerda, ciclistas à direita", que é o **R-36b** no Manual Brasileiro de
Sinalização; o `R-35` oficial é "ciclista, transite à esquerda". O acervo segue o
*significado* do gabarito, não o código impresso: quem estuda precisa reconhecer
a placa da questão.

## Escopo

Feito para uma pessoa estudando para uma prova. Sem contas, sem sincronização,
sem backend, sem versão mobile. Essas ausências são decisões, registradas em
[`docs/intent/simulado-cnh.md`](docs/intent/simulado-cnh.md).

## Licença e atribuição

O código deste repositório está sob [MIT](LICENSE). O conteúdo de terceiros tem
origem e condições próprias:

| O quê | Origem |
|---|---|
| `questoes.json`, `Banco Nacional de Questões.pdf` | Banco Nacional de Questões da CNH — Ministério dos Transportes / SENATRAN, distribuído gratuitamente para candidatos. Não é obra deste projeto. |
| `public/placas/*.svg` (67 arquivos) | Wikimedia Commons, sob as licenças de lá. Procedência arquivo por arquivo em [`public/placas/fontes.json`](public/placas/fontes.json). |
| `public/placas/R-44.svg`, `public/placas/SAU-06.svg` | Desenhados neste projeto a partir do padrão CONTRAN. |
| `.claude/`, `.agents/` | Coleções de skills de terceiros, mantidas como registro de como o projeto foi construído. |
