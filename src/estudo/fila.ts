import type { QuestaoFonte } from '../dados/tipos'

export type ProgressoQuestao = {
  id: number
  vistas: number
  erros: number
  /** Zera a cada erro. Chutar certo uma vez não faz a questão sair da fila. */
  acertosSeguidos: number
}

export type Progresso = Record<number, ProgressoQuestao>

export const ACERTOS_PARA_DOMINAR = 2
export const DISTANCIA_MINIMA = 5

export function registrarResposta(p: Progresso, id: number, acertou: boolean): Progresso {
  const atual = p[id] ?? { id, vistas: 0, erros: 0, acertosSeguidos: 0 }
  return {
    ...p,
    [id]: {
      id,
      vistas: atual.vistas + 1,
      erros: atual.erros + (acertou ? 0 : 1),
      acertosSeguidos: acertou ? atual.acertosSeguidos + 1 : 0,
    },
  }
}

export function estaDominada(q: ProgressoQuestao | undefined): boolean {
  return q !== undefined && q.acertosSeguidos >= ACERTOS_PARA_DOMINAR
}

export function estaPendente(q: ProgressoQuestao | undefined): boolean {
  return q !== undefined && q.erros > 0 && !estaDominada(q)
}

/** Zero para questão sem progresso. Usado tanto para achar inédita quanto para ordenar. */
function vistasDe(p: Progresso, id: number): number {
  return p[id]?.vistas ?? 0
}

/**
 * Menos vista primeiro, empate pelo menor id — determinístico de propósito.
 * Chamada só com lista não vazia: `elegiveis` tem no mínimo um item porque a distância
 * é limitada a `candidatas.length - 1`.
 */
function menosVista(questoes: readonly QuestaoFonte[], p: Progresso): QuestaoFonte {
  return [...questoes].sort(
    (a, b) => vistasDe(p, a.id) - vistasDe(p, b.id) || a.id - b.id,
  )[0] as QuestaoFonte
}

/**
 * Prioridade: pendente > inédita > dominada menos vista.
 *
 * `recentes` vem do mais recente para o mais antigo. A distância é
 * `min(DISTANCIA_MINIMA, candidatas - 1)`: com a distância fixa, um filtro que deixasse
 * menos de 5 candidatas tornaria todas inelegíveis e isto devolveria null para sempre.
 */
export function proximaQuestao(
  p: Progresso,
  candidatas: readonly QuestaoFonte[],
  recentes: readonly number[],
): QuestaoFonte | null {
  if (candidatas.length === 0) return null

  const distancia = Math.min(DISTANCIA_MINIMA, candidatas.length - 1)
  const bloqueados = new Set(recentes.slice(0, distancia))
  const elegiveis = candidatas.filter((q) => !bloqueados.has(q.id))

  const pendentes = elegiveis.filter((q) => estaPendente(p[q.id]))
  if (pendentes.length > 0) return menosVista(pendentes, p)

  return elegiveis.find((q) => vistasDe(p, q.id) === 0) ?? menosVista(elegiveis, p)
}
