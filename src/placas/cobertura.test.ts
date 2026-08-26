import { readFileSync, readdirSync } from 'node:fs'
import {
  calcularCobertura,
  codigosNecessarios,
  gerarAcervoTs,
  motivoInvalido,
  type QuestaoComPlaca,
} from './cobertura'
import { PLACAS_DISPONIVEIS } from './acervo'

const fonte = JSON.parse(readFileSync('questoes.json', 'utf8')) as { questoes: QuestaoComPlaca[] }

describe('codigosNecessarios', () => {
  const necessarias = codigosNecessarios(fonte.questoes)

  it('encontra os 69 códigos do SPEC-acervo-placas', () => {
    expect(necessarias).toHaveLength(69)
  })

  it('cobre as 171 questões visuais', () => {
    expect(necessarias.reduce((s, p) => s + p.questoes, 0)).toBe(171)
  })

  it('ordena por frequência, com R-28 na frente', () => {
    expect(necessarias[0]).toEqual({ codigo: 'R-28', questoes: 8 })
    expect(necessarias.map((p) => p.questoes)).toEqual(
      [...necessarias.map((p) => p.questoes)].sort((a, b) => b - a),
    )
  })

  it('ignora duplicatas e questões que não pedem imagem', () => {
    const qs: QuestaoComPlaca[] = [
      { requerImagem: true, codigoPlaca: 'R-1', duplicataDe: null },
      { requerImagem: true, codigoPlaca: 'R-1', duplicataDe: 99 },
      { requerImagem: false, codigoPlaca: 'R-2', duplicataDe: null },
      { requerImagem: true, codigoPlaca: null, duplicataDe: null },
    ]
    expect(codigosNecessarios(qs)).toEqual([{ codigo: 'R-1', questoes: 1 }])
  })
})

describe('calcularCobertura', () => {
  const necessarias = [
    { codigo: 'R-28', questoes: 8 },
    { codigo: 'R-7', questoes: 6 },
  ]

  it('conta questões destravadas, não só placas', () => {
    const c = calcularCobertura(necessarias, ['R-28'])
    expect(c.questoesDestravadas).toBe(8)
    expect(c.questoesTotais).toBe(14)
    expect(c.faltando).toEqual([{ codigo: 'R-7', questoes: 6 }])
  })

  it('acusa asset órfão', () => {
    expect(calcularCobertura(necessarias, ['R-28', 'A-99']).orfaos).toEqual(['A-99'])
  })

  it('não divide por zero com acervo vazio', () => {
    const c = calcularCobertura([], [])
    expect(c.questoesTotais).toBe(0)
    expect(c.questoesDestravadas).toBe(0)
  })
})

describe('motivoInvalido', () => {
  it('aceita SVG de verdade', () => {
    expect(motivoInvalido('R-1', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBeNull()
  })

  it('recusa vazio e não-SVG', () => {
    expect(motivoInvalido('R-1', '   ')).toMatch(/vazio/)
    expect(motivoInvalido('R-1', '<html></html>')).toMatch(/<svg/)
  })
})

describe('acervo gerado', () => {
  it('PLACAS_DISPONIVEIS é idêntico aos arquivos em disco (SPEC-acervo critério 4)', () => {
    const emDisco = readdirSync('public/placas')
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.slice(0, -'.svg'.length))
    expect([...PLACAS_DISPONIVEIS].sort()).toEqual([...emDisco].sort())
  })

  it('gera um Set ordenado e um temPlaca', () => {
    const ts = gerarAcervoTs(['R-7', 'R-28'])
    expect(ts.indexOf("'R-28'")).toBeLessThan(ts.indexOf("'R-7'"))
    expect(ts).toContain('export function temPlaca')
  })
})
