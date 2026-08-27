import { useEffect } from 'react'

export type Atalhos = {
  responder?: (indice: number) => void
  avancar?: () => void
}

/** `1`–`4` e `a`–`d` apontam para os mesmos índices: o rótulo na tela é A–D. */
const TECLAS = ['1', '2', '3', '4', 'a', 'b', 'c', 'd']

/** Atalhos compartilhados pelos dois modos — a prova e o estudo se dirigem igual. */
export function useAtalhos({ responder, avancar }: Atalhos) {
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      // `e.target` pode ser a window ou o document, que não têm closest().
      const alvo = e.target instanceof Element ? e.target : null
      const tag = alvo?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return

      const posicao = TECLAS.indexOf(e.key.toLowerCase())
      if (posicao >= 0) {
        e.preventDefault()
        responder?.(posicao % 4)
        return
      }
      if (e.key === 'Enter' || e.key === ' ') {
        // Só o botão que JÁ avança por conta própria é ignorado, senão o atalho
        // avançaria duas questões. Ignorar qualquer botão faria o foco em
        // "trocar de modo" ou "zerar" engolir o Enter — bug que aconteceu.
        if (alvo?.closest('[data-avanca]')) return
        e.preventDefault()
        avancar?.()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [responder, avancar])
}
