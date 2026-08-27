# Spec: `modo-simulado`

Módulo `modo-simulado` do [`CAPABILITY-MAP.md`](CAPABILITY-MAP.md). Depende de: `dados`, `acervo-placas`.
Tech stack, comandos, estrutura, estilo, testes e fronteiras: ver *Fundações compartilhadas* no mapa.

## Objective

Responder o critério de sucesso do projeto: **você passaria?** 30 questões, sem feedback durante a
prova, nota no fim, e revisão dos erros com o comentário.

Usuário: você, medindo prontidão — não estudando. A diferença entre este módulo e o `modo-estudo`
é o silêncio: aqui nada é revelado até você terminar. Revelar durante a prova transformaria a
medição em estudo e a nota deixaria de significar o que você quer que ela signifique.

Aprovado é **≥ 24 de 30**, o critério registrado em `docs/intent/simulado-cnh.md`.

## Contrato

```ts
// src/simulado/simulado.ts — puro, sem React e sem localStorage
export const QUESTOES = 30
export const MINIMO_PARA_PASSAR = 24

export type Simulado = {
  questoes: QuestaoPreparada[]
  /** Índice escolhido por questão; null enquanto não respondida. */
  respostas: (number | null)[]
  atual: number
  finalizado: boolean
}

export type Resultado = {
  acertos: number
  total: number
  aprovado: boolean
  /** Para revisão: a questão, o que você marcou e qual era a correta. */
  erros: { questao: QuestaoPreparada; marcada: number }[]
}

export function criarSimulado(questoes: readonly QuestaoFonte[], rng?: Rng): Simulado
export function responder(s: Simulado, indice: number): Simulado
export function avancar(s: Simulado): Simulado
export function finalizar(s: Simulado): Simulado
export function resultado(s: Simulado): Resultado
```

Reusa `sortearSimulado` de `dados`, que já entrega 30 questões na distribuição 8/4/13/5 por maior
resto e já é testado. Este módulo não re-sorteia nada por conta própria.

### Regras de navegação

- **Precisa responder para avançar.** Sem pular: terminar com 8 em branco por engano produziria uma
  nota que não mede nada.
- **Enquanto está na questão, pode trocar a resposta.** Ao avançar, trava — não há voltar.
- **Finalizar só existe na última questão**, e só depois de respondê-la.

### O simulado alimenta a fila de estudo

Errar no simulado registra no mesmo `Progresso` do `modo-estudo`, via `registrarResposta`. Errar é
errar, independentemente da tela onde aconteceu, e a questão passa a aparecer na revisão.

O registro acontece **na finalização**, não a cada resposta: gravar durante a prova faria o
contador de "a revisar" mudar por baixo do estudo enquanto você ainda nem sabe se errou.

### Histórico

```ts
// src/simulado/historico.ts
export const CHAVE_HISTORICO = 'rumo-cnh:simulados:v1'
export type Prova = { em: string; acertos: number; total: number }

export function carregarHistorico(armazem?: Armazem | null): Prova[]
export function registrarProva(p: Prova, armazem?: Armazem | null): void
```

Uma nota isolada diz se você passaria hoje; a sequência diz se está melhorando. `em` é ISO e chega
injetado — nada de `new Date()` dentro da função, senão o teste não é determinístico.

Mesmas garantias de falha da persistência do estudo: storage ausente, bloqueado ou corrompido
devolve lista vazia sem lançar.

## Success Criteria

Testáveis, em `src/simulado/*.test.ts`:

1. `criarSimulado` devolve 30 questões, sem `id` repetido, na distribuição 8/4/13/5.
2. As questões chegam preparadas: têm `opcoes`, não têm `alternativas` nem `respostaCorreta`.
3. `responder` registra a escolha e **não** expõe se acertou — nada em `Simulado` diz certo/errado
   antes de `finalizado`.
4. Responder de novo na mesma questão troca a escolha; depois de `avancar`, aquela resposta é final.
5. `avancar` sem ter respondido não faz nada.
6. `avancar` na última questão não sai dela; quem encerra é `finalizar`.
7. `finalizar` sem ter respondido a última não finaliza.
8. `resultado` conta acertos comparando com `indiceCorreto`, e `aprovado` é `acertos >= 24`.
9. `resultado` lista os erros com a questão e o índice marcado — o suficiente para a revisão mostrar
   sua resposta, a correta e o comentário.
10. Simulado com 24 acertos aprova; com 23, reprova. As duas bordas testadas.
11. Finalizar registra cada questão no `Progresso` do estudo, e as erradas ficam pendentes de revisão.
12. `registrarProva` e `carregarHistorico` sobrevivem à ida e volta, e devolvem `[]` sem lançar com
    storage ausente, bloqueado ou JSON corrompido.
13. Durante a prova, a tela não mostra comentário, não marca correta e não mostra placar parcial.
14. A tela de resultado mostra `N/30`, o veredito, e a lista de erros com comentário.
15. **100% de branches em `src/simulado/simulado.ts`** — mesma razão de `fila.ts`.

## Boundaries

Além das do mapa:

- **Sempre:** `simulado.ts` puro — sem React, sem `localStorage`, sem relógio interno.
- **Nunca:** revelar acerto, erro ou placar parcial antes de `finalizado`.
- **Nunca:** re-sortear questões por conta própria; o sorteio é de `dados`.

## Open Questions

1. **Sem cronômetro no v1.** A prova real tem tempo, mas o que te reprova é errar, não demorar.
   Adicionar depois é um contador na tela, não uma mudança de contrato.
2. **Sem voltar em questão já avançada.** Simplifica a máquina de estados. Se na prática incomodar,
   vira navegação livre sem mudar o resultado.
3. **Filtros no simulado?** Não. Simulado mede a prova inteira; recortar por módulo é estudo, e
   isso o outro modo já faz.
