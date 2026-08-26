import { carregarQuestoes } from './carregar'
import { prepararQuestao } from './preparar'

const questoes = carregarQuestoes()

describe('prepararQuestao', () => {
  it('aponta para a alternativa correta em todas as 1496 questões', () => {
    const erradas = questoes.filter((q) => {
      const p = prepararQuestao(q)
      return p.opcoes[p.indiceCorreto] !== q.alternativas[q.respostaCorreta]
    })
    expect(erradas).toEqual([])
  })

  it('opcoes é permutação exata das alternativas', () => {
    const erradas = questoes.filter((q) => {
      const p = prepararQuestao(q)
      return JSON.stringify([...p.opcoes].sort()) !== JSON.stringify([...q.alternativas].sort())
    })
    expect(erradas).toEqual([])
  })

  it('não expõe alternativas nem respostaCorreta — a UI não pode ver a ordem da fonte', () => {
    const p = prepararQuestao(questoes[0]!)
    expect(p).not.toHaveProperty('alternativas')
    expect(p).not.toHaveProperty('respostaCorreta')
    expect(p).not.toHaveProperty('duplicataDe')
  })

  it('é reprodutível com RNG injetado', () => {
    const rng = () => 0.7
    expect(prepararQuestao(questoes[0]!, rng)).toEqual(prepararQuestao(questoes[0]!, rng))
  })

  it('acusa respostaCorreta fora do intervalo em vez de mentir', () => {
    expect(() => prepararQuestao({ ...questoes[0]!, respostaCorreta: 9 })).toThrow(/fora das/)
  })

  /**
   * O teste que justifica Fisher–Yates. Trocar por `sort(() => Math.random() - 0.5)`
   * derruba este teste — verificado à mão na tarefa A3b.
   */
  it('distribui a correta uniformemente: 25% ± 2 p.p. em cada posição', () => {
    const RODADAS = 10_000
    const contagem = [0, 0, 0, 0]
    const q = questoes[0]!
    for (let i = 0; i < RODADAS; i++) {
      const { indiceCorreto } = prepararQuestao(q)
      contagem[indiceCorreto] = (contagem[indiceCorreto] ?? 0) + 1
    }
    for (const [posicao, n] of contagem.entries()) {
      const pct = (n / RODADAS) * 100
      expect(pct, `posição ${posicao} ficou em ${pct.toFixed(1)}%`).toBeGreaterThan(23)
      expect(pct, `posição ${posicao} ficou em ${pct.toFixed(1)}%`).toBeLessThan(27)
    }
  })
})
