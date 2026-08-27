import { fireEvent } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useAtalhos } from './useAtalhos'

function montar() {
  const respostas: number[] = []
  let avancos = 0
  renderHook(() =>
    useAtalhos({ responder: (i) => respostas.push(i), avancar: () => avancos++ }),
  )
  return { respostas, avancos: () => avancos }
}

describe('useAtalhos', () => {
  it('teclas 1 a 4 respondem os índices 0 a 3', () => {
    const { respostas } = montar()
    for (const t of ['1', '2', '3', '4']) fireEvent.keyDown(window, { key: t })
    expect(respostas).toEqual([0, 1, 2, 3])
  })

  it('letras A a D respondem os mesmos índices — o rótulo na tela é A–D', () => {
    const { respostas } = montar()
    for (const t of ['a', 'b', 'c', 'd']) fireEvent.keyDown(window, { key: t })
    expect(respostas).toEqual([0, 1, 2, 3])
  })

  it('aceita maiúsculas', () => {
    const { respostas } = montar()
    fireEvent.keyDown(window, { key: 'C' })
    expect(respostas).toEqual([2])
  })

  it('Enter e espaço avançam', () => {
    const m = montar()
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(m.avancos()).toBe(2)
  })

  it('ignora quando o foco está num select, para não brigar com o filtro', () => {
    const { respostas } = montar()
    const select = document.createElement('select')
    document.body.append(select)
    fireEvent.keyDown(select, { key: '2' })
    expect(respostas).toEqual([])
    select.remove()
  })

  it('não avança quando o alvo é o próprio botão de avançar — ele já faz isso sozinho', () => {
    const m = montar()
    const botao = document.createElement('button')
    botao.setAttribute('data-avanca', '')
    document.body.append(botao)
    fireEvent.keyDown(botao, { key: 'Enter' })
    expect(m.avancos()).toBe(0)
    botao.remove()
  })

  it('avança com o foco em OUTRO botão — trocar de modo não pode engolir o Enter', () => {
    const m = montar()
    const outro = document.createElement('button')
    document.body.append(outro)
    fireEvent.keyDown(outro, { key: 'Enter' })
    expect(m.avancos()).toBe(1)
    outro.remove()
  })

  it('teclas fora do conjunto não fazem nada', () => {
    const m = montar()
    for (const t of ['5', 'z', 'Escape', 'ArrowDown']) fireEvent.keyDown(window, { key: t })
    expect(m.respostas).toEqual([])
    expect(m.avancos()).toBe(0)
  })
})
