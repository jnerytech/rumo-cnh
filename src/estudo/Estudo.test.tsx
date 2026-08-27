import { fireEvent, render, screen, within } from '@testing-library/react'
import { Estudo } from './Estudo'
import { carregarQuestoes } from '../dados/carregar'
import { salvarProgresso } from './persistencia'

// fireEvent em vez de user-event: não vale adicionar dependência para clicar num botão.

beforeEach(() => localStorage.clear())

const opcoes = () => screen.getAllByRole('button', { name: /^[A-D]\./ })

describe('Estudo', () => {
  it('mostra enunciado e quatro opções', () => {
    render(<Estudo />)
    expect(screen.getByTestId('enunciado')).not.toBeEmptyDOMElement()
    expect(opcoes()).toHaveLength(4)
  })

  it('não revela o comentário antes de responder (critério 10)', () => {
    render(<Estudo />)
    expect(screen.queryByTestId('comentario')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /próxima/i })).not.toBeInTheDocument()
  })

  it('responder revela o comentário e marca a correta', () => {
    render(<Estudo />)
    fireEvent.click(opcoes()[0]!)
    expect(screen.getByTestId('comentario')).toBeInTheDocument()
    expect(screen.getAllByTestId('opcao-correta')).toHaveLength(1)
  })

  it('a resposta não pode ser trocada depois de escolhida', () => {
    render(<Estudo />)
    fireEvent.click(opcoes()[0]!)
    const escolhidaAntes = screen.getByTestId('opcao-escolhida').textContent
    fireEvent.click(opcoes()[2]!)
    expect(screen.getByTestId('opcao-escolhida').textContent).toBe(escolhidaAntes)
  })

  it('avançar só aparece depois de responder e troca a questão', () => {
    render(<Estudo />)
    const antes = screen.getByTestId('enunciado').textContent
    fireEvent.click(opcoes()[0]!)
    fireEvent.click(screen.getByRole('button', { name: /próxima/i }))
    expect(screen.getByTestId('enunciado').textContent).not.toBe(antes)
    expect(screen.queryByTestId('comentario')).not.toBeInTheDocument()
  })

  it('mostra a placa quando a questão depende dela', () => {
    // Determinístico de propósito: em vez de clicar até topar com uma questão visual,
    // marca todas as sem-imagem como dominadas, então a primeira inédita é uma com placa.
    // Clicar às cegas nunca chegaria lá — a fila devolve as erradas antes das inéditas.
    const progresso = Object.fromEntries(
      carregarQuestoes()
        .filter((q) => !q.requerImagem)
        .map((q) => [q.id, { id: q.id, vistas: 2, erros: 0, acertosSeguidos: 2 }]),
    )
    salvarProgresso(progresso)

    render(<Estudo />)
    const placa = screen.getByRole('img')
    expect(placa).toHaveAttribute('alt', expect.stringMatching(/^Placa /))
  })

  it('mostra o contador de inéditas e pendentes', () => {
    render(<Estudo />)
    const contador = screen.getByTestId('contadores')
    expect(within(contador).getByText(/1496/)).toBeInTheDocument()
  })
})
