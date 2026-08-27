import type { QuestaoFonte } from '../dados/tipos'
import {
  ACERTOS_PARA_DOMINAR,
  DISTANCIA_MINIMA,
  estaDominada,
  proximaQuestao,
  registrarResposta,
  type Progresso,
} from './fila'

/** Questão mínima: a fila só olha `id`. */
const q = (id: number) => ({ id }) as QuestaoFonte
const banco = (n: number) => Array.from({ length: n }, (_, i) => q(i + 1))

/** Responde uma sequência de (id, acertou) e devolve o progresso final. */
const responder = (pares: [number, boolean][]): Progresso =>
  pares.reduce((p, [id, acertou]) => registrarResposta(p, id, acertou), {} as Progresso)

describe('registrarResposta', () => {
  it('conta a primeira visita de uma questão inédita', () => {
    expect(registrarResposta({}, 7, true)[7]).toEqual({
      id: 7,
      vistas: 1,
      erros: 0,
      acertosSeguidos: 1,
    })
  })

  it('acumula erros e zera acertos seguidos ao errar', () => {
    const p = responder([
      [7, true],
      [7, false],
    ])
    expect(p[7]).toEqual({ id: 7, vistas: 2, erros: 1, acertosSeguidos: 0 })
  })

  it('é pura: não muta o progresso recebido (critério 7)', () => {
    const antes: Progresso = { 7: { id: 7, vistas: 1, erros: 0, acertosSeguidos: 1 } }
    const copia = structuredClone(antes)
    registrarResposta(antes, 7, false)
    expect(antes).toEqual(copia)
  })
})

describe('estaDominada', () => {
  it('exige dois acertos seguidos', () => {
    expect(estaDominada(undefined)).toBe(false)
    expect(estaDominada({ id: 1, vistas: 1, erros: 0, acertosSeguidos: 1 })).toBe(false)
    expect(estaDominada({ id: 1, vistas: 2, erros: 1, acertosSeguidos: 2 })).toBe(true)
    expect(ACERTOS_PARA_DOMINAR).toBe(2)
  })
})

describe('proximaQuestao — prioridade', () => {
  const candidatas = banco(20)

  it('prioriza pendente sobre inédita', () => {
    const p = responder([[3, false]])
    // 3 errou; com 5 respostas depois dela, volta a ser elegível
    const recentes = [9, 8, 7, 6, 5]
    expect(proximaQuestao(p, candidatas, recentes)?.id).toBe(3)
  })

  it('um acerto NÃO tira da fila de pendentes (critério 2)', () => {
    const p = responder([
      [3, false],
      [3, true],
    ])
    expect(proximaQuestao(p, candidatas, [9, 8, 7, 6, 5])?.id).toBe(3)
  })

  it('dois acertos seguidos tiram da fila (critério 3)', () => {
    const p = responder([
      [3, false],
      [3, true],
      [3, true],
    ])
    expect(proximaQuestao(p, candidatas, [9, 8, 7, 6, 5])?.id).not.toBe(3)
  })

  it('errar depois de acertar zera a conta (critério 4)', () => {
    const p = responder([
      [3, false],
      [3, true],
      [3, true],
      [3, false],
    ])
    expect(proximaQuestao(p, candidatas, [9, 8, 7, 6, 5])?.id).toBe(3)
  })

  it('devolve inédita quando não há pendente', () => {
    const p = responder([[1, true]])
    expect(proximaQuestao(p, candidatas, [1])?.id).toBe(2)
  })

  it('sem inédita nem pendente, devolve a dominada menos vista (critério 6)', () => {
    const tres = banco(3)
    let p: Progresso = {}
    for (const id of [1, 2, 3]) {
      p = registrarResposta(p, id, true)
      p = registrarResposta(p, id, true)
    }
    p = registrarResposta(p, 1, true) // 1 passa a ser a mais vista
    p = registrarResposta(p, 2, true)
    expect(proximaQuestao(p, tres, [])?.id).toBe(3)
  })

  it('entre pendentes empatadas em vistas, escolhe o menor id', () => {
    const p = responder([
      [8, false],
      [4, false],
    ])
    expect(proximaQuestao(p, candidatas, [19, 18, 17, 16, 15])?.id).toBe(4)
  })

  it('entre pendentes, prioriza a menos vista', () => {
    const p = responder([
      [4, false],
      [4, true],
      [8, false],
    ])
    expect(proximaQuestao(p, candidatas, [19, 18, 17, 16, 15])?.id).toBe(8)
  })

  it('devolve null sem candidatas (critério 6)', () => {
    expect(proximaQuestao({}, [], [])).toBeNull()
  })
})

describe('proximaQuestao — distância mínima', () => {
  it('nunca devolve id dentro da distância mínima (critério 5)', () => {
    const candidatas = banco(20)
    const p = responder([[3, false]])
    // 3 é a única pendente, mas acabou de ser respondida: cai para inédita
    expect(proximaQuestao(p, candidatas, [3])?.id).not.toBe(3)
    expect(DISTANCIA_MINIMA).toBe(5)
  })

  it('respeita a distância mesmo com muitas pendentes', () => {
    const candidatas = banco(20)
    const p = responder([
      [1, false],
      [2, false],
      [3, false],
    ])
    const escolhida = proximaQuestao(p, candidatas, [3, 2, 1])
    expect([1, 2, 3]).not.toContain(escolhida?.id)
  })

  it('com menos candidatas que a distância, não trava em null (critério 6b)', () => {
    for (const n of [1, 3, 5]) {
      const candidatas = banco(n)
      const recentes = candidatas.map((c) => c.id).reverse()
      const escolhida = proximaQuestao({}, candidatas, recentes)
      expect(escolhida, `com ${n} candidatas`).not.toBeNull()
    }
  })

  it('com 1 candidata, ela repete — não existe outra coisa para mostrar (critério 6b)', () => {
    const uma = banco(1)
    expect(proximaQuestao(responder([[1, false]]), uma, [1])?.id).toBe(1)
  })
})

describe('proximaQuestao — sessão de verdade', () => {
  it('questão errada reaparece dentro de 10, e nunca como a próxima (critério 1)', () => {
    const candidatas = banco(50)
    let p = registrarResposta({}, 42, false)
    const recentes = [42]
    const vistas: number[] = []
    for (let i = 0; i < 10; i++) {
      const proxima = proximaQuestao(p, candidatas, recentes)
      expect(proxima, `passo ${i}`).not.toBeNull()
      const id = proxima!.id
      vistas.push(id)
      if (i === 0) expect(id, 'não pode ser a próxima imediata').not.toBe(42)
      p = registrarResposta(p, id, true)
      recentes.unshift(id)
    }
    expect(vistas).toContain(42)
  })
})
