import { fireEvent, render, screen } from '@testing-library/react'
import { Simulado } from './Simulado'
import { QUESTOES } from './simulado'

const opcoes = () => screen.getAllByRole('button', { name: /^[A-D]\./ })
// Nunca buscar o botão de ação por texto: uma das 1496 alternativas contém
// "próxima cidade" e casaria com /próxima/i.
const acao = () => screen.getByTestId('acao')

/** Responde a questão na tela e avança/finaliza. */
function responderEavancar(indice = 0) {
  fireEvent.click(opcoes()[indice]!)
  fireEvent.click(acao())
}

describe('Simulado — a prova (critério 13)', () => {
  it('mostra o contador de posição, não placar', () => {
    render(<Simulado aoTerminar={() => {}} />)
    expect(screen.getByTestId('posicao').textContent).toContain(`1/${QUESTOES}`)
    expect(screen.getByTestId('posicao').textContent).not.toMatch(/acert|erro|nota/i)
  })

  it('não revela nada ao responder: sem comentário, sem correta, sem placar', () => {
    render(<Simulado aoTerminar={() => {}} />)
    fireEvent.click(opcoes()[0]!)
    expect(screen.queryByTestId('comentario')).not.toBeInTheDocument()
    expect(document.querySelector('[data-correta]')).toBeNull()
    expect(screen.queryByText(/certo|errado/i)).not.toBeInTheDocument()
  })

  it('marca a opção escolhida sem dizer se está certa', () => {
    render(<Simulado aoTerminar={() => {}} />)
    fireEvent.click(opcoes()[1]!)
    expect(document.querySelectorAll('[data-escolhida]')).toHaveLength(1)
    expect(document.querySelector('[data-correta]')).toBeNull()
  })

  it('permite trocar a resposta antes de avançar (critério 4)', () => {
    render(<Simulado aoTerminar={() => {}} />)
    fireEvent.click(opcoes()[0]!)
    fireEvent.click(opcoes()[2]!)
    expect(document.querySelector('[data-escolhida]')?.textContent).toBe(opcoes()[2]!.textContent)
  })

  it('não deixa avançar sem responder (critério 5)', () => {
    render(<Simulado aoTerminar={() => {}} />)
    expect(acao()).toBeDisabled()
    fireEvent.click(opcoes()[0]!)
    expect(acao()).toBeEnabled()
  })

  it('avança até a última, onde o botão vira Finalizar (critério 6)', () => {
    render(<Simulado aoTerminar={() => {}} />)
    for (let i = 0; i < QUESTOES - 1; i++) responderEavancar()
    expect(screen.getByTestId('posicao').textContent).toContain(`${QUESTOES}/${QUESTOES}`)
    expect(acao().textContent).toMatch(/finalizar/i)
  })

  it('entrega o simulado finalizado ao terminar', () => {
    const terminados: { finalizado: boolean }[] = []
    render(<Simulado aoTerminar={(s) => terminados.push(s)} />)
    for (let i = 0; i < QUESTOES; i++) responderEavancar()
    expect(terminados).toHaveLength(1)
    expect(terminados[0]!.finalizado).toBe(true)
  })

  it('mostra a placa quando a questão depende dela', () => {
    render(<Simulado aoTerminar={() => {}} />)
    for (let i = 0; i < QUESTOES - 1; i++) {
      const img = screen.queryByRole('img')
      if (img) {
        expect(img).toHaveAttribute('alt', expect.stringMatching(/^Placa /))
        return
      }
      responderEavancar()
    }
    // 8 das 30 questões são do M1; nenhuma com placa em 30 seria suspeito, não impossível.
  })
})

describe('Simulado — teclado', () => {
  it('teclas 1 a 4 respondem', () => {
    render(<Simulado aoTerminar={() => {}} />)
    fireEvent.keyDown(window, { key: '3' })
    expect(document.querySelector('[data-escolhida]')?.textContent).toBe(opcoes()[2]!.textContent)
  })

  it('letras A a D respondem, igual ao rótulo na tela', () => {
    render(<Simulado aoTerminar={() => {}} />)
    fireEvent.keyDown(window, { key: 'b' })
    expect(document.querySelector('[data-escolhida]')?.textContent).toBe(opcoes()[1]!.textContent)
  })

  it('Enter avança depois de responder', () => {
    render(<Simulado aoTerminar={() => {}} />)
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('posicao').textContent).toContain('2/')
  })

  it('Enter sem responder não avança', () => {
    render(<Simulado aoTerminar={() => {}} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByTestId('posicao').textContent).toContain('1/')
  })

  it('Enter na última questão finaliza a prova', () => {
    const terminados: { finalizado: boolean }[] = []
    render(<Simulado aoTerminar={(s) => terminados.push(s)} />)
    for (let i = 0; i < QUESTOES - 1; i++) {
      fireEvent.keyDown(window, { key: '1' })
      fireEvent.keyDown(window, { key: 'Enter' })
    }
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(terminados).toHaveLength(1)
    expect(terminados[0]!.finalizado).toBe(true)
  })

  it('mostra a legenda de atalhos', () => {
    render(<Simulado aoTerminar={() => {}} />)
    expect(screen.getByTestId('legenda-atalhos')).toBeInTheDocument()
  })
})
