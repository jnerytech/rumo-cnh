export type Rng = () => number

/**
 * Fisher–Yates. Não use `[...itens].sort(() => Math.random() - 0.5)`: o comparador
 * inconsistente produz permutações com probabilidades desiguais, e com 4 elementos
 * o viés é grande o bastante para a alternativa correta cair mais numa posição que
 * nas outras. Ver o teste de viés em preparar.test.ts.
 */
export function embaralhar<T>(itens: readonly T[], rng: Rng = Math.random): T[] {
  const saida = [...itens]
  for (let i = saida.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = saida[i] as T
    const b = saida[j] as T
    saida[i] = b
    saida[j] = a
  }
  return saida
}
