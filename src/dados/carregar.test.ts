import { carregarQuestoes } from './carregar'

describe('carregarQuestoes', () => {
  const questoes = carregarQuestoes()

  it('retorna 1496 questões — as 1500 da fonte menos as 4 duplicatas', () => {
    expect(questoes).toHaveLength(1496)
  })

  it('não devolve nenhuma duplicata', () => {
    expect(questoes.filter((q) => q.duplicataDe !== null)).toEqual([])
  })

  it('toda questão tem 4 alternativas não vazias', () => {
    const quebradas = questoes.filter(
      (q) => q.alternativas.length !== 4 || q.alternativas.some((a) => a.trim() === ''),
    )
    expect(quebradas).toEqual([])
  })

  it('toda questão tem enunciado e comentário', () => {
    const quebradas = questoes.filter(
      (q) => q.enunciado.trim() === '' || q.comentario.trim() === '',
    )
    expect(quebradas).toEqual([])
  })

  it('respostaCorreta é sempre 0 na fonte — a premissa que torna o embaralhamento obrigatório', () => {
    expect(questoes.every((q) => q.respostaCorreta === 0)).toBe(true)
  })

  it('todo módulo e parte estão dentro do domínio declarado', () => {
    expect(questoes.every((q) => [1, 2, 3, 4].includes(q.modulo))).toBe(true)
    expect(questoes.every((q) => [1, 2].includes(q.parte))).toBe(true)
  })
})
