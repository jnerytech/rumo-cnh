import {
  MENSAGEM_ATIVAR,
  ativarEspera,
  observarEspera,
  temEspera,
  type RegistroSW,
} from './atualizacao'

const registro = (waiting: unknown): RegistroSW =>
  ({ waiting, update: async () => {} }) as RegistroSW

describe('temEspera', () => {
  it('é falso sem registro', () => {
    expect(temEspera(null)).toBe(false)
    expect(temEspera(undefined)).toBe(false)
  })

  it('é falso quando nada está esperando', () => {
    expect(temEspera(registro(null))).toBe(false)
  })

  it('é verdadeiro quando há um service worker esperando', () => {
    expect(temEspera(registro({ postMessage: () => {} }))).toBe(true)
  })
})

describe('ativarEspera', () => {
  it('manda SKIP_WAITING para quem está esperando', () => {
    const enviadas: unknown[] = []
    const reg = registro({ postMessage: (m: unknown) => enviadas.push(m) })
    expect(ativarEspera(reg)).toBe(true)
    expect(enviadas).toEqual([{ type: MENSAGEM_ATIVAR }])
  })

  it('não faz nada, e avisa, quando não há espera', () => {
    expect(ativarEspera(registro(null))).toBe(false)
    expect(ativarEspera(null)).toBe(false)
  })

  it('chama de volta quando o worker novo termina de ATIVAR', () => {
    const ouvintes: (() => void)[] = []
    const esperando = {
      state: 'installed',
      addEventListener: (_t: string, l: () => void) => ouvintes.push(l),
      postMessage: () => {},
    }
    let ativou = 0
    ativarEspera(registro(esperando), () => ativou++)
    expect(ativou).toBe(0)

    esperando.state = 'activating'
    ouvintes.forEach((l) => l())
    expect(ativou, 'ainda não ativou').toBe(0)

    esperando.state = 'activated'
    ouvintes.forEach((l) => l())
    expect(ativou, 'agora sim').toBe(1)
  })
})

/** Registro falso que só ganha `waiting` depois de o worker novo terminar de instalar. */
function registroQueInstalaDepois() {
  const ouvintes: Record<string, (() => void)[]> = {}
  const novo = {
    state: 'installing',
    addEventListener: (t: string, l: () => void) => ((ouvintes[`w:${t}`] ??= []).push(l), undefined),
    postMessage: () => {},
  }
  const reg = {
    waiting: null as typeof novo | null,
    installing: null as typeof novo | null,
    addEventListener: (t: string, l: () => void) => ((ouvintes[t] ??= []).push(l), undefined),
    removeEventListener: () => {},
    update: async () => {
      // é isto que acontece de verdade: update() resolve com o worker ainda instalando
      reg.installing = novo
      ouvintes['updatefound']?.forEach((l) => l())
    },
  }
  const terminarInstalacao = () => {
    novo.state = 'installed'
    reg.installing = null
    reg.waiting = novo
    ouvintes['w:statechange']?.forEach((l) => l())
  }
  return { reg, terminarInstalacao }
}

describe('observarEspera', () => {
  it('avisa na hora quando já existe versão esperando', () => {
    let avisos = 0
    const { reg } = registroQueInstalaDepois()
    reg.waiting = { state: 'installed', addEventListener: () => {}, postMessage: () => {} }
    observarEspera(reg, () => avisos++)
    expect(avisos).toBe(1)
  })

  it('avisa quando a versão nova TERMINA de instalar, não quando update() resolve', async () => {
    let avisos = 0
    const { reg, terminarInstalacao } = registroQueInstalaDepois()
    observarEspera(reg, () => avisos++)
    expect(avisos).toBe(0)

    await reg.update()
    expect(avisos, 'não pode avisar enquanto ainda está instalando').toBe(0)

    terminarInstalacao()
    expect(avisos, 'tem que avisar quando termina de instalar').toBe(1)
  })

  it('devolve como parar de observar', () => {
    const { reg } = registroQueInstalaDepois()
    expect(typeof observarEspera(reg, () => {})).toBe('function')
  })
})
