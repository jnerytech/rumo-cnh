import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { carregarQuestoes } from '../dados/carregar'
import { filtrar, type Filtro } from '../dados/filtrar'
import { prepararQuestao, type QuestaoPreparada } from '../dados/preparar'
import { temPlaca } from '../placas/acervo'
import { estaPendente, proximaQuestao, registrarResposta, type Progresso } from './fila'
import { carregarProgresso, salvarProgresso } from './persistencia'

/** Um pouco acima de DISTANCIA_MINIMA, que é o quanto proximaQuestao chega a consultar. */
const JANELA_RECENTES = 10

/**
 * Os três somam `total`, sempre: cada questão está em exatamente um estado.
 *
 * A primeira versão contava como "aprendida" só quem tivesse dois acertos
 * seguidos. Era métrica morta: a fila só devolve questão que você ERROU, então
 * quem acertou de primeira nunca ganhava o segundo acerto e ficava fora das três
 * contagens — os contadores não fechavam o total.
 */
export type Contadores = {
  total: number
  /** Respondida e fora da revisão: acertou de primeira, ou já recuperou o erro. */
  aprendidas: number
  /** Errou e ainda não recuperou (precisa de dois acertos seguidos). */
  pendentes: number
  /** Nunca vista. */
  ineditas: number
}

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
  // Espelho do progresso para o efeito de troca de filtro não depender dele:
  // se dependesse, sortearia uma questão nova a cada resposta.
  const progressoAtual = useRef(progresso)

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
      progressoAtual.current = atualizado
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

  // Trocar o filtro muda `candidatas`, e a questão na tela pode não pertencer mais
  // ao novo recorte. `sortear` só muda de identidade quando `candidatas` muda.
  const primeiraMontagem = useRef(true)
  useEffect(() => {
    if (primeiraMontagem.current) {
      primeiraMontagem.current = false
      return
    }
    recentes.current = []
    setEscolha(null)
    setQuestao(sortear(progressoAtual.current))
  }, [sortear])

  const contadores = useMemo<Contadores>(() => {
    let aprendidas = 0
    let pendentes = 0
    let ineditas = 0
    for (const q of candidatas) {
      const p = progresso[q.id]
      if ((p?.vistas ?? 0) === 0) ineditas++
      else if (estaPendente(p)) pendentes++
      else aprendidas++
    }
    return { total: candidatas.length, aprendidas, pendentes, ineditas }
  }, [candidatas, progresso])

  return { questao, escolha, responder, avancar, contadores }
}
