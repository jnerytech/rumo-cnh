import { carregarQuestoes } from './carregar'
import { filtrar } from './filtrar'

const questoes = carregarQuestoes()

describe('filtrar', () => {
  it('filtro vazio devolve tudo', () => {
    expect(filtrar(questoes, {})).toHaveLength(1496)
  })

  it('filtra por módulo', () => {
    expect(filtrar(questoes, { modulos: [1] })).toHaveLength(412)
    expect(filtrar(questoes, { modulos: [3] })).toHaveLength(619)
  })

  it('filtra por dificuldade', () => {
    expect(filtrar(questoes, { dificuldades: ['Difícil'] })).toHaveLength(224)
  })

  it('filtra por parte', () => {
    expect(filtrar(questoes, { parte: 2 })).toHaveLength(158)
  })

  it('combina filtros por AND', () => {
    const r = filtrar(questoes, { modulos: [1], dificuldades: ['Difícil'] })
    expect(r.every((q) => q.modulo === 1 && q.dificuldade === 'Difícil')).toBe(true)
    expect(r.length).toBeLessThan(224)
  })

  it('temPlaca sempre-falso remove as 171 que precisam de imagem, e só elas', () => {
    expect(filtrar(questoes, { temPlaca: () => false })).toHaveLength(1325)
  })

  it('temPlaca sempre-verdadeiro não remove nada', () => {
    expect(filtrar(questoes, { temPlaca: () => true })).toHaveLength(1496)
  })

  it('remove questão que pede imagem mas não tem código de placa', () => {
    const orfa = { ...questoes[0]!, requerImagem: true, codigoPlaca: null }
    expect(filtrar([orfa], { temPlaca: () => true })).toEqual([])
  })

  it('temPlaca decide pelo código, não pela questão', () => {
    const r = filtrar(questoes, { temPlaca: (c) => c === 'R-28' })
    expect(r.filter((q) => q.requerImagem).every((q) => q.codigoPlaca === 'R-28')).toBe(true)
    expect(r).toHaveLength(1325 + 8)
  })
})
