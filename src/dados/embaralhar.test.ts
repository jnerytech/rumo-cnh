import { embaralhar } from './embaralhar'

describe('embaralhar', () => {
  it('preserva os elementos, sem perder nem inventar', () => {
    const entrada = ['a', 'b', 'c', 'd']
    expect([...embaralhar(entrada)].sort()).toEqual(['a', 'b', 'c', 'd'])
  })

  it('não muta a entrada', () => {
    const entrada = ['a', 'b', 'c', 'd']
    embaralhar(entrada)
    expect(entrada).toEqual(['a', 'b', 'c', 'd'])
  })

  it('é reprodutível com RNG injetado', () => {
    const rngFixo = () => 0.42
    expect(embaralhar([1, 2, 3, 4], rngFixo)).toEqual(embaralhar([1, 2, 3, 4], rngFixo))
  })

  it('aguenta lista vazia e de um elemento', () => {
    expect(embaralhar([])).toEqual([])
    expect(embaralhar(['só'])).toEqual(['só'])
  })
})
