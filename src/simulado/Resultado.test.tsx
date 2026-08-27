import { fireEvent, render, screen } from '@testing-library/react'
import { carregarQuestoes } from '../dados/carregar'
import { prepararQuestao } from '../dados/preparar'
import { Resultado } from './Resultado'
import type { Resultado as DadosResultado } from './simulado'

const banco = carregarQuestoes()

function comErros(acertos: number, quantos: number): DadosResultado {
  const erros = banco.slice(0, quantos).map((q) => {
    const questao = prepararQuestao(q)
    return { questao, marcada: (questao.indiceCorreto + 1) % 4 }
  })
  return { acertos, total: 30, aprovado: acertos >= 24, erros }
}

describe('Resultado (critério 14)', () => {
  it('mostra a nota', () => {
    render(<Resultado resultado={comErros(26, 4)} historico={[]} aoRecomecar={() => {}} />)
    expect(screen.getByTestId('nota').textContent).toContain('26')
    expect(screen.getByTestId('nota').textContent).toContain('30')
  })

  it('diz que passou com 24', () => {
    render(<Resultado resultado={comErros(24, 6)} historico={[]} aoRecomecar={() => {}} />)
    expect(screen.getByTestId('veredito').textContent).toMatch(/passaria|aprovad/i)
  })

  it('diz que não passou com 23', () => {
    render(<Resultado resultado={comErros(23, 7)} historico={[]} aoRecomecar={() => {}} />)
    expect(screen.getByTestId('veredito').textContent).toMatch(/não/i)
  })

  it('lista cada erro com sua resposta, a correta e o comentário', () => {
    const r = comErros(28, 2)
    render(<Resultado resultado={r} historico={[]} aoRecomecar={() => {}} />)
    const revisao = screen.getAllByTestId('erro')
    expect(revisao).toHaveLength(2)

    const primeiro = r.erros[0]!
    expect(revisao[0]!.textContent).toContain(primeiro.questao.enunciado)
    expect(revisao[0]!.textContent).toContain(primeiro.questao.opcoes[primeiro.marcada as number])
    expect(revisao[0]!.textContent).toContain(primeiro.questao.opcoes[primeiro.questao.indiceCorreto])
    expect(revisao[0]!.textContent).toContain(primeiro.questao.comentario)
  })

  it('prova perfeita não lista erros', () => {
    render(<Resultado resultado={comErros(30, 0)} historico={[]} aoRecomecar={() => {}} />)
    expect(screen.queryAllByTestId('erro')).toHaveLength(0)
  })

  it('mostra o histórico das provas anteriores', () => {
    const historico = [
      { em: '2026-08-27T10:00:00Z', acertos: 26, total: 30 },
      { em: '2026-08-20T10:00:00Z', acertos: 19, total: 30 },
    ]
    render(<Resultado resultado={comErros(26, 4)} historico={historico} aoRecomecar={() => {}} />)
    expect(screen.getAllByTestId('prova-anterior')).toHaveLength(2)
  })

  it('permite começar outra prova', () => {
    let chamou = 0
    render(<Resultado resultado={comErros(26, 4)} historico={[]} aoRecomecar={() => chamou++} />)
    fireEvent.click(screen.getByTestId('acao'))
    expect(chamou).toBe(1)
  })
})
