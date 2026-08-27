import { render, screen } from '@testing-library/react'
import { Placa } from './Placa'
import { PLACAS_DISPONIVEIS } from './acervo'

describe('Placa', () => {
  it('monta o caminho a partir do BASE_URL, não da raiz', () => {
    const codigo = [...PLACAS_DISPONIVEIS][0]!
    render(<Placa codigo={codigo} />)
    const src = screen.getByAltText(`Placa ${codigo}`).getAttribute('src')!
    expect(src.endsWith(`placas/${codigo}.svg`)).toBe(true)
    expect(src.startsWith(import.meta.env.BASE_URL)).toBe(true)
  })

  it('renderiza a imagem de um código do acervo', () => {
    const codigo = [...PLACAS_DISPONIVEIS][0]!
    render(<Placa codigo={codigo} />)
    const img = screen.getByAltText(`Placa ${codigo}`)
    expect(img).toHaveAttribute('src', `${import.meta.env.BASE_URL}placas/${codigo}.svg`)
  })

  it('não renderiza nada para código fora do acervo', () => {
    const { container } = render(<Placa codigo="Z-99" />)
    expect(container).toBeEmptyDOMElement()
  })
})
