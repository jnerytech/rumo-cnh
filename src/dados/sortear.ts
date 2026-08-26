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
  const disponivel = new Map<Modulo, number>(
    MODULOS.map((m) => [m, questoes.filter((q) => q.modulo === m).length]),
  )
  const soma = [...disponivel.values()].reduce((a, b) => a + b, 0)
  if (soma === 0) return new Map(MODULOS.map((m) => [m, 0]))

  const exato = MODULOS.map((m) => ((disponivel.get(m) ?? 0) * total) / soma)
  const cotas = new Map<Modulo, number>(MODULOS.map((m, i) => [m, Math.floor(exato[i] ?? 0)]))
  let sobra = total - [...cotas.values()].reduce((a, b) => a + b, 0)

  const porResto = [...MODULOS]
    .map((m, i) => ({ m, resto: (exato[i] ?? 0) % 1 }))
    .sort((a, b) => b.resto - a.resto || a.m - b.m)
  for (const { m } of porResto) {
    if (sobra <= 0) break
    cotas.set(m, (cotas.get(m) ?? 0) + 1)
    sobra--
  }
  return cotas
}

/** 30 questões sem repetição, na proporção dos módulos. */
export function sortearSimulado(
  questoes: readonly QuestaoFonte[],
  total = QUESTOES_NO_SIMULADO,
  rng: Rng = Math.random,
): QuestaoFonte[] {
  const cotas = cotasPorModulo(questoes, total)
  return MODULOS.flatMap((m) =>
    embaralhar(
      questoes.filter((q) => q.modulo === m),
      rng,
    ).slice(0, cotas.get(m) ?? 0),
  )
}
