/**
 * Histórico de provas. Uma nota isolada diz se você passaria hoje; a sequência diz
 * se você está melhorando — que é a informação útil com prova marcada.
 */
export const CHAVE_HISTORICO = 'rumo-cnh:simulados:v1'

/** `em` é ISO e chega de fora: relógio interno tornaria o teste não determinístico. */
export type Prova = { em: string; acertos: number; total: number }

/**
 * Mesma forma do Armazem de src/estudo/persistencia.ts, declarado aqui de novo de
 * propósito: importar de lá criaria uma dependência modo-simulado -> modo-estudo que
 * o CAPABILITY-MAP não declara. Uma linha duplicada custa menos que uma seta errada.
 */
export type Armazem = Pick<Storage, 'getItem' | 'setItem'>

function armazemPadrao(): Armazem | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function ehProva(v: unknown): v is Prova {
  if (typeof v !== 'object' || v === null) return false
  const p = v as Record<string, unknown>
  return typeof p.em === 'string' && typeof p.acertos === 'number' && typeof p.total === 'number'
}

export function carregarHistorico(armazem: Armazem | null = armazemPadrao()): Prova[] {
  let cru: string | null
  try {
    cru = armazem?.getItem(CHAVE_HISTORICO) ?? null
  } catch {
    return []
  }
  if (cru === null) return []

  let dados: unknown
  try {
    dados = JSON.parse(cru)
  } catch {
    return []
  }
  if (!Array.isArray(dados)) return []
  return dados.filter(ehProva)
}

/** Anexa no topo: a prova mais recente é a que interessa na tela. */
export function registrarProva(p: Prova, armazem: Armazem | null = armazemPadrao()): void {
  const historico = [p, ...carregarHistorico(armazem)]
  try {
    armazem?.setItem(CHAVE_HISTORICO, JSON.stringify(historico))
  } catch {
    // Perder o histórico é ruim; derrubar a tela de resultado é pior.
  }
}
