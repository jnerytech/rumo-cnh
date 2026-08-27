import { fireEvent, render, screen } from '@testing-library/react'
import { App } from '../App'

beforeEach(() => localStorage.clear())

describe('Filtros', () => {
  it('começa em Todos e mostra as 1496 questões', () => {
    render(<App />)
    expect(screen.getByLabelText(/módulo/i)).toHaveValue('')
    expect(screen.getByTestId('contadores').textContent).toContain('1496')
  })

  it('escolher módulo troca a questão e o total', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText(/módulo/i), { target: { value: '2' } })
    expect(screen.getByTestId('contadores').textContent).toContain('205')
    expect(screen.getByTestId('contadores').textContent).toContain('Escolhas e Consequências')
  })

  it('escolher dificuldade combina com o módulo', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText(/dificuldade/i), { target: { value: 'Difícil' } })
    expect(screen.getByTestId('contadores').textContent).toContain('224')
    fireEvent.change(screen.getByLabelText(/módulo/i), { target: { value: '1' } })
    expect(screen.getByTestId('contadores').textContent).toContain('Placas, Cores e Caminhos')
  })

  it('voltar para Todos restaura o banco inteiro', () => {
    render(<App />)
    const seletor = screen.getByLabelText(/módulo/i)
    fireEvent.change(seletor, { target: { value: '3' } })
    expect(screen.getByTestId('contadores').textContent).toContain('619')
    fireEvent.change(seletor, { target: { value: '' } })
    expect(screen.getByTestId('contadores').textContent).toContain('1496')
  })

  it('os filtros continuam na tela mesmo sem questão no recorte', () => {
    render(<App />)
    // Os filtros vivem fora de Estudo, então não desaparecem junto com a questão.
    expect(screen.getByLabelText(/módulo/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/módulo/i), { target: { value: '4' } })
    expect(screen.getByLabelText(/módulo/i)).toBeInTheDocument()
  })
})
