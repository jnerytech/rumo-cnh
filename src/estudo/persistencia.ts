import type { Progresso, ProgressoQuestao } from './fila'

/**
 * A versão na chave existe para que uma mudança de formato não tente ler dado velho:
 * a versão nova simplesmente não encontra nada e começa limpa.
 */
export const CHAVE_PROGRESSO = 'rumo-cnh:progresso:v1'

/** Só o que este módulo usa do Storage — deixa o teste injetar um falso. */
export type Armazem = Pick<Storage, 'getItem' | 'setItem'>

/** O acesso a localStorage pode lançar por si só (aba privada, storage bloqueado). */
function armazemPadrao(): Armazem | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function ehProgressoQuestao(v: unknown): v is ProgressoQuestao {
  if (typeof v !== 'object' || v === null) return false
  const q = v as Record<string, unknown>
  return (
    typeof q.id === 'number' &&
    typeof q.vistas === 'number' &&
    typeof q.erros === 'number' &&
    typeof q.acertosSeguidos === 'number'
  )
}

export function carregarProgresso(armazem: Armazem | null = armazemPadrao()): Progresso {
  let cru: string | null
  try {
    cru = armazem?.getItem(CHAVE_PROGRESSO) ?? null
  } catch {
    return {}
  }
  if (cru === null) return {}

  let dados: unknown
  try {
    dados = JSON.parse(cru)
  } catch {
    return {}
  }
  if (typeof dados !== 'object' || dados === null || Array.isArray(dados)) return {}

  // Entrada malformada é descartada em vez de derrubar o histórico inteiro.
  const saida: Progresso = {}
  for (const valor of Object.values(dados)) {
    if (ehProgressoQuestao(valor)) saida[valor.id] = valor
  }
  return saida
}

export function salvarProgresso(p: Progresso, armazem: Armazem | null = armazemPadrao()): void {
  try {
    armazem?.setItem(CHAVE_PROGRESSO, JSON.stringify(p))
  } catch {
    // Storage cheio ou bloqueado: perder o progresso é ruim, mas derrubar a tela é pior.
  }
}
