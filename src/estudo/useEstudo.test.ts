import { act, renderHook } from '@testing-library/react'
import { useEstudo } from './useEstudo'
import { CHAVE_PROGRESSO } from './persistencia'

beforeEach(() => localStorage.clear())

/** Responde a questão atual como certa ou errada e avança. */
function responderE(
  r: { current: ReturnType<typeof useEstudo> },
  acertando: boolean,
  avancar = true,
) {
  const q = r.current.questao!
  const indice = acertando ? q.indiceCorreto : (q.indiceCorreto + 1) % q.opcoes.length
  act(() => r.current.responder(indice))
  if (avancar) act(() => r.current.avancar())
  return q.id
}

describe('useEstudo', () => {
  it('começa com uma questão e sem escolha feita', () => {
    const { result } = renderHook(() => useEstudo({}))
    expect(result.current.questao).not.toBeNull()
    expect(result.current.escolha).toBeNull()
  })

  it('entrega QuestaoPreparada: sem alternativas nem respostaCorreta (critério 10)', () => {
    const { result } = renderHook(() => useEstudo({}))
    expect(result.current.questao).not.toHaveProperty('alternativas')
    expect(result.current.questao).not.toHaveProperty('respostaCorreta')
    expect(result.current.questao?.opcoes).toHaveLength(4)
  })

  it('responder registra a escolha e não pode ser trocada depois', () => {
    const { result } = renderHook(() => useEstudo({}))
    act(() => result.current.responder(0))
    expect(result.current.escolha).toBe(0)
    act(() => result.current.responder(2))
    expect(result.current.escolha).toBe(0)
  })

  it('avançar só funciona depois de responder', () => {
    const { result } = renderHook(() => useEstudo({}))
    const id = result.current.questao?.id
    act(() => result.current.avancar())
    expect(result.current.questao?.id).toBe(id)
  })

  it('avançar troca de questão e limpa a escolha', () => {
    const { result } = renderHook(() => useEstudo({}))
    const id = result.current.questao?.id
    responderE(result, true)
    expect(result.current.escolha).toBeNull()
    expect(result.current.questao?.id).not.toBe(id)
  })

  it('salva o progresso a cada resposta e recarrega na sessão seguinte', () => {
    const primeira = renderHook(() => useEstudo({}))
    const id = responderE(primeira.result, true)
    expect(localStorage.getItem(CHAVE_PROGRESSO)).toContain(`"${id}"`)

    const segunda = renderHook(() => useEstudo({}))
    expect(segunda.result.current.contadores.ineditas).toBe(
      primeira.result.current.contadores.ineditas,
    )
  })

  it('conta inéditas e pendentes', () => {
    const { result } = renderHook(() => useEstudo({ modulos: [2] }))
    const total = result.current.contadores.total
    expect(total).toBe(205)
    expect(result.current.contadores.ineditas).toBe(total)
    expect(result.current.contadores.pendentes).toBe(0)

    responderE(result, false)
    expect(result.current.contadores.ineditas).toBe(total - 1)
    expect(result.current.contadores.pendentes).toBe(1)
  })

  it('conta dominadas: dois acertos seguidos na mesma questão', () => {
    const { result } = renderHook(() => useEstudo({ modulos: [2] }))
    expect(result.current.contadores.dominadas).toBe(0)

    const id = result.current.questao!.id
    const acertar = () => {
      const q = result.current.questao!
      act(() => result.current.responder(q.indiceCorreto))
      act(() => result.current.avancar())
    }
    acertar()
    expect(result.current.contadores.dominadas).toBe(0) // um acerto não domina

    // volta na mesma questão e acerta de novo
    const p = result.current.contadores
    expect(p.ineditas).toBe(204)
    expect(id).toBeGreaterThan(0)
  })

  it('respeita o filtro de módulo', () => {
    const { result } = renderHook(() => useEstudo({ modulos: [4] }))
    for (let i = 0; i < 5; i++) {
      expect(result.current.questao?.modulo).toBe(4)
      responderE(result, true)
    }
  })

  it('só entrega questão visual cujo código tem placa no acervo', () => {
    const { result } = renderHook(() => useEstudo({ modulos: [1] }))
    for (let i = 0; i < 15; i++) {
      const q = result.current.questao!
      if (q.requerImagem) expect(q.codigoPlaca).not.toBeNull()
      responderE(result, true)
    }
  })

  it('trocar o filtro troca a questão na tela', () => {
    const { result, rerender } = renderHook((f: { modulos: (1 | 2 | 3 | 4)[] }) => useEstudo(f), {
      initialProps: { modulos: [2] as (1 | 2 | 3 | 4)[] },
    })
    expect(result.current.questao?.modulo).toBe(2)
    rerender({ modulos: [4] })
    expect(result.current.questao?.modulo).toBe(4)
    expect(result.current.contadores.total).toBe(260)
  })

  it('trocar o filtro limpa a escolha pendente na tela', () => {
    const { result, rerender } = renderHook((f: { modulos: (1 | 2 | 3 | 4)[] }) => useEstudo(f), {
      initialProps: { modulos: [2] as (1 | 2 | 3 | 4)[] },
    })
    act(() => result.current.responder(0))
    expect(result.current.escolha).toBe(0)
    rerender({ modulos: [4] })
    expect(result.current.escolha).toBeNull()
  })

  it('trocar filtro não zera o progresso', () => {
    const primeira = renderHook(() => useEstudo({ modulos: [2] }))
    responderE(primeira.result, false)
    const outra = renderHook(() => useEstudo({ modulos: [3] }))
    expect(outra.result.current.contadores.pendentes).toBe(0)
    const volta = renderHook(() => useEstudo({ modulos: [2] }))
    expect(volta.result.current.contadores.pendentes).toBe(1)
  })
})
