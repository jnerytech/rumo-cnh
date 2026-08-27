import { fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import { CHAVE_PROGRESSO, carregarProgresso } from './estudo/persistencia'
import { estaPendente } from './estudo/fila'
import { CHAVE_HISTORICO, carregarHistorico } from './simulado/historico'
import { QUESTOES } from './simulado/simulado'

beforeEach(() => localStorage.clear())

const opcoes = () => screen.getAllByRole('button', { name: /^[A-D]\./ })

/** Faz a prova inteira errando de propósito, para as 30 caírem na revisão. */
function fazerProvaErrando() {
  for (let i = 0; i < QUESTOES; i++) {
    fireEvent.click(opcoes()[0]!)
    fireEvent.click(screen.getByTestId('acao'))
  }
}

describe('App — navegação entre os modos', () => {
  it('começa no modo estudo', () => {
    render(<App />)
    expect(screen.getByTestId('contadores').textContent).toContain('inéditas')
  })

  it('troca para o simulado e mostra a primeira das 30', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('modo-simulado'))
    expect(screen.getByTestId('posicao').textContent).toContain(`1/${QUESTOES}`)
  })

  it('os filtros são do estudo e somem no simulado', () => {
    render(<App />)
    expect(screen.getByLabelText(/módulo/i)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('modo-simulado'))
    expect(screen.queryByLabelText(/módulo/i)).not.toBeInTheDocument()
  })
})

describe('App — a prova de ponta a ponta', () => {
  it('terminar a prova mostra a nota', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('modo-simulado'))
    fazerProvaErrando()
    expect(screen.getByTestId('nota')).toBeInTheDocument()
    expect(screen.getByTestId('veredito')).toBeInTheDocument()
  })

  it('errar no simulado alimenta a fila de revisão do estudo (critério 11)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('modo-simulado'))
    fazerProvaErrando()

    const progresso = carregarProgresso()
    const pendentes = Object.values(progresso).filter(estaPendente)
    expect(pendentes.length).toBeGreaterThan(0)
    expect(localStorage.getItem(CHAVE_PROGRESSO)).not.toBeNull()
  })

  it('a prova entra no histórico (critério 12)', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('modo-simulado'))
    fazerProvaErrando()

    const historico = carregarHistorico()
    expect(historico).toHaveLength(1)
    expect(historico[0]!.total).toBe(QUESTOES)
    expect(historico[0]!.em).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(localStorage.getItem(CHAVE_HISTORICO)).not.toBeNull()
  })

  it('nada é gravado antes de finalizar a prova', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('modo-simulado'))
    for (let i = 0; i < 5; i++) {
      fireEvent.click(opcoes()[0]!)
      fireEvent.click(screen.getByTestId('acao'))
    }
    expect(carregarProgresso()).toEqual({})
    expect(carregarHistorico()).toEqual([])
  })

  it('dá para fazer outra prova depois', () => {
    render(<App />)
    fireEvent.click(screen.getByTestId('modo-simulado'))
    fazerProvaErrando()
    fireEvent.click(screen.getByTestId('acao'))
    expect(screen.getByTestId('posicao').textContent).toContain(`1/${QUESTOES}`)
  })
})
