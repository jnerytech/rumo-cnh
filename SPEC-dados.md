# Spec: `dados`

Módulo `dados` do [`CAPABILITY-MAP.md`](CAPABILITY-MAP.md). Depende de: nada.
Tech stack, comandos, estrutura, estilo, testes e fronteiras: ver *Fundações compartilhadas* no mapa.

## Objective

Ser a única porta de entrada para `questoes.json`, entregando questões à UI num formato em que
**é impossível vazar o gabarito** e em que duplicatas já não existem.

Usuário: os módulos `modo-estudo` e `modo-simulado` — nenhuma tela lê o JSON diretamente.

O risco que este módulo existe para eliminar: na fonte, `alternativas[0]` é **sempre** a correta
(`respostaCorreta: 0`, ver `QUESTOES.md` §1). Renderizar na ordem do arquivo torna o app inútil,
e o bug não quebra nada — só ensina errado.

## Contrato

```ts
// tipos
type Dificuldade = 'Fácil' | 'Intermediário' | 'Difícil'

/** Questão como está na fonte. Uso interno do módulo. */
type QuestaoFonte = { id: number; parte: 1 | 2; parteNome: string; modulo: 1|2|3|4
  moduloNome: string; numeroNoModulo: number; dificuldade: Dificuldade; enunciado: string
  codigoPlaca: string | null; requerImagem: boolean; alternativas: string[]
  respostaCorreta: number; comentario: string; duplicataDe: number | null }

/** Questão pronta para render. NÃO carrega `alternativas` nem `respostaCorreta`. */
type QuestaoPreparada = Omit<QuestaoFonte, 'alternativas' | 'respostaCorreta' | 'duplicataDe'>
  & { opcoes: string[]; indiceCorreto: number }

type Filtro = { modulos?: (1|2|3|4)[]; dificuldades?: Dificuldade[]
  parte?: 1 | 2
  /** Predicado injetado: `dados` não conhece o acervo, só pergunta. Ver Open Question 3. */
  temPlaca?: (codigo: string) => boolean }

// API
carregarQuestoes(): QuestaoFonte[]                     // já sem duplicatas: 1496
prepararQuestao(q: QuestaoFonte, rng?: Rng): QuestaoPreparada
filtrar(qs: QuestaoFonte[], f: Filtro): QuestaoFonte[]
sortearSimulado(qs: QuestaoFonte[], n?: number, rng?: Rng): QuestaoFonte[]  // n = 30
embaralhar<T>(itens: readonly T[], rng?: Rng): T[]
```

`QuestaoPreparada` omitir `alternativas` e `respostaCorreta` é a garantia de tipo: a UI
**não consegue** renderizar na ordem da fonte porque o campo não existe no que ela recebe.

### Sorteio do simulado

30 questões, sem repetição, distribuídas proporcionalmente ao banco por módulo, usando
**maior resto** para fechar em 30 (a proporção pura soma 29):

| Módulo | Únicas | Proporção | No simulado |
|---|---|---|---|
| M1 · Placas, Cores e Caminhos | 412 | 27,5% | 8 |
| M2 · Escolhas e Consequências | 205 | 13,7% | 4 |
| M3 · Na Direção da Segurança | 619 | 41,4% | **13** (recebe o resto) |
| M4 · Cuidar, Agir e Preservar | 260 | 17,4% | 5 |

Sem cota por dificuldade — o sorteio dentro de cada módulo é uniforme.

## Success Criteria

Testáveis, todos em `src/dados/*.test.ts`:

1. `carregarQuestoes()` retorna **exatamente 1496** questões (1500 − 4 duplicatas) e nenhuma com
   `duplicataDe !== null`.
2. Toda questão retornada tem 4 alternativas não vazias, `enunciado` e `comentario` não vazios.
3. `prepararQuestao` — `opcoes[indiceCorreto]` é sempre igual a `alternativas[respostaCorreta]`
   da questão de origem, em 1496/1496 questões.
4. `prepararQuestao` — `opcoes` é permutação exata de `alternativas` (mesmo multiconjunto).
5. **Anti-viés:** 10 000 preparações da mesma questão com `Math.random` real distribuem
   `indiceCorreto` em cada uma das 4 posições dentro de **25% ± 2 pontos percentuais**.
   (`sort(() => Math.random() - 0.5)`, sugerido no `QUESTOES.md` §1, falha este teste — é por isso
   que o módulo usa Fisher–Yates.)
6. Com RNG determinístico injetado, `prepararQuestao` e `sortearSimulado` são reprodutíveis.
7. `sortearSimulado()` retorna 30 questões, sem `id` repetido, na distribuição 8/4/13/5 por módulo.
8. `filtrar` com `temPlaca` injetado remove toda questão com `requerImagem: true` cujo
   `codigoPlaca` reprove no predicado — e **nenhuma** outra. Testado com predicado falso
   (sobram 1325) e sempre-verdadeiro (sobram 1496), sem importar nada de `src/placas/`.
9. `filtrar` com filtros vazios devolve a entrada inalterada; filtros combinam por AND.
10. Cobertura de branches de `src/dados/` = 100%.

## Boundaries

Além das do mapa:

- **Sempre:** este módulo é puro — sem React, sem DOM, sem `localStorage`.
- **Nunca:** exportar `QuestaoFonte` para fora de `src/dados/`. A UI só conhece `QuestaoPreparada`.

## Open Questions

1. **Filtro de placa indisponível.** Enquanto o acervo estiver incompleto, o padrão é
   `apenasComPlacaDisponivel: true` (pular questão sem imagem) ou mostrar a questão com um aviso?
   → Assumo **pular**, porque questão sem a placa é irrespondível. Reversível por flag.
2. **Repetição no simulado.** Um simulado novo pode repetir questão de um simulado anterior?
   → Assumo **sim** (sorteio independente); memória entre simulados é do `modo-estudo`.
3. **Direção da dependência com `acervo-placas` — resolvida.** A primeira versão desta spec tinha
   `apenasComPlacaDisponivel: boolean`, o que obrigaria `dados` a importar de `src/placas/` e
   violaria o mapa (`dados` não depende de nada). Trocado por um predicado `temPlaca` injetado:
   quem conhece o acervo é o chamador. `dados` continua puro e testável sem placa nenhuma.
