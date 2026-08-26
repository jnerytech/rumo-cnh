import { embaralhar, type Rng } from './embaralhar'
import type { Modulo, QuestaoFonte } from './tipos'

export const QUESTOES_NO_SIMULADO = 30
export const MODULOS: Modulo[] = [1, 2, 3, 4]

/**
 * Quantas questões cada módulo contribui, proporcional ao tamanho dele no banco.
 * A proporção pura soma 29 com 30 vagas, então o resto vai para os módulos com
 * maior parte fracionária (maior resto) — hoje isso dá 8/4/13/5.
 */
export function cotasPorModulo(
  questoes: readonly QuestaoFonte[],
  total = QUESTOES_NO_SIMULADO,
): Map<Modulo, number> {
  const disponivel = MODULOS.map((modulo) => ({
    modulo,
    n: questoes.filter((q) => q.modulo === modulo).length,
  }))
  const soma = disponivel.reduce((s, d) => s + d.n, 0)
  if (soma === 0) return new Map(MODULOS.map((m) => [m, 0]))

  const cotas = disponivel.map(({ modulo, n }) => {
    const exato = (n * total) / soma
    return { modulo, resto: exato % 1, cota: Math.floor(exato) }
  })
  let sobra = total - cotas.reduce((s, c) => s + c.cota, 0)
  for (const c of [...cotas].sort((a, b) => b.resto - a.resto || a.modulo - b.modulo)) {
    if (sobra <= 0) break
    c.cota++
    sobra--
  }
  return new Map(cotas.map((c) => [c.modulo, c.cota]))
}

/** 30 questões sem repetição, na proporção dos módulos. */
export function sortearSimulado(
  questoes: readonly QuestaoFonte[],
  total = QUESTOES_NO_SIMULADO,
  rng: Rng = Math.random,
): QuestaoFonte[] {
  return [...cotasPorModulo(questoes, total)].flatMap(([modulo, cota]) =>
    embaralhar(
      questoes.filter((q) => q.modulo === modulo),
      rng,
    ).slice(0, cota),
  )
}
