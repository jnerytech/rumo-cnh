import { useCallback, useEffect, useRef, useState } from 'react'
import { ativarEspera, observarEspera, type RegistroSW } from './atualizacao'

/** Barra discreta que aparece só quando existe versão nova esperando. */
export function AvisoAtualizacao() {
  const [temNova, setTemNova] = useState(false)
  const jaRecarregou = useRef(false)
  const recarregarUmaVez = useCallback(() => {
    if (jaRecarregou.current) return
    jaRecarregou.current = true
    location.reload()
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // Referência guardada: reler navigator.serviceWorker na limpeza quebra se ele
    // deixar de existir entre montar e desmontar.
    const sw = navigator.serviceWorker
    let vivo = true

    let pararDeObservar: (() => void) | undefined

    const checar = async () => {
      const reg = (await sw.getRegistration()) as RegistroSW | undefined
      if (!reg || !vivo) return
      // Observa ANTES de pedir a atualização: quando update() resolve, o worker
      // novo costuma estar só instalando, e `waiting` ainda é null.
      pararDeObservar ??= observarEspera(reg, () => vivo && setTemNova(true))
      try {
        await reg.update()
      } catch {
        /* sem rede */
      }
    }

    // De volta para o app é o momento natural de descobrir que há versão nova.
    const aoVoltar = () => document.visibilityState === 'visible' && void checar()
    void checar()
    document.addEventListener('visibilitychange', aoVoltar)

    // A troca de controlador só acontece depois do SKIP_WAITING; recarregar aqui
    // é o que faz o código novo valer, e nunca no meio de uma prova.
    const aoTrocar = () => recarregarUmaVez()
    sw.addEventListener('controllerchange', aoTrocar)

    return () => {
      vivo = false
      pararDeObservar?.()
      document.removeEventListener('visibilitychange', aoVoltar)
      sw.removeEventListener('controllerchange', aoTrocar)
    }
  }, [recarregarUmaVez])

  const atualizar = useCallback(async () => {
    const reg = (await navigator.serviceWorker.getRegistration()) as RegistroSW | undefined
    // Segundo caminho para o recarregamento: se o controllerchange não vier,
    // o statechange do próprio worker vem.
    ativarEspera(reg, recarregarUmaVez)
  }, [recarregarUmaVez])

  if (!temNova) return null

  return (
    <button type="button" className="aviso-atualizacao" data-testid="atualizar" onClick={atualizar}>
      Nova versão disponível — atualizar
    </button>
  )
}
