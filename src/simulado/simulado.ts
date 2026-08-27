import type { Rng } from '../dados/embaralhar'
import { prepararQuestao, type QuestaoPreparada } from '../dados/preparar'
import { sortearSimulado } from '../dados/sortear'
import type { QuestaoFonte } from '../dados/tipos'

export const QUESTOES = 30
export const MINIMO_PARA_PASSAR = 24

export type Simulado = {
  questoes: QuestaoPreparada[]
  /** Índice escolhido por questão; null enquanto não respondida. */
  respostas: (number | null)[]
  atual: number
  finalizado: boolean
}

/** O sorteio e a distribuição por módulo são de `dados`; aqui só se prepara e se embala. */
export function criarSimulado(banco: readonly QuestaoFonte[], rng: Rng = Math.random): Simulado {
  const questoes = sortearSimulado(banco, QUESTOES, rng).map((q) => prepararQuestao(q, rng))
  return {
    questoes,
    respostas: Array(questoes.length).fill(null),
    atual: 0,
    finalizado: false,
  }
}

/** Registra a escolha na questão atual. Trocar é permitido enquanto não avançar. */
export function responder(s: Simulado, indice: number): Simulado {
  if (s.finalizado) return s
  const respostas = [...s.respostas]
  respostas[s.atual] = indice
  return { ...s, respostas }
}

/**
 * Avança uma questão. Exige resposta: terminar com questões em branco por engano
 * produziria uma nota que não mede nada. Na última, não sai — quem encerra é `finalizar`.
 */
export function avancar(s: Simulado): Simulado {
  if (s.finalizado) return s
  if (s.respostas[s.atual] === null) return s
  if (s.atual >= s.questoes.length - 1) return s
  return { ...s, atual: s.atual + 1 }
}

/** `marcada` é null quando a questão ficou sem resposta — que conta como erro. */
export type Erro = { questao: QuestaoPreparada; marcada: number | null }

export type Resultado = {
  acertos: number
  total: number
  aprovado: boolean
  erros: Erro[]
}

/** Só encerra com a última questão respondida. */
export function finalizar(s: Simulado): Simulado {
  if (s.respostas[s.questoes.length - 1] === null) return s
  return { ...s, finalizado: true }
}

/**
 * Recusa prova não finalizada de propósito: o gabarito não pode sair antes da hora
 * nem por engano de quem chama.
 */
export function resultado(s: Simulado): Resultado {
  if (!s.finalizado) throw new Error('resultado exige um simulado finalizado')

  const erros: Erro[] = []
  let acertos = 0
  s.questoes.forEach((questao, i) => {
    const marcada = s.respostas[i] ?? null
    if (marcada === questao.indiceCorreto) acertos++
    else erros.push({ questao, marcada })
  })

  return {
    acertos,
    total: s.questoes.length,
    aprovado: acertos >= MINIMO_PARA_PASSAR,
    erros,
  }
}

/**
 * O que a prova diz sobre cada questão, para quem quiser alimentar a fila de estudo.
 *
 * Este módulo não importa `src/estudo`: o CAPABILITY-MAP diz que `modo-simulado`
 * depende de `dados` e `acervo-placas`, não de `modo-estudo`. Quem compõe os dois é
 * o App, que é a raiz de composição e não um módulo.
 */
export function respostasDaProva(s: Simulado): { id: number; acertou: boolean }[] {
  if (!s.finalizado) throw new Error('respostasDaProva exige um simulado finalizado')
  return s.questoes.map((q, i) => ({ id: q.id, acertou: s.respostas[i] === q.indiceCorreto }))
}
