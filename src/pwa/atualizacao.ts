/**
 * Atualização do app sob comando, não por surpresa.
 *
 * O service worker novo instala e fica esperando. Sem isto, ele só assumiria
 * quando todas as abas do site fossem fechadas — o usuário ficaria na versão
 * velha sem nunca saber que existe outra. E com atualização automática o
 * contrário acontece: a página recarrega sozinha, e no meio de um simulado de 30
 * questões isso perde a prova, porque o estado dela vive em memória.
 */
export const MENSAGEM_ATIVAR = 'SKIP_WAITING'

/** Só o que este módulo usa do ServiceWorker e do registro. */
export type TrabalhadorSW = {
  state: string
  addEventListener: (tipo: 'statechange', ouvinte: () => void) => void
  postMessage: (mensagem: unknown) => void
}

export type RegistroSW = {
  waiting: TrabalhadorSW | null
  installing: TrabalhadorSW | null
  addEventListener: (tipo: 'updatefound', ouvinte: () => void) => void
  removeEventListener: (tipo: 'updatefound', ouvinte: () => void) => void
  update: () => Promise<unknown>
}

export function temEspera(reg: RegistroSW | null | undefined): boolean {
  return reg?.waiting != null
}

/**
 * Avisa quando existe — ou passa a existir — uma versão esperando.
 *
 * Não basta chamar `update()` e ler `waiting` na linha seguinte: quando a
 * promessa resolve, o worker novo em geral ainda está em `installing`, e
 * `waiting` só é preenchido depois que ele termina. Ler cedo demais devolve
 * false para sempre, e o usuário nunca fica sabendo da versão nova.
 */
export function observarEspera(reg: RegistroSW, aoDetectar: () => void): () => void {
  const conferir = () => {
    if (reg.waiting != null) aoDetectar()
  }
  conferir()

  const aoAcharAtualizacao = () => {
    const novo = reg.installing
    if (novo == null) {
      conferir()
      return
    }
    novo.addEventListener('statechange', () => {
      if (novo.state === 'installed') conferir()
    })
  }

  reg.addEventListener('updatefound', aoAcharAtualizacao)
  return () => reg.removeEventListener('updatefound', aoAcharAtualizacao)
}

/**
 * Pede ao service worker em espera que assuma, e chama `aoAtivar` quando ele
 * termina de ativar.
 *
 * O retorno de chamada existe porque `controllerchange` sozinho não é
 * confiável: se o worker novo não reivindicar as páginas abertas, ele ativa,
 * a página fica SEM controlador, o evento nunca dispara e o usuário continua no
 * código velho achando que atualizou. Medido num navegador de verdade.
 */
export function ativarEspera(
  reg: RegistroSW | null | undefined,
  aoAtivar?: () => void,
): boolean {
  const esperando = reg?.waiting
  if (esperando == null) return false
  if (aoAtivar) {
    esperando.addEventListener('statechange', () => {
      if (esperando.state === 'activated') aoAtivar()
    })
  }
  esperando.postMessage({ type: MENSAGEM_ATIVAR })
  return true
}
