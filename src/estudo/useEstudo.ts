import { useCallback, useMemo, useRef, useState } from 'react'
import { carregarQuestoes } from '../dados/carregar'
import { filtrar, type Filtro } from '../dados/filtrar'
import { prepararQuestao, type QuestaoPreparada } from '../dados/preparar'
import { temPlaca } from '../placas/acervo'
import { estaPendente, proximaQuestao, registrarResposta, type Progresso } from './fila'
import { carregarProgresso, salvarProgresso } from './persistencia'

/** Um pouco acima de DISTANCIA_MINIMA, que é o quanto proximaQuestao chega a consultar. */
const JANELA_RECENTES = 10

export type Contadores = { total: number; ineditas: number; pendentes: number }

export type Estudo = {
  questao: QuestaoPreparada | null
  /** Índice escolhido em `questao.opcoes`, ou null enquanto não respondeu. */
  escolha: number | null
  responder: (indice: number) => void
  avancar: () => void
  contadores: Contadores
}

/** Filtro sem `temPlaca`: quem injeta o acervo é este hook, não quem chama. */
export type FiltroEstudo = Omit<Filtro, 'temPlaca'>

export function useEstudo(filtro: FiltroEstudo): Estudo {
  const candidatas = useMemo(
    () => filtrar(carregarQuestoes(), { ...filtro, temPlaca }),
    // Comparado por valor: o filtro chega como objeto literal e mudaria de
    // identidade a cada render, refazendo o trabalho à toa.
    [JSON.stringify(filtro)],
  )

  const [progresso, setProgresso] = useState<Progresso>(carregarProgresso)
  const [escolha, setEscolha] = useState<number | null>(null)
  const recentes = useRef<number[]>([])

  const sortear = useCallback(
    (p: Progresso) => {
      const proxima = proximaQuestao(p, candidatas, recentes.current)
      return proxima ? prepararQuestao(proxima) : null
    },
    [candidatas],
  )

  const [questao, setQuestao] = useState<QuestaoPreparada | null>(() => sortear(progresso))

  const responder = useCallback(
    (indice: number) => {
      if (questao === null || escolha !== null) return
      setEscolha(indice)
      const atualizado = registrarResposta(progresso, questao.id, indice === questao.indiceCorreto)
      setProgresso(atualizado)
      salvarProgresso(atualizado)
      // Só os primeiros DISTANCIA_MINIMA são consultados; guardar o resto é vazamento.
      recentes.current = [questao.id, ...recentes.current].slice(0, JANELA_RECENTES)
    },
    [escolha, progresso, questao],
  )

  const avancar = useCallback(() => {
    if (escolha === null) return
    setEscolha(null)
    setQuestao(sortear(progresso))
  }, [escolha, progresso, sortear])

  const contadores = useMemo<Contadores>(
    () => ({
      total: candidatas.length,
      ineditas: candidatas.filter((q) => (progresso[q.id]?.vistas ?? 0) === 0).length,
      pendentes: candidatas.filter((q) => estaPendente(progresso[q.id])).length,
    }),
    [candidatas, progresso],
  )

  return { questao, escolha, responder, avancar, contadores }
}
