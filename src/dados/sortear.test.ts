import { carregarQuestoes } from './carregar'
import { cotasPorModulo, sortearSimulado } from './sortear'

const questoes = carregarQuestoes()

describe('cotasPorModulo', () => {
  it('distribui 30 vagas como 8/4/13/5 (maior resto)', () => {
    expect([...cotasPorModulo(questoes).values()]).toEqual([8, 4, 13, 5])
  })

  it('as cotas sempre somam o total pedido', () => {
    for (const total of [1, 7, 10, 30, 45, 100]) {
      const soma = [...cotasPorModulo(questoes, total).values()].reduce((a, b) => a + b, 0)
      expect(soma, `total ${total}`).toBe(total)
    }
  })

  it('desempata resto igual pelo número do módulo, de forma determinística', () => {
    // Um banco com os 4 módulos do mesmo tamanho e 3 vagas: todos os restos empatam
    // em 0,75, então as 3 sobras vão para M1, M2 e M3, nessa ordem.
    const base = questoes[0]!
    const equilibrado = [1, 2, 3, 4].map((m) => ({ ...base, modulo: m as 1 | 2 | 3 | 4 }))
    expect([...cotasPorModulo(equilibrado, 3).values()]).toEqual([1, 1, 1, 0])
  })

  it('banco vazio devolve zeros em vez de estourar', () => {
    expect([...cotasPorModulo([]).values()]).toEqual([0, 0, 0, 0])
  })
})

describe('sortearSimulado', () => {
  it('devolve 30 questões', () => {
    expect(sortearSimulado(questoes)).toHaveLength(30)
  })

  it('não repete questão dentro do mesmo simulado', () => {
    const ids = sortearSimulado(questoes).map((q) => q.id)
    expect(new Set(ids).size).toBe(30)
  })

  it('respeita a distribuição por módulo', () => {
    const s = sortearSimulado(questoes)
    expect([1, 2, 3, 4].map((m) => s.filter((q) => q.modulo === m).length)).toEqual([8, 4, 13, 5])
  })

  it('é reprodutível com RNG injetado', () => {
    const rng = () => 0.3
    expect(sortearSimulado(questoes, 30, rng).map((q) => q.id)).toEqual(
      sortearSimulado(questoes, 30, rng).map((q) => q.id),
    )
  })

  it('dois simulados seguidos não são iguais', () => {
    const a = sortearSimulado(questoes).map((q) => q.id)
    const b = sortearSimulado(questoes).map((q) => q.id)
    expect(a).not.toEqual(b)
  })
})
