import type { Dificuldade, Modulo, Parte, QuestaoFonte } from './tipos'

export type Filtro = {
  modulos?: Modulo[]
  dificuldades?: Dificuldade[]
  parte?: Parte
  /**
   * Predicado injetado, não import. `dados` não conhece o acervo de placas — quem
   * conhece é o chamador. Mantém a direção de dependência do CAPABILITY-MAP.
   */
  temPlaca?: (codigo: string) => boolean
}

/** Filtros combinam por AND. Filtro vazio devolve tudo. */
export function filtrar(questoes: readonly QuestaoFonte[], f: Filtro): QuestaoFonte[] {
  return questoes.filter((q) => {
    if (f.modulos && !f.modulos.includes(q.modulo)) return false
    if (f.dificuldades && !f.dificuldades.includes(q.dificuldade)) return false
    if (f.parte !== undefined && q.parte !== f.parte) return false
    if (f.temPlaca && q.requerImagem) {
      // Questão que pede imagem sem código de placa é irrespondível: some junto.
      if (q.codigoPlaca === null || !f.temPlaca(q.codigoPlaca)) return false
    }
    return true
  })
}
