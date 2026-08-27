import { readFileSync } from 'node:fs'
import {
  CHAVE_HISTORICO,
  carregarHistorico,
  registrarProva,
  type Armazem,
  type Prova,
} from './historico'

const armazemFalso = (inicial: Record<string, string> = {}): Armazem => {
  const dados = { ...inicial }
  return {
    getItem: (k) => dados[k] ?? null,
    setItem: (k, v) => {
      dados[k] = v
    },
  }
}
const armazemQueLanca = (): Armazem => ({
  getItem: () => {
    throw new DOMException('acesso negado')
  },
  setItem: () => {
    throw new DOMException('cota excedida')
  },
})

const prova = (em: string, acertos: number): Prova => ({ em, acertos, total: 30 })

describe('carregarHistorico (critério 12)', () => {
  it('devolve lista vazia quando não há nada', () => {
    expect(carregarHistorico(armazemFalso())).toEqual([])
  })

  it('devolve lista vazia com JSON inválido, sem lançar', () => {
    expect(carregarHistorico(armazemFalso({ [CHAVE_HISTORICO]: 'nada disso' }))).toEqual([])
  })

  it('devolve lista vazia quando o acesso lança', () => {
    expect(carregarHistorico(armazemQueLanca())).toEqual([])
  })

  it('devolve lista vazia sem storage nenhum', () => {
    expect(carregarHistorico(null)).toEqual([])
  })

  it('devolve lista vazia se o guardado não for lista', () => {
    expect(carregarHistorico(armazemFalso({ [CHAVE_HISTORICO]: '{"a":1}' }))).toEqual([])
  })

  it('descarta prova malformada e mantém as boas', () => {
    const cru = JSON.stringify([prova('2026-08-27T10:00:00Z', 25), { acertos: 'muitos' }])
    expect(carregarHistorico(armazemFalso({ [CHAVE_HISTORICO]: cru }))).toEqual([
      prova('2026-08-27T10:00:00Z', 25),
    ])
  })
})

describe('registrarProva', () => {
  it('usa chave versionada', () => {
    expect(CHAVE_HISTORICO).toBe('rumo-cnh:simulados:v1')
  })

  it('sobrevive à ida e volta', () => {
    const armazem = armazemFalso()
    registrarProva(prova('2026-08-27T10:00:00Z', 26), armazem)
    expect(carregarHistorico(armazem)).toEqual([prova('2026-08-27T10:00:00Z', 26)])
  })

  it('guarda a mais recente primeiro — é a que interessa na tela', () => {
    const armazem = armazemFalso()
    registrarProva(prova('2026-08-20T10:00:00Z', 19), armazem)
    registrarProva(prova('2026-08-27T10:00:00Z', 26), armazem)
    expect(carregarHistorico(armazem).map((p) => p.acertos)).toEqual([26, 19])
  })

  it('não lança quando a escrita é recusada', () => {
    expect(() => registrarProva(prova('2026-08-27T10:00:00Z', 26), armazemQueLanca())).not.toThrow()
    expect(() => registrarProva(prova('2026-08-27T10:00:00Z', 26), null)).not.toThrow()
  })

  it('não tem relógio interno: o instante chega de fora', () => {
    const fonte = readFileSync('src/simulado/historico.ts', 'utf8')
    expect(fonte).not.toMatch(/new Date|Date\.now/)
  })
})
