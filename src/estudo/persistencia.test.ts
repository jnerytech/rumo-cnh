import {
  CHAVE_PROGRESSO,
  carregarProgresso,
  salvarProgresso,
  zerarProgresso,
  type Armazem,
} from './persistencia'
import type { Progresso } from './fila'

const armazemFalso = (inicial: Record<string, string> = {}): Armazem => {
  const dados = { ...inicial }
  return {
    getItem: (k) => dados[k] ?? null,
    setItem: (k, v) => {
      dados[k] = v
    },
    removeItem: (k) => {
      delete dados[k]
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
  removeItem: () => {
    throw new DOMException('acesso negado')
  },
})

const progresso: Progresso = { 7: { id: 7, vistas: 3, erros: 1, acertosSeguidos: 2 } }

describe('carregarProgresso (critério 8)', () => {
  it('devolve vazio quando não há nada guardado', () => {
    expect(carregarProgresso(armazemFalso())).toEqual({})
  })

  it('devolve vazio com JSON inválido, sem lançar', () => {
    expect(carregarProgresso(armazemFalso({ [CHAVE_PROGRESSO]: '{isso não é json' }))).toEqual({})
  })

  it('devolve vazio quando o próprio acesso lança (aba privada, storage bloqueado)', () => {
    expect(carregarProgresso(armazemQueLanca())).toEqual({})
  })

  it('devolve vazio com JSON válido de formato errado', () => {
    expect(carregarProgresso(armazemFalso({ [CHAVE_PROGRESSO]: '"texto"' }))).toEqual({})
    expect(carregarProgresso(armazemFalso({ [CHAVE_PROGRESSO]: '[1,2,3]' }))).toEqual({})
  })

  it('descarta entrada malformada e mantém as boas', () => {
    const cru = JSON.stringify({ 7: progresso[7], 9: { id: 9, vistas: 'muitas' } })
    expect(carregarProgresso(armazemFalso({ [CHAVE_PROGRESSO]: cru }))).toEqual(progresso)
  })

  it('devolve vazio quando não há storage nenhum', () => {
    expect(carregarProgresso(null)).toEqual({})
  })
})

describe('zerarProgresso', () => {
  it('apaga o progresso guardado', () => {
    const armazem = armazemFalso()
    salvarProgresso(progresso, armazem)
    zerarProgresso(armazem)
    expect(carregarProgresso(armazem)).toEqual({})
  })

  it('não lança sem storage nem quando o storage recusa', () => {
    expect(() => zerarProgresso(null)).not.toThrow()
    expect(() => zerarProgresso(armazemQueLanca())).not.toThrow()
  })
})

describe('salvarProgresso', () => {
  it('sobrevive a ida e volta (critério 9)', () => {
    const armazem = armazemFalso()
    salvarProgresso(progresso, armazem)
    expect(carregarProgresso(armazem)).toEqual(progresso)
  })

  it('usa chave versionada, para formato novo não explodir em cima de dado velho', () => {
    expect(CHAVE_PROGRESSO).toBe('rumo-cnh:progresso:v1')
  })

  it('não lança quando o storage recusa a escrita', () => {
    expect(() => salvarProgresso(progresso, armazemQueLanca())).not.toThrow()
    expect(() => salvarProgresso(progresso, null)).not.toThrow()
  })
})
