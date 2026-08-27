# Spec: `modo-estudo`

Módulo `modo-estudo` do [`CAPABILITY-MAP.md`](CAPABILITY-MAP.md). Depende de: `dados`, `acervo-placas`.
Tech stack, comandos, estrutura, estilo, testes e fronteiras: ver *Fundações compartilhadas* no mapa.

## Objective

Varrer as 1496 questões sem esquecer o que já passou. O que você errou volta, e volta antes do que
você acertou; o que você acertou duas vezes seguidas sai do caminho.

Usuário: você, com prova marcada. Sucesso do módulo é comportamental, não visual: depois de uma
sessão, as questões que você errou apareceram de novo, e as que você domina não ocuparam seu tempo.

Por que fila de erros e não repetição espaçada de verdade: com prazo em semanas você não completa
um ciclo de intervalos crescentes, então o algoritmo caro não paga. Decisão registrada em
`docs/intent/simulado-cnh.md`.

## Contrato

```ts
// src/estudo/fila.ts — lógica pura, sem React e sem localStorage
export type ProgressoQuestao = {
  id: number
  vistas: number
  erros: number
  acertosSeguidos: number // zera a cada erro
}
export type Progresso = Record<number, ProgressoQuestao>

export const ACERTOS_PARA_DOMINAR = 2
export const DISTANCIA_MINIMA = 5 // questões entre uma repetição e a próxima

export function registrarResposta(p: Progresso, id: number, acertou: boolean): Progresso
export function estaDominada(q: ProgressoQuestao | undefined): boolean

/**
 * `recentes` são os ids das últimas respostas, do mais recente para o mais antigo.
 * Devolve null quando não há candidata elegível.
 */
export function proximaQuestao(
  p: Progresso,
  candidatas: readonly QuestaoFonte[],
  recentes: readonly number[],
): QuestaoFonte | null
```

### Ordem de prioridade em `proximaQuestao`

1. **Pendentes** — já erradas e ainda não dominadas, respeitando `DISTANCIA_MINIMA`.
2. **Inéditas** — `vistas === 0`.
3. **Dominadas** — a menos vista, para revisão, quando não sobrou mais nada.

Nenhuma questão pode reaparecer antes de `DISTANCIA_MINIMA` outras. Sem isso, errar produziria a
mesma pergunta na tela seguinte, e você acertaria por memória de curtíssimo prazo, não por saber.

A distância é o menor valor entre `DISTANCIA_MINIMA` e `candidatas.length - 1`. Um filtro estreito
pode deixar menos de 5 questões no conjunto; com a distância fixa, toda candidata ficaria inelegível
e o estudo travaria em `null` para sempre. Com 1 candidata a distância é 0 e ela repete — que é o
comportamento certo, porque não existe outra coisa para mostrar.

```ts
// src/estudo/persistencia.ts
export function carregarProgresso(): Progresso  // localStorage; vazio se ausente ou corrompido
export function salvarProgresso(p: Progresso): void
export function zerarProgresso(): void          // silencioso se o storage recusar
```

Chave: `rumo-cnh:progresso:v1`. O `v1` existe para que uma mudança de formato não exploda em cima
de dado velho — versão nova ignora a antiga em vez de tentar migrar.

## Comportamento da tela

- Enunciado, a placa quando `requerImagem` (via `<Placa/>`), e as 4 `opcoes`.
- Escolher uma opção **revela** a correta e o `comentario`; a resposta não pode ser trocada depois.
- Avançar é uma ação explícita, nunca automática — ler o comentário é onde o aprendizado acontece.
- Teclado: `A`–`D` **ou** `1`–`4` respondem, `Enter`/espaço avança. As letras casam com o
  rótulo das opções na tela. Os atalhos ficam escritos na interface, e somem em aparelho sem
  teclado (`@media (hover: none)`).
- Filtros de módulo e dificuldade, aplicados via `filtrar` de `dados`.
- Contadores visíveis: **aprendidas** (dominadas), **a revisar** (pendentes) e **inéditas**, mais
  uma barra de progresso de aprendidas sobre o total do recorte.
- Botão de zerar progresso, com confirmação em dois cliques. Apaga o progresso do estudo e o
  histórico de provas — apagar semanas de estudo não pode ser um toque acidental, e um
  `window.confirm` é feio e bloqueável.

## Success Criteria

Testáveis, em `src/estudo/*.test.ts`:

1. Errar a questão X faz X reaparecer — dentro das 10 questões seguintes, e **nunca** como a próxima.
2. Um acerto **não** basta: depois de errar e acertar uma vez, X continua pendente.
3. Dois acertos seguidos tiram X da fila de pendentes.
4. Errar depois de um acerto zera `acertosSeguidos` — X volta ao começo da conta.
5. `proximaQuestao` nunca devolve id presente nas últimas `DISTANCIA_MINIMA` respostas, mesmo
   quando é a única pendente (aí cai para inédita).
6. Sem inéditas e sem pendentes, devolve a dominada menos vista; com zero candidatas, devolve `null`.
6b. Com menos candidatas que `DISTANCIA_MINIMA`, continua devolvendo questão em vez de travar em
    `null`: com 3 candidatas a distância cai para 2, e com 1 candidata ela repete.
7. `registrarResposta` é pura: não muta o `Progresso` recebido.
8. `carregarProgresso` devolve `{}` — sem lançar — quando o `localStorage` está vazio, com JSON
   inválido, ou quando o acesso em si lança (aba privada, storage bloqueado).
9. Progresso sobrevive a recarregar a página (ida e volta por `salvarProgresso`/`carregarProgresso`).
10. A tela mostra `opcoes` e nunca `alternativas` — garantido pelo tipo `QuestaoPreparada`, e
    verificado por um teste que responde e confere que o comentário aparece só depois.
11. Responder pelo teclado (`A`–`D` ou `1`–`4`) produz o mesmo efeito que clicar, nos dois modos.
11b. Zerar exige dois cliques; o primeiro só pede confirmação. O segundo apaga progresso e
     histórico, e os contadores voltam ao total.
12. **100% de branches em `src/estudo/fila.ts`** — é lógica pura onde erro não dá sintoma, mesma
    razão de `src/dados/`. Threshold no `vite.config.ts`.

## Boundaries

Além das do mapa:

- **Sempre:** `src/estudo/fila.ts` puro — sem React, sem `localStorage`, sem `Date.now()` embutido.
- **Nunca:** ler `questoes.json` direto; tudo passa por `dados`.
- **Nunca:** avançar de questão sozinho por timer.

## Open Questions

1. **Distância mínima de 5.** Chute defensável, não medido. Fácil de ajustar depois de você usar.
2. **Revisão de dominadas.** Hoje só entram quando acaba tudo. Se na prática você quiser revisar as
   dominadas antes disso, isso vira um filtro "só revisão" — não muda o contrato.
3. **Progresso e filtros.** O progresso é global, não por filtro: estudar só o M1 e depois tudo não
   zera nada. Assumo que é o que você quer.
