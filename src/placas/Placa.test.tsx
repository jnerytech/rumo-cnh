import { render, screen } from '@testing-library/react'
import { Placa } from './Placa'
import { PLACAS_DISPONIVEIS } from './acervo'

describe('Placa', () => {
  it('renderiza a imagem de um código do acervo', () => {
    const codigo = [...PLACAS_DISPONIVEIS][0]!
    render(<Placa codigo={codigo} />)
    const img = screen.getByAltText(`Placa ${codigo}`)
    expect(img).toHaveAttribute('src', `/placas/${codigo}.svg`)
  })

  it('não renderiza nada para código fora do acervo', () => {
    const { container } = render(<Placa codigo="Z-99" />)
    expect(container).toBeEmptyDOMElement()
  })
})
