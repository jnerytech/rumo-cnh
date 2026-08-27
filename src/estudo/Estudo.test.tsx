import { fireEvent, render, screen, within } from '@testing-library/react'
import { Estudo } from './Estudo'
import { carregarQuestoes } from '../dados/carregar'
import { salvarProgresso } from './persistencia'

// fireEvent em vez de user-event: não vale adicionar dependência para clicar num botão.

beforeEach(() => localStorage.clear())

const opcoes = () => screen.getAllByRole('button', { name: /^[A-D]\./ })
const corretas = () => document.querySelectorAll('[data-correta]')
const escolhida = () => document.querySelector('[data-escolhida]')

describe('Estudo', () => {
  it('mostra enunciado e quatro opções', () => {
    render(<Estudo />)
    expect(screen.getByTestId('enunciado')).not.toBeEmptyDOMElement()
    expect(opcoes()).toHaveLength(4)
  })

  it('não revela o comentário antes de responder (critério 10)', () => {
    render(<Estudo />)
    expect(screen.queryByTestId('comentario')).not.toBeInTheDocument()
    expect(screen.queryByTestId('acao')).not.toBeInTheDocument()
  })

  it('responder revela o comentário e marca a correta', () => {
    render(<Estudo />)
    fireEvent.click(opcoes()[0]!)
    expect(screen.getByTestId('comentario')).toBeInTheDocument()
    expect(corretas()).toHaveLength(1)
  })

  it('a resposta não pode ser trocada depois de escolhida', () => {
    render(<Estudo />)
    fireEvent.click(opcoes()[0]!)
    const escolhidaAntes = escolhida()?.textContent
    expect(escolhidaAntes).toBe(opcoes()[0]!.textContent)
    fireEvent.click(opcoes()[2]!)
    expect(escolhida()?.textContent).toBe(escolhidaAntes)
  })

  it('avançar só aparece depois de responder e troca a questão', () => {
    render(<Estudo />)
    const antes = screen.getByTestId('enunciado').textContent
    fireEvent.click(opcoes()[0]!)
    fireEvent.click(screen.getByTestId('acao'))
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

describe('Estudo — teclado (critério 11)', () => {
  it('teclas 1 a 4 respondem, igual a clicar', () => {
    render(<Estudo />)
    fireEvent.keyDown(window, { key: '2' })
    expect(screen.getByTestId('comentario')).toBeInTheDocument()
    expect(corretas()).toHaveLength(1)
  })

  it('cada tecla escolhe a opção correspondente', () => {
    render(<Estudo />)
    const textoTerceira = screen.getAllByRole('button', { name: /^[A-D]\./ })[2]!.textContent
    fireEvent.keyDown(window, { key: '3' })
    expect(escolhida()?.textContent).toBe(textoTerceira)
  })

  it('Enter avança depois de responder', () => {
    render(<Estudo />)
    const antes = screen.getByTestId('enunciado').textContent
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('enunciado').textContent).not.toBe(antes)
  })

  it('Enter antes de responder não faz nada', () => {
    render(<Estudo />)
    const antes = screen.getByTestId('enunciado').textContent
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('enunciado').textContent).toBe(antes)
  })

  it('não responde duas vezes se a tecla for repetida', () => {
    render(<Estudo />)
    const textoPrimeira = screen.getAllByRole('button', { name: /^[A-D]\./ })[0]!.textContent
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: '4' })
    expect(escolhida()?.textContent).toBe(textoPrimeira)
  })

  it('Enter com o botão focado não pula duas questões', () => {
    render(<Estudo />)
    fireEvent.keyDown(window, { key: '1' })
    const botao = screen.getByTestId('acao')
    const antes = screen.getByTestId('enunciado').textContent
    fireEvent.keyDown(botao, { key: 'Enter' })
    // O handler global ignora; quem avança é o clique nativo do botão.
    expect(screen.getByTestId('enunciado').textContent).toBe(antes)
    fireEvent.click(botao)
    expect(screen.getByTestId('enunciado').textContent).not.toBe(antes)
  })
})
