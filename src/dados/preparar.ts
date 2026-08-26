import { embaralhar, type Rng } from './embaralhar'
import type { QuestaoFonte } from './tipos'

/**
 * Questão pronta para a tela. Não tem `alternativas` nem `respostaCorreta`: a UI
 * não consegue renderizar na ordem da fonte porque os campos não chegam até ela.
 */
export type QuestaoPreparada = Omit<
  QuestaoFonte,
  'alternativas' | 'respostaCorreta' | 'duplicataDe'
> & {
  opcoes: string[]
  indiceCorreto: number
}

/**
 * Embaralha índices, não textos: o índice correto sai da própria permutação, sem
 * depender de os textos das alternativas serem distintos entre si.
 */
export function prepararQuestao(q: QuestaoFonte, rng: Rng = Math.random): QuestaoPreparada {
  const ordem = embaralhar(
    q.alternativas.map((_, i) => i),
    rng,
  )
  const indiceCorreto = ordem.indexOf(q.respostaCorreta)
  if (indiceCorreto === -1) {
    throw new Error(`questão ${q.id}: respostaCorreta ${q.respostaCorreta} fora das alternativas`)
  }
  return {
    id: q.id,
    parte: q.parte,
    parteNome: q.parteNome,
    modulo: q.modulo,
    moduloNome: q.moduloNome,
    numeroNoModulo: q.numeroNoModulo,
    dificuldade: q.dificuldade,
    enunciado: q.enunciado,
    codigoPlaca: q.codigoPlaca,
    requerImagem: q.requerImagem,
    comentario: q.comentario,
    opcoes: ordem.map((i) => q.alternativas[i] as string),
    indiceCorreto,
  }
}
