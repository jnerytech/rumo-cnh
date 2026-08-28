import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AvisoAtualizacao } from './AvisoAtualizacao'

/** Worker falso, com o mínimo que ativarEspera usa. */
const trabalhador = (registro: unknown[] = []) => ({
  state: 'installed',
  addEventListener: () => {},
  postMessage: (m: unknown) => registro.push(m),
})

/** Instala um navigator.serviceWorker falso e devolve como desinstalar. */
function comServiceWorker(waiting: ReturnType<typeof trabalhador> | null) {
  const registro = {
    waiting,
    installing: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    update: async () => {},
  }
  const ouvintes: Record<string, (() => void)[]> = {}
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: async () => registro,
      addEventListener: (t: string, l: () => void) => (ouvintes[t] ??= []).push(l),
      removeEventListener: () => {},
    },
  })
  return () => Reflect.deleteProperty(navigator, 'serviceWorker')
}

describe('AvisoAtualizacao', () => {
  it('não mostra nada em navegador sem service worker', async () => {
    render(<AvisoAtualizacao />)
    await waitFor(() => expect(screen.queryByTestId('atualizar')).not.toBeInTheDocument())
  })

  it('não mostra nada quando não há versão esperando', async () => {
    const limpar = comServiceWorker(null)
    render(<AvisoAtualizacao />)
    await waitFor(() => expect(screen.queryByTestId('atualizar')).not.toBeInTheDocument())
    limpar()
  })

  it('oferece atualizar quando uma versão nova está esperando', async () => {
    const limpar = comServiceWorker(trabalhador())
    render(<AvisoAtualizacao />)
    await waitFor(() => expect(screen.getByTestId('atualizar')).toBeInTheDocument())
    expect(screen.getByTestId('atualizar').textContent).toMatch(/nova versão/i)
    limpar()
  })

  it('tocar em atualizar manda o service worker assumir', async () => {
    const enviadas: unknown[] = []
    const limpar = comServiceWorker(trabalhador(enviadas))
    render(<AvisoAtualizacao />)
    await waitFor(() => screen.getByTestId('atualizar'))
    fireEvent.click(screen.getByTestId('atualizar'))
    await waitFor(() => expect(enviadas).toEqual([{ type: 'SKIP_WAITING' }]))
    limpar()
  })
})
